import type { CopilotToolCall, CopilotToolName } from "@/lib/ai/hr-tools";
import {
  resolveFollowUpQuery,
  type FollowUpHistoryMessage,
} from "@/lib/ai/copilot-followup";
import {
  detectSemanticIntent,
  SEMANTIC_INTENT_THRESHOLD,
  type CopilotIntent,
} from "@/lib/ai/semantic-intent";

export type { CopilotIntent };

/**
 * Minimum confidence required to execute tools (0–100).
 * Maps from semantic threshold 0.6 → 60.
 */
export const COPILOT_INTENT_CONFIDENCE_THRESHOLD = Math.round(SEMANTIC_INTENT_THRESHOLD * 100);

export type DetectedCopilotIntent = {
  intent: CopilotIntent;
  /** Numeric confidence 0–100 */
  confidence: number;
  /** Legacy label for logs */
  confidenceLabel: "high" | "medium" | "low";
  toolCalls: CopilotToolCall[];
  clarificationQuestion?: string;
  matchedSignals: string[];
};

function confidenceLabel(score: number): "high" | "medium" | "low" {
  if (score >= 85) return "high";
  if (score >= COPILOT_INTENT_CONFIDENCE_THRESHOLD) return "medium";
  return "low";
}

function extractTopN(message: string, fallback = 10): number {
  const match = message.match(/\btop\s+(\d+)\b/i);
  if (match) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > 0) return Math.min(50, Math.floor(n));
  }
  return fallback;
}

const SKILL_STOPWORDS =
  /^(from|the|a|an|to|for|in|on|of|and|or|with|missing|required|needed|analysis|resume|cv|candidate|this|that|his|her|their)$/i;

function extractSkill(message: string): string | undefined {
  const bySkill = message.match(
    /\b(?:with|by|in|knows?|has)\s+([a-z0-9.+#]+(?:\s*[a-z0-9.+#]+)?)\s+skill/i
  );
  if (bySkill?.[1] && !SKILL_STOPWORDS.test(bySkill[1].trim())) {
    return bySkill[1].trim();
  }

  // Only treat "skill: X" / "skills: X" as an explicit skill request — not "skills from…"
  const skillPhrase = message.match(/\bskills?\s*[:\-]\s*([a-z0-9.+#]+)/i);
  if (skillPhrase?.[1] && !SKILL_STOPWORDS.test(skillPhrase[1].trim())) {
    return skillPhrase[1].trim();
  }

  const known = message.match(
    /\b(react|next\.?js|node\.?js|typescript|javascript|python|java|angular|vue|aws|docker|kubernetes|sql|figma|ui\/ux|design)\b/i
  );
  return known?.[1];
}

function extractPersonName(message: string): string | undefined {
  const about = message.match(
    /\b(?:tell me about|about|profile of|details (?:for|on)|who is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
  );
  if (about?.[1] && !/^(Number|Top|Best|Strong|Highest)$/i.test(about[1])) {
    return about[1].trim();
  }

  const quoted = message.match(/["']([A-Za-z][A-Za-z .'-]{1,60})["']/);
  if (quoted?.[1]) return quoted[1].trim();

  return undefined;
}

function extractCompareNames(message: string): string[] {
  const vs = message.match(
    /\bcompare\s+([A-Za-z][A-Za-z .'-]{1,40}?)\s+(?:vs\.?|versus|and)\s+([A-Za-z][A-Za-z .'-]{1,40})/i
  );
  if (vs) {
    return [vs[1]!.trim(), vs[2]!.trim()];
  }
  return [];
}

function extractJobQuery(message: string): string | undefined {
  const forJob = message.match(
    /\b(?:for|matching|match(?:ing)?)\s+(?:the\s+|our\s+)?([a-z0-9 /&+-]+?)\s+job\b/i
  );
  if (forJob?.[1]) return forJob[1].trim();

  const applicationsFor = message.match(
    /\bapplications?\s+for\s+([a-z0-9 /&+-]+?)(?:\s+job)?\b/i
  );
  if (applicationsFor?.[1]) return applicationsFor[1].trim();

  const bestFor = message.match(
    /\bbest candidates?\s+for\s+(?:the\s+|our\s+)?([a-z0-9 /&+-]+?)(?:\s+position|\s+role|\s+job)?\b/i
  );
  if (bestFor?.[1]) return bestFor[1].trim();

  const whoBestFor = message.match(
    /\bwho is the best\b.*\bfor\s+(?:the\s+|our\s+)?([a-z0-9 /&+-]+?)(?:\s+position|\s+role|\s+job)?\??$/i
  );
  if (whoBestFor?.[1]) return whoBestFor[1].trim();

  const roleJobs = message.match(
    /\b(developer|designer|marketing|engineer|manager|analyst|intern|frontend|backend|fullstack|full[- ]stack|react)\s+jobs?\b/i
  );
  if (roleJobs?.[1]) return roleJobs[1].trim();

  const role = message.match(
    /\b(react\s+developer|frontend developer|backend developer|developer|designer|marketing|engineer|manager|analyst)\b/i
  );
  return role?.[1];
}

const CANDIDATE_NAME_STOPWORDS =
  /^(this|that|the|a|an|him|her|them|they|it|ranking|rankings|analysis|score|scores|list|profile|profiles|strengths?|weaknesses?|recommendation|recommendations|report|evaluation|evaluations|skills?|availability|comparison|comparisons|resume|cv|candidate|person|applicant)$/i;

function isInvalidCandidateName(name: string): boolean {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (!n) return true;
  if (CANDIDATE_NAME_STOPWORDS.test(n)) return true;
  // "this candidate", "that person", etc. are pronouns — not real names
  if (/^(this|that|the|our|my)\s+(candidate|person|applicant|one|profile)$/i.test(n)) {
    return true;
  }
  return false;
}

function extractCandidateFromHireQuestion(message: string): string | undefined {
  const patterns = [
    /\bshould i hire\s+([A-Za-z][A-Za-z .'-]{1,40})/i,
    /\brecommend\s+([A-Za-z][A-Za-z .'-]{1,40})/i,
    /\bis\s+([A-Za-z][A-Za-z .'-]{1,40})\s+suitable/i,
    /\bcandidate\s+([A-Za-z][A-Za-z .'-]{1,40})/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1] && !isInvalidCandidateName(match[1])) {
      return match[1].trim();
    }
  }
  return undefined;
}

function buildToolCalls(
  intent: CopilotIntent,
  ctx: {
    text: string;
    lower: string;
    topN: number;
    skill?: string;
    jobQuery?: string;
    personName?: string;
    compareNames: string[];
    hireCandidate?: string;
  }
): CopilotToolCall[] {
  const { topN, skill, jobQuery, personName, compareNames, hireCandidate, lower } = ctx;

  switch (intent) {
    case "candidates":
      return [
        {
          tool: "searchCandidates",
          params: {
            limit: 20,
            skill,
            todayOnly: /\btoday\b/.test(lower) || undefined,
            hasPhone: /\bphone\b/.test(lower) || undefined,
            withoutResume: /\b(without resume|no resume)\b/.test(lower) || undefined,
          },
        },
      ];
    case "applications": {
      let status: string | undefined;
      if (/\breject/.test(lower)) status = "rejected";
      else if (/\bpending|new\b/.test(lower)) status = "new";
      return [
        {
          tool: "searchApplications",
          params: { limit: 20, status, jobQuery },
        },
      ];
    }
    case "jobs": {
      let status: string | undefined;
      if (/\b(open|published|active|current)\b/.test(lower) || /\bvacanc|\bopening|\bposition/.test(lower)) {
        status = "published";
      } else if (/\bclosed\b/.test(lower)) status = "closed";
      else if (/\bdraft\b/.test(lower)) status = "draft";
      return [
        {
          tool: "searchJobs",
          params: { limit: 20, status, query: jobQuery },
        },
      ];
    }
    case "interviews": {
      let when: string | undefined;
      if (/\btoday\b/.test(lower)) when = "today";
      else if (/\bupcoming|schedule/.test(lower)) when = "upcoming";
      return [
        {
          tool: "searchInterviews",
          params: {
            limit: 20,
            todayOnly: when === "today" || undefined,
            upcomingOnly: when === "upcoming" || undefined,
            status: /\bcancel/.test(lower) ? "cancelled" : "scheduled",
          },
        },
      ];
    }
    case "ai_ranking":
      return [
        {
          tool: "searchAIRanking",
          params: {
            topN,
            orderBy: "score",
            ascending: /\b(worst|lowest)\b/.test(lower),
            jobQuery,
          },
        },
      ];
    case "resume_analysis":
      return [
        {
          tool: "searchResumeAnalysis",
          params: {
            orderBy: "score",
            topN,
            // Keep full analysis rows — answer layer focuses the narrative.
            focus: "all",
            candidateQuery: personName,
            skill,
          },
        },
        {
          tool: "searchAIRanking",
          params: { topN, orderBy: "score", candidateQuery: personName },
        },
        { tool: "searchApplications", params: { limit: topN } },
        { tool: "searchJobs", params: { status: "published", limit: 8 } },
        {
          tool: "getCandidateProfile",
          params: { query: personName ?? "", limit: 5 },
        },
        {
          tool: "analyzeSkillGaps",
          params: { mode: "missing", candidateQuery: personName, topN },
        },
      ];
    case "compare_candidates":
      return [
        {
          tool: "compareCandidates",
          params: {
            names: compareNames.length >= 2 ? compareNames : undefined,
            topN: 2,
          },
        },
        {
          tool: "searchResumeAnalysis",
          params: { orderBy: "score", topN: 5 },
        },
        { tool: "searchAIRanking", params: { topN: 5, orderBy: "score" } },
        { tool: "searchApplications", params: { limit: 8 } },
        { tool: "searchJobs", params: { status: "published", limit: 8 } },
      ];
    case "hiring_recommendation":
      return [
        {
          tool: "searchJobs",
          params: { query: jobQuery, status: "published", limit: 5 },
        },
        {
          tool: "searchResumeAnalysis",
          params: {
            orderBy: "score",
            topN: 5,
            candidateQuery: hireCandidate ?? personName,
          },
        },
        {
          tool: "searchAIRanking",
          params: {
            topN: 5,
            orderBy: "score",
            candidateQuery: hireCandidate ?? personName,
          },
        },
        { tool: "searchApplications", params: { limit: 8 } },
        {
          tool: "getCandidateProfile",
          params: { query: hireCandidate ?? personName ?? "", limit: 5 },
        },
        {
          tool: "analyzeSkillGaps",
          params: {
            mode: "missing",
            candidateQuery: hireCandidate ?? personName,
            topN: 5,
          },
        },
        {
          tool: "analyzeHiringRisks",
          params: { candidateQuery: hireCandidate ?? personName, topN: 3 },
        },
        {
          tool: "getHiringRecommendation",
          params: { candidateQuery: hireCandidate ?? personName },
        },
      ];
    case "job_match":
      return [
        {
          tool: "matchJobCandidates",
          params: { jobQuery: jobQuery ?? "developer", topN: Math.min(topN, 5) },
        },
        {
          tool: "searchResumeAnalysis",
          params: { orderBy: "score", topN: 5 },
        },
        { tool: "searchAIRanking", params: { topN: 5 } },
        { tool: "searchJobs", params: { status: "published", limit: 8 } },
      ];
    case "skill_gap": {
      let mode: "missing" | "knows" | "lacks" | "weak" = "missing";
      if (/\bweak\b/.test(lower)) mode = "weak";
      else if (/\bknow\b/.test(lower)) mode = "knows";
      else if (/\black\b/.test(lower)) mode = "lacks";
      return [
        {
          tool: "searchResumeAnalysis",
          params: {
            orderBy: "score",
            topN,
            candidateQuery: personName,
            focus: "all",
          },
        },
        {
          tool: "analyzeSkillGaps",
          params: { mode, skill, candidateQuery: personName, topN: 20 },
        },
        {
          tool: "searchAIRanking",
          params: { topN, candidateQuery: personName },
        },
        { tool: "searchApplications", params: { limit: 8 } },
        {
          tool: "getCandidateProfile",
          params: { query: personName ?? "", limit: 5 },
        },
      ];
    }
    case "interview_priority":
      return [
        { tool: "getInterviewPriority", params: { jobQuery, topN: 10 } },
        {
          tool: "searchResumeAnalysis",
          params: { orderBy: "score", topN: 10 },
        },
        { tool: "searchAIRanking", params: { topN: 10 } },
      ];
    case "salary_recommendation":
      return [
        {
          tool: "getSalaryRecommendation",
          params: { candidateQuery: personName, jobQuery, topN: 5 },
        },
        {
          tool: "searchResumeAnalysis",
          params: { candidateQuery: personName, topN: 5 },
        },
        {
          tool: "getCandidateProfile",
          params: { query: personName ?? "", limit: 5 },
        },
      ];
    case "risk_analysis":
      return [
        {
          tool: "analyzeHiringRisks",
          params: { candidateQuery: personName, jobQuery, topN: 10 },
        },
        {
          tool: "searchResumeAnalysis",
          params: { candidateQuery: personName, topN: 5 },
        },
        {
          tool: "analyzeSkillGaps",
          params: { mode: "missing", candidateQuery: personName, topN: 5 },
        },
      ];
    case "ranking_explain":
      return [
        {
          tool: "explainAIDecision",
          params: { candidateQuery: personName, topN: personName ? 5 : 3 },
        },
        {
          tool: "searchResumeAnalysis",
          params: { candidateQuery: personName, topN: 5, focus: "all" },
        },
        {
          tool: "searchAIRanking",
          params: { candidateQuery: personName, topN: 5 },
        },
        { tool: "searchApplications", params: { limit: 8 } },
        {
          tool: "getCandidateProfile",
          params: { query: personName ?? "", limit: 5 },
        },
      ];
    case "decision_report":
      return [
        {
          tool: "generateDecisionReport",
          params: { candidateQuery: personName, jobQuery, topN: 3 },
        },
        {
          tool: "getHiringRecommendation",
          params: { candidateQuery: personName },
        },
        {
          tool: "searchResumeAnalysis",
          params: { candidateQuery: personName, topN: 3 },
        },
      ];
    case "dashboard_stats":
      return [{ tool: "getDashboardStats", params: {} }];
    case "candidate_profile":
      return [
        {
          tool: "getCandidateProfile",
          params: { query: personName ?? ctx.text, limit: 5 },
        },
        {
          tool: "searchResumeAnalysis",
          params: { candidateQuery: personName, topN: 5, focus: "all" },
        },
        {
          tool: "searchAIRanking",
          params: { candidateQuery: personName, topN: 5 },
        },
        { tool: "searchApplications", params: { limit: 8 } },
        { tool: "searchJobs", params: { status: "published", limit: 8 } },
      ];
    case "hire_advice":
      return [
        {
          tool: "searchAIRanking",
          params: {
            topN: 20,
            orderBy: "score",
            ascending: /\b(weakest|lowest)\b/.test(lower),
          },
        },
        {
          tool: "searchResumeAnalysis",
          params: {
            orderBy: "score",
            topN: 20,
            focus: "all",
          },
        },
        { tool: "searchApplications", params: { limit: 10 } },
        { tool: "searchJobs", params: { status: "published", limit: 8 } },
        {
          tool: "getHiringRecommendation",
          params: { candidateQuery: personName },
        },
      ];
    default:
      return [];
  }
}

function buildClarification(
  confidence: number,
  signals: string[],
  runnersUp: Array<{ intent: CopilotIntent }>
): DetectedCopilotIntent {
  const options = runnersUp
    .map((r) => r.intent.replace(/_/g, " "))
    .filter(Boolean)
    .slice(0, 3);
  const unique = [...new Set(options)];
  const question =
    unique.length > 1
      ? `I'm not fully sure what you need. Did you mean: ${unique.map((o) => `"${o}"`).join(", ")}? Please clarify.`
      : "I'm not sure what you're asking. Could you clarify — candidates, applications, jobs, interviews, AI ranking, or resume analysis?";

  return {
    intent: "clarify",
    confidence: Math.round(confidence * (confidence <= 1 ? 100 : 1)),
    confidenceLabel: "low",
    toolCalls: [],
    clarificationQuestion: question,
    matchedSignals: signals,
  };
}

/**
 * Semantic intent router for natural HR language.
 * Uses synonym/token/fuzzy/phrase scoring. Executes tools when confidence >= 60%.
 */
export function detectCopilotIntent(
  message: string,
  history: FollowUpHistoryMessage[] = []
): DetectedCopilotIntent {
  const followUp = resolveFollowUpQuery(message, history);
  const text = (followUp?.resolvedMessage ?? message).trim();
  const lower = text.toLowerCase().replace(/\s+/g, " ");

  if (followUp) {
    console.log("Follow-up resolved:", {
      original: message,
      resolved: text,
      kind: followUp.followUpKind,
      domain: followUp.memory.lastDomain,
    });
  }

  const semantic = detectSemanticIntent(text);
  const confidence100 = Math.round(semantic.confidence * 100);

  if (semantic.intent === "clarify" || confidence100 < COPILOT_INTENT_CONFIDENCE_THRESHOLD) {
    return buildClarification(
      semantic.confidence,
      semantic.signals,
      semantic.runnersUp
    );
  }

  const topN = extractTopN(lower, 10);
  const skill = extractSkill(lower);
  const jobQuery = extractJobQuery(lower);
  const personName =
    extractPersonName(text) ?? extractCandidateFromHireQuestion(text);
  const compareNames = extractCompareNames(text);
  const hireCandidate = extractCandidateFromHireQuestion(text) ?? personName;

  const toolCalls = buildToolCalls(semantic.intent, {
    text,
    lower,
    topN,
    skill,
    jobQuery,
    personName,
    compareNames,
    hireCandidate,
  });

  if (toolCalls.length === 0) {
    return buildClarification(semantic.confidence, semantic.signals, semantic.runnersUp);
  }

  const signals = [...semantic.signals];
  if (followUp) signals.push(`follow_up:${followUp.followUpKind}`);

  return {
    intent: semantic.intent,
    confidence: Math.min(100, confidence100 + (followUp ? 5 : 0)),
    confidenceLabel: confidenceLabel(confidence100),
    toolCalls,
    matchedSignals: signals,
  };
}

/** Primary tool name for logging (first executed tool). */
export function primaryToolName(toolCalls: CopilotToolCall[]): CopilotToolName | "none" {
  return toolCalls[0]?.tool ?? "none";
}
