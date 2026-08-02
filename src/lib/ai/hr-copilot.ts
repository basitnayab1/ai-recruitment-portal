import "server-only";

import {
  getGroqClient,
  GROQ_LIGHTWEIGHT_MODEL,
  GROQ_MODEL,
} from "@/lib/ai/groq";
import { planWithLLM, type LlmAgentPlan } from "@/lib/ai/agent-llm-planner";
import { buildAgentPlan, flattenPlanTools, type AgentPlan } from "@/lib/ai/agent-planner";
import {
  formatDeterministicToolAnswer,
  safeStringifyContext,
} from "@/lib/ai/copilot-answer-formatters";
import {
  estimatePayloadBytes,
  logCopilotDebug,
  summarizeToolRows,
} from "@/lib/ai/copilot-debug";
import {
  executeCopilotTool,
  isEmptyToolContext,
  type CopilotToolCall,
  type CopilotToolName,
  type CopilotToolResult,
} from "@/lib/ai/hr-tools";
import {
  HR_COPILOT_ANSWER_SYSTEM_PROMPT,
  HR_COPILOT_TEMPERATURE,
} from "@/lib/ai/system-prompt";
import { describeMissingLiveTables } from "@/lib/ai/workflow-agent-report";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CopilotChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type HRCopilotResponse = {
  answer: string;
  toolsUsed: CopilotToolName[];
  intent: string;
  confidence: number;
  needsClarification?: boolean;
  finalDecision?: string | null;
  executionPlan?: string[];
  planner?: string;
};

function isRateLimitError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const message = String((error as { message?: string })?.message ?? error);
  return status === 429 || /rate limit/i.test(message);
}

/** Trim bulky fields before sending to Groq to minimize tokens. */
function compactToolResults(results: CopilotToolResult[]): unknown[] {
  return results.map((result) => {
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(safeStringifyContext(result)) as Record<string, unknown>;
    } catch (error) {
      console.error("[ai/hr-copilot] compactToolResults failed for", result.tool, error);
      throw error;
    }

    const trimList = (key: string, max: number) => {
      const value = json[key];
      if (Array.isArray(value) && value.length > max) {
        json[key] = value.slice(0, max);
        json[`${key}Truncated`] = true;
      }
    };

    trimList("candidates", 12);
    trimList("applications", 12);
    trimList("jobs", 12);
    trimList("interviews", 12);
    trimList("analyses", 10);
    trimList("rankings", 10);
    trimList("comparisonTable", 6);
    trimList("priorities", 10);
    trimList("alerts", 15);
    trimList("predictions", 8);
    trimList("recommendations", 8);
    trimList("assessments", 8);
    trimList("explanations", 5);
    trimList("reports", 3);

    return json;
  });
}

function extractFinalDecision(results: CopilotToolResult[]): string | null {
  for (const result of results) {
    if (result.tool === "getHiringRecommendation") {
      if (result.recommendationLabel) return result.recommendationLabel;
      if (result.decision) return result.decision;
    }
    if (result.tool === "generateDecisionReport" && result.reports[0]?.finalRecommendation) {
      return result.reports[0].finalRecommendation;
    }
    if (result.tool === "compareCandidates" && result.betterCandidate) {
      return `Prefer ${result.betterCandidate}`;
    }
    if (result.tool === "getInterviewPriority" && result.priorities[0]) {
      return `Interview first: ${result.priorities[0].candidateName}`;
    }
    if (result.tool === "matchJobCandidates" && result.rankings[0]) {
      return `Best match: ${result.rankings[0].candidateName}`;
    }
    if (result.tool === "searchAIRanking" && result.rankings[0]) {
      return `Top ranked: ${result.rankings[0].candidateName}`;
    }
  }
  return null;
}

async function executeToolCalls(
  tools: CopilotToolCall[],
  client?: SupabaseClient
): Promise<CopilotToolResult[]> {
  if (tools.length === 0) return [];

  // Independent Supabase reads — run in parallel for speed.
  console.log(
    "Tools Called:",
    tools.map((t) => t.tool)
  );
  for (const call of tools) {
    console.log("[pipeline] executeToolCalls params", call.tool, call.params ?? {});
    logCopilotDebug("Supabase Queries", { tool: call.tool, params: call.params ?? {} });
  }

  return Promise.all(
    tools.map(async (call) => {
      try {
        const result = await executeCopilotTool(call, client);
        const rows =
          "rankings" in result && Array.isArray(result.rankings)
            ? result.rankings.length
            : "analyses" in result && Array.isArray(result.analyses)
              ? result.analyses.length
              : "count" in result
                ? result.count
                : "?";
        console.log(`[pipeline] ${call.tool}() -> ${rows} rows`);
        return result;
      } catch (error) {
        console.error(`[ai/hr-copilot] Tool failed: ${call.tool}`, error);
        if (error instanceof Error) console.error(error.stack);
        throw error;
      }
    })
  );
}

function llmPlanToAgentPlan(plan: LlmAgentPlan): AgentPlan {
  return {
    intent: plan.needsClarification ? "clarify" : "llm_agent",
    goal: plan.goal,
    informationNeeded: plan.informationNeeded,
    confidence: Math.round(plan.confidence * 100),
    clarificationQuestion: plan.clarificationQuestion,
    phases:
      plan.tools.length === 0
        ? []
        : [
            {
              name: "llm_selected_tools",
              parallel: true,
              tools: plan.tools,
            },
          ],
  };
}

/**
 * Resolve an execution plan.
 * Primary: LLM decides tools from natural language + memory.
 * Fallback: deterministic planner only if LLM planning fails open.
 */
export async function resolveAgentPlan(
  message: string,
  history: CopilotChatMessage[] = []
): Promise<AgentPlan & { planner: string }> {
  try {
    const llmPlan = await planWithLLM(message, history);

    // LLM selected tools — primary ChatGPT-style path
    if (!llmPlan.needsClarification && llmPlan.tools.length > 0) {
      const plan = llmPlanToAgentPlan(llmPlan);
      return { ...plan, planner: llmPlan.planner };
    }
  } catch (error) {
    console.error("[ai/hr-copilot] LLM planner error, using fallback:", error);
  }

  // Empty / clarify / rate-limit → NL multi-tool fallback before asking the user
  const fallback = buildAgentPlan(message, history);
  if (flattenPlanTools(fallback).length > 0) {
    return { ...fallback, planner: "fallback" };
  }

  return {
    ...fallback,
    planner: "fallback",
  };
}

/**
 * Autonomous HR Agent:
 * natural language → LLM tool selection → Supabase tools → Groq answer over live data only.
 */
export async function runHRCopilot(
  message: string,
  history: CopilotChatMessage[] = [],
  options?: { supabase?: SupabaseClient }
): Promise<HRCopilotResponse> {
  const started = Date.now();
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Please enter a question for the HR Copilot.");
  }

  // After requireHRUser() in the server action, use the service-role client so
  // AI ranking/analysis tables are never silently emptied by missing RLS context.
  const supabase = options?.supabase ?? createAdminClient();
  console.log("[pipeline] runHRCopilot() start", { message: trimmed });

  const plan = await resolveAgentPlan(trimmed, history);
  const toolsPlanned = flattenPlanTools(plan);

  console.log("Intent:", plan.intent);
  console.log("Planner:", plan.planner);
  console.log("Execution Plan:", plan.phases.map((p) => p.name));
  console.log(
    "Tools Called (planned):",
    toolsPlanned.map((t) => t.tool)
  );
  console.log(
    "[pipeline] planned tool params ->",
    toolsPlanned.map((t) => ({ tool: t.tool, params: t.params ?? {} }))
  );
  logCopilotDebug("Intent", {
    intent: plan.intent,
    confidence: plan.confidence,
    goal: plan.goal,
    planner: plan.planner,
    informationNeeded: plan.informationNeeded,
  });

  if (plan.intent === "clarify" || plan.phases.length === 0 || toolsPlanned.length === 0) {
    const executionMs = Date.now() - started;
    console.log("Rows Returned:", 0);
    console.log("Groq Response Time:", "skipped");
    console.log("Total Execution Time:", `${executionMs}ms`);

    return {
      answer:
        plan.clarificationQuestion ??
        "I'm not sure what you need. Ask any hiring or recruitment question in plain language.",
      toolsUsed: [],
      intent: "clarify",
      confidence: plan.confidence,
      needsClarification: true,
      finalDecision: null,
      executionPlan: [],
      planner: plan.planner,
    };
  }

  const toolResults = await executeToolCalls(toolsPlanned, supabase);
  const rowSummary = summarizeToolRows(toolResults);
  const totalRows = Object.values(rowSummary).reduce((a, b) => a + b, 0);
  console.log("[pipeline] toolResults summary ->", rowSummary);
  console.log("Rows Returned:", totalRows);
  logCopilotDebug("Rows Returned", rowSummary);

  const finalDecision = extractFinalDecision(toolResults);
  console.log("Final Decision:", finalDecision);

  // Prefer deterministic answers built from live tool rows (ranking / resume / hire)
  // BEFORE the empty-context short-circuit, so ranking never gets wiped by a bad count.
  const structured = formatDeterministicToolAnswer(trimmed, toolResults);
  console.log(
    "[pipeline] structured answer ->",
    structured ? `${structured.length} chars` : null
  );

  const prefersStructured =
    Boolean(structured) &&
    toolsPlanned.some((t) =>
      [
        "searchAIRanking",
        "searchRanking",
        "searchResumeAnalysis",
        "searchAnalysis",
        "getHiringRecommendation",
        "compareCandidates",
        "explainAIDecision",
        "getSalaryRecommendation",
        "analyzeSkillGaps",
        "getInterviewPriority",
        "searchJobs",
        "searchApplications",
        "getCandidateProfile",
        "searchCandidates",
        "matchJobCandidates",
        "getDashboardStats",
        "getHRAnalytics",
        "getSmartAlerts",
        "searchInterviews",
        "analyzeHiringRisks",
        "generateAgentEmail",
      ].includes(t.tool)
    );

  if (structured && prefersStructured) {
    const executionMs = Date.now() - started;
    console.log("[pipeline] returning structured ranking/resume/hire answer");
    console.log("Groq Response Time:", "skipped (structured tool answer)");
    console.log("Total Execution Time:", `${executionMs}ms`);
    return {
      answer: structured,
      toolsUsed: toolsPlanned.map((t) => t.tool),
      intent: String(plan.intent),
      confidence: plan.confidence,
      finalDecision,
      executionPlan: plan.phases.map((p) => p.name),
      planner: plan.planner,
    };
  }

  if (isEmptyToolContext(toolResults)) {
    const executionMs = Date.now() - started;
    console.log("[pipeline] EMPTY CONTEXT — no usable rows after tools");
    console.log("Groq Response Time:", "skipped");
    console.log("Total Execution Time:", `${executionMs}ms`);
    return {
      answer: [
        "I couldn’t answer from live Supabase evidence for that question.",
        describeMissingLiveTables(toolResults),
        "",
        "Try naming a candidate or role after AI Resume Analysis / ranking exists (for example: “Who should I hire for Developer?”).",
      ].join("\n"),
      toolsUsed: toolsPlanned.map((t) => t.tool),
      intent: String(plan.intent),
      confidence: plan.confidence,
      finalDecision,
      executionPlan: plan.phases.map((p) => p.name),
      planner: plan.planner,
    };
  }

  const groqStarted = Date.now();
  let answer: string;
  try {
    answer = await generateAgentAnswer(
      trimmed,
      history,
      toolResults,
      plan,
      finalDecision
    );
  } catch (error) {
    console.error("[ai/hr-copilot] Groq answer failed:", error);
    if (error instanceof Error) console.error(error.stack);

    const fallbackAnswer =
      structured ??
      formatDeterministicToolAnswer(trimmed, toolResults) ??
      (finalDecision
        ? `Based on live Supabase data: ${finalDecision}`
        : totalRows > 0
          ? "I retrieved live Supabase records for this question, but the answer model is temporarily unavailable (rate limit). Please retry in a moment, or ask a more specific follow-up about ranking, resume analysis, or salary."
          : null);

    if (fallbackAnswer) {
      console.log("Groq Response Time:", "failed — used structured/tool fallback");
      return {
        answer: fallbackAnswer,
        toolsUsed: toolsPlanned.map((t) => t.tool),
        intent: String(plan.intent),
        confidence: plan.confidence,
        finalDecision,
        executionPlan: plan.phases.map((p) => p.name),
        planner: plan.planner,
      };
    }

    throw error;
  }
  const groqMs = Date.now() - groqStarted;
  const executionMs = Date.now() - started;

  console.log("Groq Response Time:", `${groqMs}ms`);
  console.log("Total Execution Time:", `${executionMs}ms`);

  logCopilotDebug("Execution Complete", {
    intent: plan.intent,
    planner: plan.planner,
    tools: toolsPlanned.map((t) => t.tool),
    returnedRows: totalRows,
    groqMs,
    executionMs,
    finalDecision,
  });

  return {
    answer,
    toolsUsed: toolsPlanned.map((t) => t.tool),
    intent: String(plan.intent),
    confidence: plan.confidence,
    finalDecision,
    executionPlan: plan.phases.map((p) => p.name),
    planner: plan.planner,
  };
}

async function generateAgentAnswer(
  message: string,
  history: CopilotChatMessage[],
  toolResults: CopilotToolResult[],
  plan: AgentPlan,
  finalDecision: string | null
): Promise<string> {
  const client = getGroqClient();
  const compactData = compactToolResults(toolResults);

  const contextPayload = {
    goal: plan.goal,
    confidence: plan.confidence,
    finalDecision,
    sourceOfTruth: "supabase",
    toolsExecuted: plan.phases.flatMap((p) => p.tools.map((t) => t.tool)),
    data: compactData,
  };

  const contextJson = safeStringifyContext(contextPayload);
  const groqPayloadBytes = estimatePayloadBytes(contextPayload);
  console.log("Groq Prompt Size:", groqPayloadBytes);
  logCopilotDebug("Groq Prompt Size", { bytes: groqPayloadBytes });

  const historyMessages = history.slice(-10).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const messages = [
    { role: "system" as const, content: HR_COPILOT_ANSWER_SYSTEM_PROMPT },
    ...historyMessages,
    {
      role: "user" as const,
      content:
        `Question: ${message}\n` +
        `Agent goal: ${plan.goal}\n` +
        `Live Supabase tool results (compact JSON). Answer like an experienced HR manager. ` +
        `Use ONLY this data. If a field is missing, say it was unavailable. Never invent rows.\n` +
        contextJson,
    },
  ];

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: HR_COPILOT_TEMPERATURE,
      messages,
    });
  } catch (error) {
    if (!isRateLimitError(error)) throw error;
    console.error(
      "[ai/hr-copilot] Answer model rate-limited; retrying with lightweight model:",
      error
    );
    completion = await client.chat.completions.create({
      model: GROQ_LIGHTWEIGHT_MODEL,
      temperature: HR_COPILOT_TEMPERATURE,
      messages,
    });
  }

  logCopilotDebug("Groq Tokens", {
    promptTokens: completion.usage?.prompt_tokens ?? null,
    completionTokens: completion.usage?.completion_tokens ?? null,
    totalTokens: completion.usage?.total_tokens ?? null,
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("HR Copilot returned an empty response.");
  }
  return answer;
}

export class HRCopilotError extends Error {
  override name = "HRCopilotError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export type { AgentPlan } from "@/lib/ai/agent-planner";
export { buildAgentPlan } from "@/lib/ai/agent-planner";
export type { LlmAgentPlan } from "@/lib/ai/agent-llm-planner";
