/**
 * Evidence pack for the AI Recruitment Communication Assistant.
 */

import type { CopilotToolCall } from "@/lib/ai/hr-tools";

export type CommunicationPackParams = {
  candidateQuery?: string;
  jobQuery?: string;
  emailType?: string;
  tone?: string;
  companyName?: string;
};

/** Live context for drafting candidate-facing HR emails. */
export function communicationEvidencePack(
  params: CommunicationPackParams = {}
): CopilotToolCall[] {
  const candidate = params.candidateQuery?.trim() || undefined;
  const job = params.jobQuery?.trim() || undefined;

  return [
    {
      tool: "searchApplications",
      params: {
        limit: 15,
        ...(job ? { jobQuery: job } : {}),
      },
    },
    {
      tool: "searchInterviews",
      params: {
        limit: 20,
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
    {
      tool: "searchCandidates",
      params: {
        limit: 5,
        ...(candidate ? { query: candidate } : {}),
      },
    },
    {
      tool: "getCandidateProfile",
      params: {
        limit: 3,
        ...(candidate ? { query: candidate } : {}),
      },
    },
    {
      tool: "searchResumeAnalysis",
      params: {
        orderBy: "score",
        topN: 5,
        ...(candidate ? { candidateQuery: candidate } : {}),
        ...(job ? { jobQuery: job } : {}),
      },
    },
    {
      tool: "searchAIRanking",
      params: {
        topN: 5,
        orderBy: "score",
        ...(candidate ? { candidateQuery: candidate } : {}),
        ...(job ? { jobQuery: job } : {}),
      },
    },
    {
      tool: "generateAgentEmail",
      params: {
        emailType: params.emailType ?? "general",
        ...(candidate ? { candidateQuery: candidate } : {}),
        ...(job ? { jobQuery: job } : {}),
        ...(params.companyName ? { companyName: params.companyName } : {}),
        ...(params.tone ? { tone: params.tone } : {}),
      },
    },
  ];
}
