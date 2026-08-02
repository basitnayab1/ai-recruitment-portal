import "server-only";

import {
  getGroqClient,
  GROQ_LIGHTWEIGHT_MODEL,
  GROQ_MODEL,
} from "@/lib/ai/groq";
import { parseModelJsonResponse } from "@/lib/ai/parse-json";
import {
  HR_AGENT_TOOL_DEFINITIONS,
  isKnownAgentTool,
} from "@/lib/ai/agent-tool-catalog";
import {
  sanitizeAiListFilter,
  type CopilotToolCall,
  type CopilotToolName,
} from "@/lib/ai/hr-tools";
import {
  extractContextFromHistory,
  type FollowUpHistoryMessage,
} from "@/lib/ai/copilot-followup";
import { logCopilotDebug } from "@/lib/ai/copilot-debug";

export type LlmAgentPlan = {
  goal: string;
  informationNeeded: string[];
  tools: CopilotToolCall[];
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  focusCandidate?: string | null;
  focusJob?: string | null;
  planner: "llm" | "llm-tools" | "fallback";
};

const PLANNER_SYSTEM = `You are the planning brain of RecruitAI, an autonomous HR agent (ChatGPT-style).

Read the user's natural-language question + conversation memory. Decide which Supabase tools to run.
Users never mention tools. Infer intent freely. Never invent data — tools fetch live rows.

TOOL SELECTION PRINCIPLES
- Prefer COMPLETE evidence packs over single list tools.
- For ANY resume / hire / score / skills / strengths / summarize / compare / role-fit / interview / shortlist question → ALWAYS load this pack together:
  searchResumeAnalysis + searchAIRanking + searchApplications + searchJobs + getCandidateProfile
  (plus getHiringRecommendation / explainAIDecision / analyzeSkillGaps / compareCandidates as needed).
- Recruitment Workflow Agent (shortlist candidates / top candidates for Developer / who should we interview first / who should I hire / recommend top / compare A and B / hiring pipeline / summarize hiring / biggest skill gaps / strongest/weakest / who should be rejected / needs another review) → load the matching pack:
  shortlist → searchResumeAnalysis + searchAIRanking + getInterviewPriority + analyzeSkillGaps + searchApplications (+ searchJobs when a role is named)
  compare → compareCandidates + full analysis pack
  interview decision → full pack + getHiringRecommendation + getInterviewPriority
  pipeline → getDashboardStats + getHRAnalytics + searchJobs + searchApplications + searchInterviews + searchAIRanking
  insights → searchResumeAnalysis + searchAIRanking + analyzeSkillGaps + getSmartAlerts + getDashboardStats
- Hiring Assistant (single-candidate "should I hire X" / "would you recommend" / "good fit" / "why reject" / "hiring recommendation" / worth interviewing) → full pack + getHiringRecommendation + analyzeSkillGaps + analyzeHiringRisks.
- "Explain why the score is N" / strengths / weaknesses / missing skills that matter → full pack + explainAIDecision when score is discussed.
- Role fit / "can they work as X" / another suitable role → full pack + analyzeSkillGaps + matchJobCandidates + getHiringRecommendation. Do NOT filter resume analysis by the target job title if that analysis row may not exist.
- Ranking explanations ("why ranked first", "why?", "explain score", "why is the score low") → explainAIDecision + full pack.
- Strengths / missing skills / summarize resume → full pack + analyzeSkillGaps (keep focus="all" so rows are complete).
- Compare candidates → compareCandidates + full pack.
- Interview Assistant ("generate interview questions", technical/behavioral/HR, questions based on React/Angular/missing skills, generate 10, follow-ups) → full pack + getHiringRecommendation + analyzeSkillGaps. Answer layer personalizes Question / Why / Expected answer / Red flags from resume evidence — never generic when analysis exists.
- Jobs with no applicants / empty pipeline → searchJobs AND searchApplications.
- Interview first / interview order → getInterviewPriority (+ ranking/analysis).
- Red flags / risks → analyzeHiringRisks (+ searchResumeAnalysis).
- Salary / offer band → getSalaryRecommendation + profile/analysis.
- Leaderboard / best AI score / "Show AI ranking" → searchAIRanking with ONLY { topN } — NEVER set jobQuery/candidateQuery to "AI", "ranking", "score", or "show".
- Follow-ups (why, him, her, risks, hire him) → reuse focusCandidate/focusJob from memory in tool params.
- Only set needsClarification=true when the question is not HR-related or truly impossible to map to any tool.

Return ONLY JSON (no chain-of-thought):
{
  "goal": "short goal",
  "informationNeeded": ["..."],
  "focusCandidate": "name or null",
  "focusJob": "role or null",
  "confidence": 0.0-1.0,
  "needsClarification": false,
  "clarificationQuestion": null,
  "tools": [
    { "name": "searchAIRanking", "params": { "topN": 5 } }
  ]
}

Examples (patterns, not commands):
Q: "Who should I hire?" / "Shortlist candidates" / "Show top candidates for Developer" / "Who should we interview first?" → searchResumeAnalysis, searchAIRanking, getInterviewPriority, analyzeSkillGaps, searchApplications, searchJobs
Q: "Compare candidate A and candidate B" / "Who is better?" / "Side-by-side comparison" → compareCandidates, searchResumeAnalysis, searchAIRanking, searchApplications
Q: "Who should be rejected?" / "Who needs another review?" → searchResumeAnalysis, searchAIRanking, getHiringRecommendation, analyzeSkillGaps, getInterviewPriority
Q: "Show hiring pipeline" / "Recruitment summary" / "Summarize hiring" → getDashboardStats, getHRAnalytics, searchJobs, searchApplications, searchInterviews, searchAIRanking
Q: "Biggest skill gaps" / "Strongest candidates" / "Candidates needing attention" → searchResumeAnalysis, searchAIRanking, analyzeSkillGaps, getSmartAlerts, getDashboardStats
Q: "Should I shortlist this candidate?" → full pack + getHiringRecommendation + analyzeSkillGaps
Q: "Tell me about this candidate" (memory: Ali) → getCandidateProfile(Ali), searchResumeAnalysis(Ali), searchAIRanking(Ali), searchApplications, searchJobs
Q: "Summarize this resume" / "What are the strengths?" / "What skills are missing?" → searchResumeAnalysis, searchAIRanking, getCandidateProfile, searchApplications, analyzeSkillGaps
Q: "Can he work as Angular Developer?" → searchResumeAnalysis, searchAIRanking, getCandidateProfile, analyzeSkillGaps, matchJobCandidates, getHiringRecommendation, searchJobs
Q: "Explain this AI score" / "Why is the score low?" → explainAIDecision, searchResumeAnalysis, searchAIRanking, getCandidateProfile
Q: "Compare candidates" → compareCandidates, searchResumeAnalysis, searchAIRanking, searchApplications
Q: "Generate interview questions" / "Technical interview questions" / "Questions based on React" / "Generate 10 interview questions" → searchResumeAnalysis, searchAIRanking, getCandidateProfile, searchJobs, searchApplications, analyzeSkillGaps, getHiringRecommendation
Q: "Questions for a Senior Developer" / "Questions for this candidate" → same interview pack; keep focusCandidate from memory
Q: "Who applied today?" → searchApplications({ todayOnly: true })
Q: "Which jobs have no applicants?" → searchJobs, searchApplications
Q: "Should I hire him?" after Ali → getHiringRecommendation(Ali), analyzeHiringRisks(Ali), searchResumeAnalysis(Ali), searchAIRanking(Ali), getCandidateProfile(Ali)
Q: "Send interview invitation" / "Write interview invitation email" / "Generate rejection email" / "Generate offer letter" / "Generate follow-up email" / "Generate salary negotiation email" / "Generate onboarding email" / "Thank the candidate" / "Ask candidate for missing documents" / "Reschedule interview" / "Cancel interview" / "Confirm interview" / "Send reminder email" → searchApplications, searchInterviews, searchJobs, searchCandidates, getCandidateProfile, searchResumeAnalysis, searchAIRanking, generateAgentEmail (tone: professional|friendly|formal|short|detailed). Never invent interview date/time/candidate name — use live rows or mark the missing field.
Q: "Management hiring report" / "recruitment summary report" / "numbers for leadership" → generateAgentReport, getHRAnalytics
Q: "Missing resumes in applications?" → getSmartAlerts
Q: "Probability we fill this role soon?" → getPredictions`;

/** Planner model: prefer lightweight for routing; override via GROQ_PLANNER_MODEL. */
function resolvePlannerModel(): string {
  return (
    process.env.GROQ_PLANNER_MODEL?.trim() ||
    GROQ_LIGHTWEIGHT_MODEL ||
    GROQ_MODEL
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimitError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const message = String((error as { message?: string })?.message ?? error);
  return status === 429 || /rate limit/i.test(message);
}

async function withRateLimitRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || i === attempts - 1) throw error;
      // Honor short TPM waits only — daily TPD limits should fall through to fallback.
      const msg = String((error as { message?: string })?.message ?? "");
      const tpd = /tokens per day|TPD/i.test(msg);
      if (tpd) throw error;
      const waitMs = Math.min(20_000, 1_500 * 2 ** i);
      await sleep(waitMs);
    }
  }
  throw lastError;
}

function applyMemoryDefaults(
  tools: CopilotToolCall[],
  memoryCandidate?: string,
  memoryJob?: string
): CopilotToolCall[] {
  return tools.map((call) => {
    const params = { ...(call.params ?? {}) };
    const needsCandidate = [
      "searchResumeAnalysis",
      "searchAIRanking",
      "getCandidateProfile",
      "getHiringRecommendation",
      "analyzeSkillGaps",
      "analyzeHiringRisks",
      "explainAIDecision",
      "generateDecisionReport",
      "getSalaryRecommendation",
      "generateAgentEmail",
      "searchCandidates",
    ].includes(call.tool);

    const needsJob = [
      "searchJobs",
      "searchApplications",
      "searchResumeAnalysis",
      "searchAIRanking",
      "matchJobCandidates",
      "getHiringRecommendation",
      "analyzeSkillGaps",
      "getInterviewPriority",
      "analyzeHiringRisks",
      "explainAIDecision",
      "generateDecisionReport",
    ].includes(call.tool);

    const safeCandidate = sanitizeAiListFilter(memoryCandidate);
    const safeJob = sanitizeAiListFilter(memoryJob);

    if (needsCandidate && safeCandidate) {
      if (!params.candidateQuery && !params.query) {
        if (call.tool === "getCandidateProfile" || call.tool === "searchCandidates") {
          params.query = safeCandidate;
        } else {
          params.candidateQuery = safeCandidate;
        }
      }
    }
    if (needsJob && safeJob) {
      if (!params.jobQuery && !params.query) {
        if (call.tool === "searchJobs") params.query = safeJob;
        else params.jobQuery = safeJob;
      }
    }
    return { tool: call.tool, params: scrubToolParams(params) };
  });
}

function scrubToolParams(params: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...params };
  if ("jobQuery" in cleaned) {
    const v = sanitizeAiListFilter(
      typeof cleaned.jobQuery === "string" ? cleaned.jobQuery : ""
    );
    if (v) cleaned.jobQuery = v;
    else delete cleaned.jobQuery;
  }
  if ("candidateQuery" in cleaned) {
    const v = sanitizeAiListFilter(
      typeof cleaned.candidateQuery === "string" ? cleaned.candidateQuery : ""
    );
    if (v) cleaned.candidateQuery = v;
    else delete cleaned.candidateQuery;
  }
  if ("query" in cleaned && typeof cleaned.query === "string") {
    const v = sanitizeAiListFilter(cleaned.query);
    if (v) cleaned.query = v;
    else delete cleaned.query;
  }
  return cleaned;
}

function normalizeToolCalls(raw: unknown): CopilotToolCall[] {
  if (!Array.isArray(raw)) return [];
  const out: CopilotToolCall[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const name = String(obj.name ?? obj.tool ?? "");
    if (!isKnownAgentTool(name)) continue;
    const params =
      obj.params && typeof obj.params === "object"
        ? (obj.params as Record<string, unknown>)
        : obj.arguments && typeof obj.arguments === "object"
          ? (obj.arguments as Record<string, unknown>)
          : {};
    out.push({ tool: name as CopilotToolName, params: scrubToolParams(params) });
  }
  const seen = new Set<string>();
  return out.filter((t) => {
    const key = `${t.tool}:${JSON.stringify(t.params ?? {})}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compactToolCatalog() {
  // Keep tokens low for TPM limits — name + short description only.
  return HR_AGENT_TOOL_DEFINITIONS.map((t) => ({
    name: t.function.name,
    description: t.function.description,
  }));
}

/**
 * LLM decides which tools to run for a natural-language HR question.
 * Primary path: JSON planning (reliable multi-tool). Secondary: native tool_calls.
 */
export async function planWithLLM(
  message: string,
  history: FollowUpHistoryMessage[] = []
): Promise<LlmAgentPlan> {
  const memory = extractContextFromHistory(history);
  const memoryCandidate = memory.candidateNames[0];
  const memoryJob = memory.jobQuery;

  const client = getGroqClient();
  const toolCatalog = compactToolCatalog();
  const plannerModel = resolvePlannerModel();

  const userPayload = {
    question: message,
    conversationMemory: {
      previousUserQuestion: memory.previousUserQuestion,
      previousAssistantAnswer: memory.previousAssistantAnswer?.slice(0, 400) ?? null,
      focusCandidate: memoryCandidate ?? null,
      focusJob: memoryJob ?? null,
      lastDomain: memory.lastDomain,
    },
    availableTools: toolCatalog,
  };

  logCopilotDebug("LLM Planner Request", {
    question: message,
    memoryCandidate,
    memoryJob,
    toolCount: toolCatalog.length,
    plannerModel,
  });

  let rateLimited = false;

  // --- Path A: structured JSON plan (preferred for multi-tool) ---
  try {
    const completion = await withRateLimitRetry(() =>
      client.chat.completions.create({
        model: plannerModel,
        temperature: 0.05,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PLANNER_SYSTEM },
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      })
    );

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) {
      const parsed = parseModelJsonResponse(
        content,
        "HR agent planner returned invalid JSON."
      ) as Record<string, unknown>;

      let tools = normalizeToolCalls(parsed.tools);
      tools = applyMemoryDefaults(tools, memoryCandidate, memoryJob);

      const confidence =
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : tools.length > 0
            ? 0.85
            : 0.2;

      const needsClarification =
        Boolean(parsed.needsClarification) || (tools.length === 0 && confidence < 0.55);

      const plan: LlmAgentPlan = {
        goal: typeof parsed.goal === "string" ? parsed.goal : "Answer the HR question",
        informationNeeded: Array.isArray(parsed.informationNeeded)
          ? parsed.informationNeeded.map(String)
          : [],
        tools,
        confidence,
        needsClarification,
        clarificationQuestion:
          typeof parsed.clarificationQuestion === "string"
            ? parsed.clarificationQuestion
            : undefined,
        focusCandidate:
          typeof parsed.focusCandidate === "string"
            ? parsed.focusCandidate
            : memoryCandidate ?? null,
        focusJob:
          typeof parsed.focusJob === "string" ? parsed.focusJob : memoryJob ?? null,
        planner: "llm",
      };

      logCopilotDebug("LLM Planner Result", {
        planner: plan.planner,
        tools: plan.tools.map((t) => t.tool),
        confidence: plan.confidence,
        needsClarification: plan.needsClarification,
      });

      if (!needsClarification && tools.length > 0) {
        return plan;
      }
      if (needsClarification) {
        return plan;
      }
    }
  } catch (error) {
    if (isRateLimitError(error)) {
      rateLimited = true;
      console.error("[ai/agent-llm-planner] JSON plan rate-limited; skipping native tools.");
    } else {
      console.error("[ai/agent-llm-planner] JSON plan failed, trying native tools:", error);
    }
  }

  // --- Path B: native parallel tool_calls (skip when already rate-limited) ---
  if (!rateLimited) try {
    const completion = await withRateLimitRetry(() =>
      client.chat.completions.create({
        model: plannerModel,
        temperature: 0.05,
        tools: HR_AGENT_TOOL_DEFINITIONS,
        tool_choice: "auto",
        messages: [
          {
            role: "system",
            content:
              "You are RecruitAI's tool router. Call every Supabase tool needed to answer the HR question completely. Use conversation memory for pronouns (him/her/this candidate). Prefer ranking + resume analysis + hiring recommendation for hire/fit questions.",
          },
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      })
    );

    const msg = completion.choices[0]?.message;
    const toolCalls = msg?.tool_calls ?? [];
    if (toolCalls.length > 0) {
      const tools: CopilotToolCall[] = [];
      for (const tc of toolCalls) {
        const name = tc.function?.name ?? "";
        if (!isKnownAgentTool(name)) continue;
        let params: Record<string, unknown> = {};
        try {
          params = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
        } catch {
          params = {};
        }
        tools.push({ tool: name as CopilotToolName, params });
      }
      const withMemory = applyMemoryDefaults(tools, memoryCandidate, memoryJob);
      if (withMemory.length > 0) {
        return {
          goal: "Answer using LLM-selected tools",
          informationNeeded: [],
          tools: withMemory,
          confidence: 0.88,
          needsClarification: false,
          focusCandidate: memoryCandidate ?? null,
          focusJob: memoryJob ?? null,
          planner: "llm-tools",
        };
      }
    }
  } catch (error) {
    if (isRateLimitError(error)) rateLimited = true;
    console.error("[ai/agent-llm-planner] native tool_calls failed:", error);
  }

  // Signal caller to use deterministic fallback (empty tools + zero confidence).
  return {
    goal: rateLimited ? "Planner rate-limited" : "Unable to plan",
    informationNeeded: [],
    tools: [],
    confidence: 0,
    needsClarification: false,
    clarificationQuestion: undefined,
    focusCandidate: memoryCandidate ?? null,
    focusJob: memoryJob ?? null,
    planner: "fallback",
  };
}
