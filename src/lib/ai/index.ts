/**
 * Groq-powered AI module (server-side only).
 *
 * Import from `@/lib/ai` in Server Actions, Route Handlers, and other
 * server-only code. Never import in Client Components.
 *
 * Client Components must import client-safe modules directly
 * (e.g. `@/lib/ai/types`, `@/lib/ai/email-labels`, `@/lib/ai/copilot-suggested-prompts`).
 */
import "server-only";

export {
  getGroqClient,
  GROQ_MODEL,
  GROQ_LIGHTWEIGHT_MODEL,
  GROQ_RESUME_MODEL,
  resolveGroqModel,
  testGroqConnection,
} from "@/lib/ai/groq";
export { analyzeResume } from "@/lib/ai/resume-analyzer";
export {
  evaluateApplicationResume,
  evaluateApplicationResumeSafe,
  recalculateJobRanking,
  computeJobContentHash,
} from "@/lib/ai/resume-evaluation-pipeline";
export { generateInterviewQuestions } from "@/lib/ai/interview-generator";
export { generateHREmail } from "@/lib/ai/email-generator";
export { generateJobDescription } from "@/lib/ai/job-description-generator";
export {
  EMAIL_GENERATOR_SYSTEM_PROMPT,
  buildEmailGeneratorUserPrompt,
} from "@/lib/ai/email-prompts";
export { EMAIL_TYPE_LABELS, EMAIL_TONE_LABELS } from "@/lib/ai/email-labels";
export { rankCandidates } from "@/lib/ai/candidate-ranking";
export { runHRCopilot, HRCopilotError, resolveAgentPlan } from "@/lib/ai/hr-copilot";
export { planWithLLM } from "@/lib/ai/agent-llm-planner";
export { HR_AGENT_TOOL_DEFINITIONS } from "@/lib/ai/agent-tool-catalog";
export {
  detectCopilotIntent,
  COPILOT_INTENT_CONFIDENCE_THRESHOLD,
} from "@/lib/ai/copilot-intent";
export {
  detectSemanticIntent,
  SEMANTIC_INTENT_THRESHOLD,
  normalizeText,
} from "@/lib/ai/semantic-intent";
export { buildAgentPlan } from "@/lib/ai/agent-planner";
export {
  resolveFollowUpQuery,
  isFollowUpMessage,
  extractContextFromHistory,
} from "@/lib/ai/copilot-followup";
export {
  getHRAnalytics,
  getPredictions,
  getSmartAlerts,
  generateAgentEmail,
  generateAgentReport,
} from "@/lib/ai/agent-tools";
export {
  searchCandidates,
  searchApplications,
  searchJobs,
  searchInterviews,
  searchAnalysis,
  searchResumeAnalysis,
  searchRanking,
  searchAIRanking,
  compareCandidates,
  getHiringRecommendation,
  analyzeSkillGaps,
  getInterviewPriority,
  getSalaryRecommendation,
  analyzeHiringRisks,
  explainAIDecision,
  generateDecisionReport,
  getDashboardStats,
  getCandidateProfile,
  matchJobCandidates,
  executeCopilotTool,
} from "@/lib/ai/hr-tools";
export { HR_COPILOT_SUGGESTED_PROMPTS } from "@/lib/ai/copilot-suggested-prompts";
export {
  HR_COPILOT_ANSWER_SYSTEM_PROMPT,
  HR_COPILOT_PLANNER_SYSTEM_PROMPT,
  HR_COPILOT_TEMPERATURE,
} from "@/lib/ai/system-prompt";
export type { CandidateRankingEntry, CandidateRankingInput } from "@/lib/ai/candidate-ranking";
export {
  computeResumeHash,
  downloadResumeBuffer,
  parseResumeBuffer,
  parseResumeFromStorage,
  ResumeParseError,
} from "@/lib/ai/resume-parser";
export { parseModelJsonResponse, stripJsonFence } from "@/lib/ai/parse-json";
export {
  buildResumeAnalysisUserPrompt,
  RESUME_ANALYSIS_SYSTEM_PROMPT,
  buildInterviewGeneratorUserPrompt,
  INTERVIEW_GENERATOR_SYSTEM_PROMPT,
  buildJobDescriptionGeneratorUserPrompt,
  JOB_DESCRIPTION_GENERATOR_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
export {
  normalizeResumeAnalysis,
  ResumeAnalysisError,
  RESUME_RECOMMENDATIONS,
  isResumeRecommendation,
  normalizeInterviewQuestions,
  InterviewGeneratorError,
  INTERVIEW_DIFFICULTIES,
  isInterviewDifficulty,
  normalizeGeneratedJobDescription,
  JobDescriptionGeneratorError,
  mapGeneratedJobToFormFields,
  normalizeGeneratedEmail,
  EmailGeneratorError,
  EMAIL_TYPES,
  isEmailType,
  EMAIL_TONES,
  isEmailTone,
  type GeneratedEmail,
  type EmailGeneratorInput,
  type EmailType,
  type EmailTone,
  type ResumeAnalysis,
  type ResumeAnalysisInput,
  type ResumeAnalysisResult,
  type ResumeRecommendation,
  type InterviewQuestions,
  type InterviewGeneratorInput,
  type InterviewDifficulty,
  type GeneratedJobDescription,
  type JobDescriptionGeneratorInput,
} from "@/lib/ai/types";
