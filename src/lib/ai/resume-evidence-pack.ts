/**
 * Standard tool pack for resume-analysis / hiring questions.
 * Ensures Copilot always loads analysis, ranking, applications, jobs, and profiles.
 */

import type { CopilotToolCall } from "@/lib/ai/hr-tools";

export type EvidencePackParams = {
  candidateQuery?: string;
  jobQuery?: string;
  topN?: number;
};

/** Core evidence every resume/hire question should retrieve. */
export function resumeAnalysisEvidencePack(
  params: EvidencePackParams = {}
): CopilotToolCall[] {
  const topN = params.topN ?? 5;
  const candidate = params.candidateQuery;
  const job = params.jobQuery;

  return [
    {
      tool: "searchResumeAnalysis",
      params: {
        orderBy: "score",
        topN,
        ...(candidate ? { candidateQuery: candidate } : {}),
        ...(job ? { jobQuery: job } : {}),
      },
    },
    {
      tool: "searchAIRanking",
      params: {
        orderBy: "score",
        topN,
        ...(candidate ? { candidateQuery: candidate } : {}),
        ...(job ? { jobQuery: job } : {}),
      },
    },
    {
      tool: "searchApplications",
      params: {
        limit: Math.max(topN, 8),
        ...(job ? { jobQuery: job } : {}),
      },
    },
    {
      tool: "searchJobs",
      params: {
        limit: 8,
        status: "published",
        ...(job ? { query: job } : {}),
      },
    },
    ...(candidate
      ? [
          {
            tool: "getCandidateProfile" as const,
            params: {
              limit: 5,
              query: candidate,
            },
          },
        ]
      : [
          {
            tool: "searchCandidates" as const,
            params: { limit: 8 },
          },
        ]),
  ];
}

/** Hire / shortlist / interview decision pack. */
export function hiringDecisionEvidencePack(
  params: EvidencePackParams = {}
): CopilotToolCall[] {
  const candidate = params.candidateQuery;
  const job = params.jobQuery;
  return [
    ...resumeAnalysisEvidencePack(params),
    {
      tool: "analyzeSkillGaps",
      params: {
        mode: "missing",
        topN: params.topN ?? 5,
        ...(candidate ? { candidateQuery: candidate } : {}),
      },
    },
    {
      tool: "analyzeHiringRisks",
      params: {
        topN: 3,
        ...(candidate ? { candidateQuery: candidate } : {}),
        ...(job ? { jobQuery: job } : {}),
      },
    },
    {
      tool: "getHiringRecommendation",
      params: {
        ...(candidate ? { candidateQuery: candidate } : {}),
        ...(job ? { jobQuery: job } : {}),
      },
    },
  ];
}

/** Score explanation pack. */
export function scoreExplainEvidencePack(
  params: EvidencePackParams = {}
): CopilotToolCall[] {
  return [
    {
      tool: "explainAIDecision",
      params: {
        topN: params.candidateQuery ? 5 : 3,
        ...(params.candidateQuery
          ? { candidateQuery: params.candidateQuery }
          : {}),
        ...(params.jobQuery ? { jobQuery: params.jobQuery } : {}),
      },
    },
    ...resumeAnalysisEvidencePack(params),
  ];
}

/** Compare pack. */
export function compareEvidencePack(
  params: EvidencePackParams & { names?: string[] } = {}
): CopilotToolCall[] {
  return [
    {
      tool: "compareCandidates",
      params: {
        names: params.names?.length ? params.names : undefined,
        topN: 2,
        ...(params.jobQuery ? { jobQuery: params.jobQuery } : {}),
      },
    },
    ...resumeAnalysisEvidencePack(params),
  ];
}

/** Interview Assistant evidence pack. */
export function interviewAssistantEvidencePack(
  params: EvidencePackParams = {}
): CopilotToolCall[] {
  return [
    ...hiringDecisionEvidencePack(params),
    { tool: "getInterviewPriority", params: { topN: 10 } },
  ];
}
