/**
 * Evidence packs for the AI Recruitment Workflow Agent.
 */

import type { CopilotToolCall } from "@/lib/ai/hr-tools";
import {
  compareEvidencePack,
  hiringDecisionEvidencePack,
  resumeAnalysisEvidencePack,
} from "@/lib/ai/resume-evidence-pack";

export type WorkflowPackParams = {
  candidateQuery?: string;
  jobQuery?: string;
  names?: string[];
  topN?: number;
};

/** Shortlist / top applicants / interview-first pack. */
export function shortlistWorkflowPack(
  params: WorkflowPackParams = {}
): CopilotToolCall[] {
  const topN = params.topN ?? 8;
  return [
    ...resumeAnalysisEvidencePack({
      candidateQuery: params.candidateQuery,
      jobQuery: params.jobQuery,
      topN,
    }),
    {
      tool: "getInterviewPriority",
      params: {
        topN,
        ...(params.jobQuery ? { jobQuery: params.jobQuery } : {}),
      },
    },
    {
      tool: "analyzeSkillGaps",
      params: {
        mode: "missing",
        topN,
        ...(params.candidateQuery ? { candidateQuery: params.candidateQuery } : {}),
        ...(params.jobQuery ? { jobQuery: params.jobQuery } : {}),
      },
    },
    {
      tool: "searchApplications",
      params: {
        limit: 40,
        ...(params.jobQuery ? { jobQuery: params.jobQuery } : {}),
      },
    },
  ];
}

/** Side-by-side comparison pack. */
export function comparisonWorkflowPack(
  params: WorkflowPackParams = {}
): CopilotToolCall[] {
  return compareEvidencePack({
    names: params.names,
    jobQuery: params.jobQuery,
    topN: params.topN ?? 5,
  });
}

/** Interview / reject / hold recommendation pack. */
export function interviewDecisionWorkflowPack(
  params: WorkflowPackParams = {}
): CopilotToolCall[] {
  return [
    ...hiringDecisionEvidencePack({
      candidateQuery: params.candidateQuery,
      jobQuery: params.jobQuery,
      topN: params.topN ?? 8,
    }),
    {
      tool: "getInterviewPriority",
      params: {
        topN: params.topN ?? 10,
        ...(params.jobQuery ? { jobQuery: params.jobQuery } : {}),
      },
    },
  ];
}

/** Hiring pipeline / dashboard summary pack. */
export function pipelineWorkflowPack(): CopilotToolCall[] {
  return [
    { tool: "getDashboardStats", params: {} },
    { tool: "getHRAnalytics", params: {} },
    { tool: "searchJobs", params: { limit: 20, status: "published" } },
    { tool: "searchApplications", params: { limit: 50 } },
    { tool: "searchInterviews", params: { limit: 30 } },
    { tool: "searchAIRanking", params: { topN: 10, orderBy: "score" } },
  ];
}

/** HR insights pack (gaps, strongest/weakest, attention). */
export function insightsWorkflowPack(
  params: WorkflowPackParams = {}
): CopilotToolCall[] {
  return [
    {
      tool: "searchResumeAnalysis",
      params: { orderBy: "score", topN: 20, ...(params.jobQuery ? { jobQuery: params.jobQuery } : {}) },
    },
    {
      tool: "searchAIRanking",
      params: { topN: 20, orderBy: "score", ...(params.jobQuery ? { jobQuery: params.jobQuery } : {}) },
    },
    { tool: "analyzeSkillGaps", params: { mode: "missing", topN: 30 } },
    { tool: "getSmartAlerts", params: {} },
    { tool: "searchApplications", params: { limit: 40 } },
    { tool: "getDashboardStats", params: {} },
  ];
}
