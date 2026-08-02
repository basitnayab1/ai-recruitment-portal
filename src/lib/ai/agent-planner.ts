import type { CopilotToolCall } from "@/lib/ai/hr-tools";
import { detectCopilotIntent, type CopilotIntent } from "@/lib/ai/copilot-intent";
import {
  resolveFollowUpQuery,
  type FollowUpHistoryMessage,
} from "@/lib/ai/copilot-followup";
import { matchNaturalLanguageCoverage } from "@/lib/ai/nl-coverage";
import {
  hiringDecisionEvidencePack,
  interviewAssistantEvidencePack,
  resumeAnalysisEvidencePack,
} from "@/lib/ai/resume-evidence-pack";
import { isInterviewAssistantQuestion } from "@/lib/ai/interview-assistant-report";
import {
  detectWorkflowKind,
  isWorkflowAgentQuestion,
} from "@/lib/ai/workflow-agent-report";
import {
  comparisonWorkflowPack,
  insightsWorkflowPack,
  interviewDecisionWorkflowPack,
  pipelineWorkflowPack,
  shortlistWorkflowPack,
} from "@/lib/ai/workflow-evidence-pack";
import {
  detectCommunicationEmailType,
  detectCommunicationTone,
  isCommunicationAssistantQuestion,
} from "@/lib/ai/communication-assistant-report";
import { communicationEvidencePack } from "@/lib/ai/communication-evidence-pack";

export type AgentPlanPhase = {
  name: string;
  parallel: boolean;
  tools: CopilotToolCall[];
};

export type AgentPlan = {
  intent: CopilotIntent | string;
  goal: string;
  informationNeeded: string[];
  confidence: number;
  phases: AgentPlanPhase[];
  clarificationQuestion?: string;
};

function extractJobQuery(message: string): string | undefined {
  const bestFor = message.match(
    /\b(?:who is the )?best candidates?\s+for\s+(?:the\s+|our\s+)?([a-z0-9.+# /&+-]+?)(?:\s+position|\s+role|\s+job)?\??$/i
  );
  if (bestFor?.[1]) return bestFor[1].trim();

  const forRole = message.match(
    /\bfor\s+(?:the\s+|our\s+)?([a-z0-9.+# /&+-]+?)(?:\s+position|\s+role|\s+job)?\??$/i
  );
  if (forRole?.[1] && !/^(this|that|me|us)$/i.test(forRole[1])) {
    return forRole[1].trim();
  }

  const role = message.match(
    /\b(react\s+developer|frontend developer|backend developer|developer|designer|marketing|engineer)\b/i
  );
  return role?.[1];
}

function extractSkill(message: string): string | undefined {
  const known = message.match(
    /\b(react|next\.?js|python|sql|typescript|javascript|java|aws|node\.?js)\b/i
  );
  return known?.[1];
}

function extractPerson(message: string): string | undefined {
  // Prefer a single token / username (basitnayab6975) — do not swallow "for Role...".
  // Avoid verbs/adjectives after "candidate" ("suitable", "against", "good"...).
  const username = message.match(
    /\b(?:hire|recommend|about|email|know about|explain|fit of)\s+([A-Za-z][A-Za-z0-9'_-]{1,60})\b/i
  );
  const namedCandidate = message.match(
    /\bcandidate\s+([A-Za-z][A-Za-z0-9'_-]{2,60})\b/i
  );
  const proper = message.match(
    /\b(?:hire|recommend|about|email|know about|explain)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/
  );
  const name = (username?.[1] ?? namedCandidate?.[1] ?? proper?.[1])?.trim();
  if (
    !name ||
    /^(this|that|the|him|her|them|they|he|she|candidate|person|applicant|hire|strong|role|fit|for|targeting|suitable|against|good|best|top|weak|strongest|another|the)$/i.test(
      name
    )
  ) {
    return undefined;
  }
  return name;
}

function extractEmailType(message: string): string {
  return detectCommunicationEmailType(message);
}

function extractReportType(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("interview")) return "interview_report";
  if (lower.includes("candidate")) return "candidate_report";
  if (lower.includes("management")) return "management_report";
  if (lower.includes("hiring")) return "hiring_report";
  return "recruitment_summary";
}

/**
 * Multi-tool planning layer for the autonomous HR Agent.
 * Determines information needed, tools, and execution order (phased/parallel).
 */
export function buildAgentPlan(
  message: string,
  history: FollowUpHistoryMessage[] = []
): AgentPlan {
  const followUp = resolveFollowUpQuery(message, history);
  const text = (followUp?.resolvedMessage ?? message).trim();
  const lower = text.toLowerCase();
  const isRoleFit = followUp?.followUpKind === "role_fit";
  const isInterviewFocus =
    followUp?.followUpKind === "interview_focus" ||
    isInterviewAssistantQuestion(message);

  const jobQuery = isRoleFit
    ? followUp?.memory.jobQuery ?? extractJobQuery(text)
    : extractJobQuery(text);
  const skill = extractSkill(text);
  // Memory focus candidate wins for follow-ups — extractPerson can over-capture.
  const personRaw =
    followUp?.memory.candidateNames.find(
      (n) =>
        n &&
        !/^(this|that|him|her|them|they|he|she|hire|candidate|suitable|against|good)$/i.test(
          n
        ) &&
        !/^(this|that|him|her)\b/i.test(n) &&
        !/\bcandidate\b/i.test(n)
    ) ?? extractPerson(text);
  // Never treat skill/seniority tokens as candidate names.
  const person =
    personRaw &&
    !/^(react|angular|vue|typescript|javascript|python|senior|junior|developer|missing|skills?)$/i.test(
      personRaw
    )
      ? personRaw
      : followUp?.memory.candidateNames.find((n) =>
          Boolean(n && /[a-z].*\d|\d|[a-z]{4,}/i.test(n) && !/developer|senior|react/i.test(n))
        );

  // --- AI Recruitment Communication Assistant (before workflow — email phrasing) ---
  if (
    isCommunicationAssistantQuestion(text) ||
    /\b(generate email|draft email|interview invitation|offer letter|rejection email|shortlisting email|follow-up email|follow up email|reminder email|onboarding email|salary negotiation|thank the candidate|missing documents|reschedule interview|cancel interview|confirm interview)\b/.test(
      lower
    )
  ) {
    const emailType = extractEmailType(text);
    const tone = detectCommunicationTone(text);
    const named = extractPerson(text);
    return {
      intent: "communication_assistant",
      goal: `Draft ${emailType} email from live Supabase context`,
      informationNeeded: [
        "applications",
        "jobs",
        "candidate_profiles",
        "interviews",
        "ai_resume_analysis",
        "ai_candidate_ranking",
      ],
      confidence: 94,
      phases: [
        {
          name: "communication_evidence",
          parallel: true,
          tools: communicationEvidencePack({
            candidateQuery: named,
            jobQuery,
            emailType,
            tone,
          }),
        },
      ],
    };
  }

  // --- AI Recruitment Workflow Agent ---
  if (isWorkflowAgentQuestion(text) || detectWorkflowKind(text)) {
    const kind = detectWorkflowKind(text) ?? "shortlist";
    const compareNames =
      text.match(
        /\bcompare\s+([A-Za-z][A-Za-z0-9'_-]{1,40})\s+and\s+([A-Za-z][A-Za-z0-9'_-]{1,40})\b/i
      ) ??
      text.match(
        /\b([A-Za-z][A-Za-z0-9'_-]{1,40})\s+(?:vs\.?|versus)\s+([A-Za-z][A-Za-z0-9'_-]{1,40})\b/i
      );
    const names = compareNames
      ? [compareNames[1]!, compareNames[2]!].filter(Boolean)
      : undefined;

    // Pipeline/shortlist/insights are portfolio-wide — do not inherit a
    // prior-turn focus candidate (that would collapse the shortlist to one person).
    const namedInMessage = extractPerson(text);
    const tools =
      kind === "compare"
        ? comparisonWorkflowPack({
            names,
            jobQuery,
            topN: 5,
          })
        : kind === "pipeline"
          ? pipelineWorkflowPack()
          : kind === "insights"
            ? insightsWorkflowPack({ jobQuery })
            : kind === "interview_decision"
              ? interviewDecisionWorkflowPack({
                  candidateQuery: namedInMessage,
                  jobQuery,
                  topN: 8,
                })
              : shortlistWorkflowPack({
                  candidateQuery: namedInMessage,
                  jobQuery,
                  topN: 8,
                });

    return {
      intent: `workflow_${kind}`,
      goal: `Recruitment workflow: ${kind}`,
      informationNeeded: [
        "applications",
        "jobs",
        "candidate_profiles",
        "ai_resume_analysis",
        "ai_candidate_ranking",
        "interviews",
      ],
      confidence: 93,
      phases: [
        {
          name: "workflow_evidence",
          parallel: true,
          tools,
        },
      ],
    };
  }

  // --- Complex autonomous hiring task (example in spec) ---
  if (
    /\b(best candidate|who is the best|recommend (a |the )?candidate|hire for)\b/.test(lower) &&
    (jobQuery || skill || /\bposition|role|job\b/.test(lower))
  ) {
    const q = jobQuery ?? skill ?? "developer";
    return {
      intent: "autonomous_hiring",
      goal: `Identify the best candidate for ${q}`,
      informationNeeded: [
        "Matching jobs",
        "Applications for the role",
        "Candidate profiles",
        "Resume AI analysis",
        "AI ranking scores",
      ],
      confidence: 92,
      phases: [
        {
          name: "discover_jobs",
          parallel: true,
          tools: [
            { tool: "searchJobs", params: { query: q, status: "published", limit: 10 } },
          ],
        },
        {
          name: "collect_pipeline",
          parallel: true,
          tools: [
            { tool: "searchApplications", params: { jobQuery: q, limit: 20 } },
            { tool: "searchCandidates", params: { skill, limit: 20 } },
          ],
        },
        {
          name: "score_and_rank",
          parallel: true,
          tools: [
            {
              tool: "searchResumeAnalysis",
              params: { jobQuery: q, skill, orderBy: "score", topN: 10 },
            },
            {
              tool: "searchAIRanking",
              params: { jobQuery: q, orderBy: "score", topN: 10 },
            },
            {
              tool: "matchJobCandidates",
              params: { jobQuery: q, topN: 5 },
            },
          ],
        },
        {
          name: "decision_support",
          parallel: true,
          tools: [
            { tool: "getInterviewPriority", params: { jobQuery: q, topN: 5 } },
            { tool: "getHiringRecommendation", params: { jobQuery: q } },
          ],
        },
      ],
    };
  }

  // --- Analytics ---
  if (
    /\b(hiring trends|applications this week|applications this month|top departments|most applied|least applied|average ai score|average interview|average hiring time|open positions|closed positions|hr analytics|recruitment analytics)\b/.test(
      lower
    )
  ) {
    return {
      intent: "hr_analytics",
      goal: "Compute HR analytics from live data",
      informationNeeded: ["Applications", "Jobs", "AI scores", "Hiring timelines"],
      confidence: 90,
      phases: [
        {
          name: "analytics",
          parallel: true,
          tools: [{ tool: "getHRAnalytics", params: {} }],
        },
      ],
    };
  }

  // --- Predictions ---
  if (
    /\b(hiring difficulty|time to fill|candidate availability|probability of hiring|skill shortages|predict)\b/.test(
      lower
    )
  ) {
    return {
      intent: "predictions",
      goal: "Predict hiring outcomes from live pipeline density",
      informationNeeded: ["Open jobs", "Application volume", "AI scores", "Missing skills"],
      confidence: 88,
      phases: [
        {
          name: "predict",
          parallel: true,
          tools: [
            { tool: "getPredictions", params: { jobQuery, topN: 8 } },
            { tool: "getHRAnalytics", params: {} },
          ],
        },
      ],
    };
  }

  // --- Smart alerts ---
  if (
    /\b(alerts?|interview today|waiting review|high scoring|job closing|without ai score|missing resumes?)\b/.test(
      lower
    )
  ) {
    return {
      intent: "smart_alerts",
      goal: "Surface operational hiring alerts",
      informationNeeded: ["Interviews", "Applications", "AI scores", "Jobs closing"],
      confidence: 90,
      phases: [
        {
          name: "alerts",
          parallel: true,
          tools: [{ tool: "getSmartAlerts", params: {} }],
        },
      ],
    };
  }

  // --- Report generation ---
  if (
    /\b(hiring report|candidate report|interview report|recruitment summary|management report|generate report)\b/.test(
      lower
    )
  ) {
    return {
      intent: "agent_report",
      goal: "Generate a professional recruitment report",
      informationNeeded: ["Analytics", "Alerts", "Predictions"],
      confidence: 90,
      phases: [
        {
          name: "report",
          parallel: true,
          tools: [
            {
              tool: "generateAgentReport",
              params: { reportType: extractReportType(lower), jobQuery },
            },
          ],
        },
      ],
    };
  }

  // --- Screening / ranking multi-tool ---
  if (/\b(screen candidates|screening|rank candidates for)\b/.test(lower)) {
    const q = jobQuery ?? "developer";
    return {
      intent: "screening",
      goal: `Screen and rank candidates for ${q}`,
      informationNeeded: ["Applications", "AI analysis", "Rankings"],
      confidence: 88,
      phases: [
        {
          name: "screen",
          parallel: true,
          tools: [
            { tool: "searchApplications", params: { jobQuery: q, limit: 20 } },
            { tool: "searchResumeAnalysis", params: { jobQuery: q, orderBy: "score", topN: 15 } },
            { tool: "searchAIRanking", params: { jobQuery: q, topN: 15 } },
          ],
        },
      ],
    };
  }

  // Role-fit / interview-focus: full evidence pack, but never filter analysis
  // by the *target* job title (that row may not exist yet).
  if (isRoleFit || isInterviewFocus) {
    const base = isInterviewFocus
      ? interviewAssistantEvidencePack({
          candidateQuery: person,
          topN: 5,
        })
      : [
          ...resumeAnalysisEvidencePack({
            candidateQuery: person,
            topN: 5,
          }),
          {
            tool: "analyzeSkillGaps" as const,
            params: {
              mode: "missing",
              topN: 5,
              ...(person ? { candidateQuery: person } : {}),
            },
          },
          {
            tool: "getHiringRecommendation" as const,
            params: {
              ...(person ? { candidateQuery: person } : {}),
            },
          },
        ];

    // For alternate-role asks, list open jobs without a junk title filter.
    const safeJobQuery =
      jobQuery &&
      jobQuery.length <= 40 &&
      !/\b(as written|consider|unless|analysis|signaling|poor fit|another suitable)\b/i.test(
        jobQuery
      )
        ? jobQuery
        : undefined;

    const tools: CopilotToolCall[] = [
      ...base,
      {
        tool: "searchJobs",
        params: {
          limit: 8,
          status: "published",
          ...(isRoleFit &&
          safeJobQuery &&
          !/another suitable/i.test(text)
            ? { query: safeJobQuery }
            : {}),
        },
      },
    ];

    return {
      intent: isRoleFit ? "role_fit" : "interview_focus",
      goal: isRoleFit
        ? `Assess fit of ${person ?? "candidate"} for ${jobQuery ?? "role"}`
        : `Assess whether to interview ${person ?? "candidate"}`,
      informationNeeded: tools.map((t) => t.tool),
      confidence: 90,
      phases: [{ name: "role_or_interview", parallel: true, tools }],
    };
  }

  // Broad NL paraphrase coverage (after specialized plans, before single-intent router)
  const nlTools = matchNaturalLanguageCoverage(text);
  if (nlTools && nlTools.length > 0) {
    const withContext = nlTools.map((call) => {
      const params = { ...(call.params ?? {}) };
      // Role titles mentioned in hypothetical fit questions must not wipe analysis rows.
      const allowJobFilter =
        call.tool === "searchJobs" ||
        call.tool === "matchJobCandidates" ||
        call.tool === "searchApplications";
      if (jobQuery && !params.jobQuery && !params.query) {
        if (call.tool === "searchJobs") params.query = jobQuery;
        else if (allowJobFilter) params.jobQuery = jobQuery;
      }
      if (person && !params.candidateQuery && !params.query) {
        if (call.tool === "getCandidateProfile" || call.tool === "searchCandidates") {
          params.query = person;
        } else {
          params.candidateQuery = person;
        }
      }
      if (skill && !params.skill) params.skill = skill;
      return { tool: call.tool, params };
    });
    return {
      intent: "nl_coverage",
      goal: "Answer the natural-language HR question",
      informationNeeded: withContext.map((t) => t.tool),
      confidence: 82,
      phases: [
        {
          name: "nl_tools",
          parallel: true,
          tools: withContext,
        },
      ],
    };
  }

  // --- Fallback: semantic intent router (single or small multi-tool) ---
  // Pass resolved text without history so follow-up is not rewritten twice.
  const detected = detectCopilotIntent(text);

  if (detected.intent === "clarify" || detected.toolCalls.length === 0) {
    return {
      intent: "clarify",
      goal: "Ask for clarification",
      informationNeeded: [],
      confidence: detected.confidence,
      clarificationQuestion: detected.clarificationQuestion,
      phases: [],
    };
  }

  // Expand job_match into a richer autonomous plan
  if (detected.intent === "job_match") {
    const q = jobQuery ?? "developer";
    return {
      intent: "job_match",
      goal: `Find best candidates for ${q}`,
      informationNeeded: ["Jobs", "Rankings", "Resume analysis", "Interview priority"],
      confidence: Math.max(detected.confidence, 85),
      phases: [
        {
          name: "jobs",
          parallel: true,
          tools: [{ tool: "searchJobs", params: { query: q, limit: 10 } }],
        },
        {
          name: "rank_analyze",
          parallel: true,
          tools: [
            { tool: "matchJobCandidates", params: { jobQuery: q, topN: 5 } },
            { tool: "searchAIRanking", params: { jobQuery: q, topN: 5 } },
            { tool: "searchResumeAnalysis", params: { jobQuery: q, orderBy: "score", topN: 5 } },
          ],
        },
      ],
    };
  }

  // Expand hiring recommendation into a full evidence-gathering plan
  if (detected.intent === "hiring_recommendation") {
    const hireParams = detected.toolCalls.find((t) => t.tool === "getHiringRecommendation")
      ?.params as { candidateQuery?: string; jobQuery?: string } | undefined;
    const candidateQuery = person ?? hireParams?.candidateQuery;
    const q = jobQuery ?? hireParams?.jobQuery;

    return {
      intent: "hiring_recommendation",
      goal: `Produce a structured hire/reject recommendation${candidateQuery ? ` for ${candidateQuery}` : ""}${q ? ` (${q})` : ""}`,
      informationNeeded: [
        "Job requirements",
        "Resume analysis",
        "AI ranking",
        "Candidate skills",
        "Missing skills",
        "Strengths and weaknesses",
        "Risk assessment",
      ],
      confidence: Math.max(detected.confidence, 88),
      phases: [
        {
          name: "collect_evidence",
          parallel: true,
          tools: [
            { tool: "searchJobs", params: { query: q, status: "published", limit: 5 } },
            {
              tool: "searchResumeAnalysis",
              params: {
                orderBy: "score",
                topN: 5,
                candidateQuery,
                jobQuery: q,
              },
            },
            {
              tool: "searchAIRanking",
              params: { topN: 5, orderBy: "score", candidateQuery, jobQuery: q },
            },
          ],
        },
        {
          name: "assess_gaps_and_risk",
          parallel: true,
          tools: [
            {
              tool: "analyzeSkillGaps",
              params: { mode: "missing", candidateQuery, jobQuery: q, topN: 5 },
            },
            {
              tool: "analyzeHiringRisks",
              params: { candidateQuery, jobQuery: q, topN: 3 },
            },
          ],
        },
        {
          name: "final_recommendation",
          parallel: false,
          tools: [
            {
              tool: "getHiringRecommendation",
              params: { candidateQuery, jobQuery: q },
            },
          ],
        },
      ],
    };
  }

  return {
    intent: detected.intent,
    goal: `Answer intent ${detected.intent}`,
    informationNeeded: detected.matchedSignals,
    confidence: detected.confidence,
    phases: [
      {
        name: "tools",
        parallel: true,
        tools: detected.toolCalls,
      },
    ],
  };
}

export function flattenPlanTools(plan: AgentPlan): CopilotToolCall[] {
  return plan.phases.flatMap((phase) => phase.tools);
}
