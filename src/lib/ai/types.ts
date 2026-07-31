// Shared shapes for the AI resume evaluation feature. Deliberately has no
// "use server" or "server-only" marker — it's pure types/functions, safe
// to import from either the AI module or the HR data layer.

export const AI_RECOMMENDATIONS = ["shortlist", "review", "reject"] as const;
export type AIRecommendation = (typeof AI_RECOMMENDATIONS)[number];

export function isAIRecommendation(value: unknown): value is AIRecommendation {
  return (AI_RECOMMENDATIONS as readonly unknown[]).includes(value);
}

export type AIEvaluationResult = {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: AIRecommendation;
  interviewQuestions: string[];
  summary: string;
};

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

/**
 * Defensively normalizes the raw JSON the model returns into a well-formed
 * `AIEvaluationResult`. The model is asked (via the prompt) to return this
 * exact shape, but a language model's output is never trusted as-is —
 * missing fields, wrong types, or out-of-range scores are coerced to safe
 * defaults here rather than propagating `undefined`/`NaN` into the
 * database or crashing the evaluation.
 */
export function normalizeAIEvaluation(raw: unknown): AIEvaluationResult {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  return {
    overallScore: clampScore(obj.overallScore ?? obj.overall_score),
    skillsMatch: clampScore(obj.skillsMatch ?? obj.skills_match),
    experienceMatch: clampScore(obj.experienceMatch ?? obj.experience_match),
    educationMatch: clampScore(obj.educationMatch ?? obj.education_match),
    missingSkills: toStringArray(obj.missingSkills ?? obj.missing_skills),
    strengths: toStringArray(obj.strengths),
    weaknesses: toStringArray(obj.weaknesses ?? obj.concerns),
    recommendation: isAIRecommendation(obj.recommendation) ? obj.recommendation : "review",
    interviewQuestions: toStringArray(obj.interviewQuestions ?? obj.interview_questions),
    summary:
      typeof obj.summary === "string" && obj.summary.trim().length > 0
        ? obj.summary.trim()
        : "The AI model did not return a summary for this evaluation.",
  };
}
