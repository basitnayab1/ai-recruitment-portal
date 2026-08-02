/**
 * Broad natural-language coverage for the agent fallback planner.
 * Not user-facing commands — loose paraphrase matching so HR questions
 * still route when the LLM planner is unavailable (rate limits, outages).
 */

import type { CopilotToolCall } from "@/lib/ai/hr-tools";
import {
  compareEvidencePack,
  hiringDecisionEvidencePack,
  resumeAnalysisEvidencePack,
  scoreExplainEvidencePack,
} from "@/lib/ai/resume-evidence-pack";
import {
  comparisonWorkflowPack,
  insightsWorkflowPack,
  interviewDecisionWorkflowPack,
  pipelineWorkflowPack,
  shortlistWorkflowPack,
} from "@/lib/ai/workflow-evidence-pack";
import { communicationEvidencePack } from "@/lib/ai/communication-evidence-pack";
import {
  detectCommunicationEmailType,
  detectCommunicationTone,
} from "@/lib/ai/communication-assistant-report";

type Rule = {
  re: RegExp;
  build: (message: string) => CopilotToolCall[];
};

const RULES: Rule[] = [
  // AI Recruitment Workflow Agent — shortlist / interview-first / top applicants
  {
    re: /\b(shortlist candidates|show shortlisted|top candidates|best applicants|recommend top|recommend best applicants|who should we interview|interview first|who should i hire|who is the (best|strongest)|strongest applicant|which candidate is best|best candidate|recommend best)\b/i,
    build: () => shortlistWorkflowPack({ topN: 8 }),
  },
  // Workflow — side-by-side comparison
  {
    re: /\b(compare( candidates?)?|compare .+ and|who is better|more suitable|side[- ]by[- ]side)\b/i,
    build: () => comparisonWorkflowPack({ topN: 5 }),
  },
  // Workflow — interview / reject / hold / another review
  {
    re: /\b(who should be rejected|needs? another (interview|review)|recommend (interview|reject|hold)|interview recommendation)\b/i,
    build: () => interviewDecisionWorkflowPack({ topN: 8 }),
  },
  // Workflow — hiring pipeline summary
  {
    re: /\b(hiring pipeline|recruitment summary|hiring dashboard|hiring summary|summarize hiring|dashboard summary)\b/i,
    build: () => pipelineWorkflowPack(),
  },
  // Workflow — HR insights
  {
    re: /\b(biggest skill gaps|most common missing|strongest candidates|weakest candidates|needing attention|candidates needing)\b/i,
    build: () => insightsWorkflowPack(),
  },
  // AI Hiring Assistant — single-candidate hire / recommend / fit / reject / shortlist
  {
    re: /\b(should i hire|would you recommend|recommend (this|the) candidate|recommend someone to hire|is this candidate a good fit|good fit|why should i (hire|reject)|suitable for|against the job requirements|give a hiring recommendation|hiring recommendation|would you advance|assess this hire|recommend an offer|worth interviewing|is he worth|is she worth|should i shortlist|shortlist (this|him|her|them))\b/i,
    build: () => hiringDecisionEvidencePack({ topN: 5 }),
  },
  // Role fit / recommend for X / another suitable job
  {
    re: /\b(can (he|she|they) work as|fit for|succeed in|fit check|skill set match|recommend( him| her| them)? for|would (he|she|they) fit|suitable (for|as|job|role)|another suitable (job|role)|recommend another)\b/i,
    build: () => [
      ...resumeAnalysisEvidencePack({ topN: 5 }),
      { tool: "analyzeSkillGaps", params: { mode: "missing", topN: 5 } },
      { tool: "matchJobCandidates", params: { topN: 5 } },
      { tool: "getHiringRecommendation", params: {} },
    ],
  },
  // Risks
  {
    re: /\b(red flags?|what.?s blocking|hiring risks?|what are the risks)\b/i,
    build: () => [
      ...resumeAnalysisEvidencePack({ topN: 5 }),
      { tool: "analyzeHiringRisks", params: { topN: 10 } },
      { tool: "analyzeSkillGaps", params: { mode: "missing", topN: 5 } },
    ],
  },
  // Score / ranking explain / why low / why score is N
  {
    re: /\b(what put .+ at the top|why did the model shortlist|why ranked|explain .+ ranking|explain (this|the) ai score|explain (the )?ai score|explain (this|the) score|explain why the score|break down the ai score|why is (his|her|their|the) score|score (only|low)|why .+ score low|low score|score is \d+)\b/i,
    build: () => [
      ...scoreExplainEvidencePack({ topN: 5 }),
      { tool: "analyzeHiringRisks", params: { topN: 3 } },
      { tool: "getHiringRecommendation", params: {} },
    ],
  },
  // Strengths / weaknesses / missing skills / summarize resume
  {
    re: /\b(what are (his|her|their|the|candidate'?s)?\s*strengths|what are (his|her|their|the|candidate'?s)?\s*weaknesses|which missing skills|missing skills matter|what skills? are missing|skills? are missing\?|summarize (this )?resume|resume summary)\b/i,
    build: () => [
      ...hiringDecisionEvidencePack({ topN: 5 }),
    ],
  },
  // Profile
  {
    re: /\b(tell me about|what do we know about|walk me through|background|profile overview)\b/i,
    build: () => resumeAnalysisEvidencePack({ topN: 5 }),
  },
  {
    re: /\babout\s+[A-Z][a-z]+\b/,
    build: () => resumeAnalysisEvidencePack({ topN: 5 }),
  },
  // Empty pipelines
  {
    re: /\b(no applicants|zero applications|nobody applied|empty pipelines|unfilled openings|thin on applicants|quiet job)\b/i,
    build: () => [
      { tool: "searchJobs", params: { limit: 10 } },
      { tool: "searchApplications", params: { limit: 10 } },
    ],
  },
  // Pipeline
  {
    re: /\b(considering right now|new in the pipeline|quick read on applicants|screen .+ pipeline|anyone new)\b/i,
    build: () => [
      { tool: "searchApplications", params: { limit: 10 } },
      { tool: "searchCandidates", params: { limit: 10 } },
      { tool: "searchAIRanking", params: { topN: 10 } },
    ],
  },
  // Jobs
  {
    re: /\b(openings are live|published roles|live openings|current vacancies|what openings)\b/i,
    build: () => [{ tool: "searchJobs", params: { limit: 10, status: "published" } }],
  },
  // AI Interview Assistant — personalized question packs
  {
    re: /\b(generate interview questions|interview questions|technical interview|behavioral interview|hr interview|follow[- ]?up questions|questions based on|questions for (a |this |the )?|generate \d+\s+interview|what should i ask|questions based on missing skills)\b/i,
    build: () => [
      ...hiringDecisionEvidencePack({ topN: 5 }),
      { tool: "getInterviewPriority", params: { topN: 10 } },
    ],
  },
  // Interview calendar / ops (not question generation)
  {
    re: /\b(interview calendar|interviews? (tomorrow|today)|prep for today|waiting for an interview|cancelled interviews?|interview slot)\b/i,
    build: () => [
      { tool: "searchInterviews", params: { limit: 10 } },
      { tool: "getInterviewPriority", params: { topN: 10 } },
      { tool: "searchApplications", params: { limit: 10 } },
    ],
  },
  // Resume quality
  {
    re: /\b(how strong is this resume|resume weaknesses|rate the cv|cv quality|strengths from the analysis|strongest on paper|call out resume)\b/i,
    build: () => resumeAnalysisEvidencePack({ topN: 5 }),
  },
  // Leaderboard
  {
    re: /\b(leaderboard|top three .+ score|scored the lowest|by score|best ai score|show ai ranking)\b/i,
    build: () => [
      { tool: "searchAIRanking", params: { topN: 10 } },
      { tool: "searchResumeAnalysis", params: { orderBy: "score", topN: 10 } },
    ],
  },
  // Salary
  {
    re: /\b(salary band|suggested salary|salary range|compensation|what salary|salary should i offer)\b/i,
    build: () => [
      { tool: "getSalaryRecommendation", params: { topN: 5 } },
      ...resumeAnalysisEvidencePack({ topN: 5 }),
    ],
  },
  // Interview order
  {
    re: /\b(interview order|interview first|interview priority)\b/i,
    build: () => [
      { tool: "getInterviewPriority", params: { topN: 10 } },
      { tool: "searchJobs", params: { limit: 8 } },
      { tool: "searchAIRanking", params: { topN: 10 } },
    ],
  },
  // Analytics
  {
    re: /\b(hiring trending|dashboard snapshot|numbers for leadership|how is hiring)\b/i,
    build: () => [
      { tool: "getHRAnalytics", params: {} },
      { tool: "getDashboardStats", params: {} },
      { tool: "generateAgentReport", params: { reportType: "recruitment_summary" } },
    ],
  },
  // Alerts
  {
    re: /\b(pending reviews|sitting too long|no ai score|without ai score|smart alerts)\b/i,
    build: () => [
      { tool: "getSmartAlerts", params: {} },
      { tool: "searchApplications", params: { limit: 10 } },
    ],
  },
  // Match
  {
    re: /\b(best match for|match for)\b/i,
    build: () => [
      { tool: "matchJobCandidates", params: { topN: 5 } },
      ...resumeAnalysisEvidencePack({ topN: 5 }),
    ],
  },
  // Compare
  {
    re: /\b(compare (him|her|them|top)|which candidate is better|who is better)\b/i,
    build: () => compareEvidencePack({ topN: 5 }),
  },
  // Decision report
  {
    re: /\b(full decision report|decision report|why we might reject|explain why .+ reject)\b/i,
    build: () => [
      ...hiringDecisionEvidencePack({ topN: 3 }),
      { tool: "generateDecisionReport", params: { topN: 3 } },
      { tool: "explainAIDecision", params: { topN: 3 } },
    ],
  },
  // AI Recruitment Communication Assistant
  {
    re: /\b(send (an? )?interview invitation|write (an? )?interview invitation|interview invitation email|generate (a |an )?(rejection|offer|follow[- ]?up|salary|onboarding|reminder) email|generate (an? )?offer letter|thank the candidate|ask (the )?candidate for missing|missing documents|reschedule interview|cancel interview|confirm interview|send reminder|reminder email|salary negotiation|onboarding email|shortlist email|draft .+ email|write .+ email|generate email)\b/i,
    build: (message) =>
      communicationEvidencePack({
        emailType: detectCommunicationEmailType(message),
        tone: detectCommunicationTone(message),
      }),
  },
  // Predictions
  {
    re: /\b(probability we fill|fill this role|hiring difficult|time to fill|predict)\b/i,
    build: () => [
      { tool: "getPredictions", params: {} },
      { tool: "searchJobs", params: { limit: 8 } },
      { tool: "searchApplications", params: { limit: 10 } },
    ],
  },
];

export function matchNaturalLanguageCoverage(
  message: string
): CopilotToolCall[] | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  for (const rule of RULES) {
    if (rule.re.test(trimmed)) {
      return rule.build(trimmed);
    }
  }
  return null;
}
