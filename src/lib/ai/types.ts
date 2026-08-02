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

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Groq occasionally ignores the 0–100 contract and returns 0–1 or 0–10 scales.
 * - (0, 1] → percent (0.85 → 85)
 * - (1, 10] with a decimal → 0–10 scale (8.2 → 82)
 * - integers 0–100 stay as-is (so a true score of 8 is preserved)
 */
function clampScore(value: unknown): number {
  const num = toFiniteNumber(value);
  if (num == null) return 0;
  let normalized = num;
  if (num > 0 && num <= 1) {
    normalized = num * 100;
  } else if (num > 1 && num <= 10 && !Number.isInteger(num)) {
    normalized = num * 10;
  }
  return Math.max(0, Math.min(100, Math.round(normalized)));
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

// =============================================================================
// Groq resume analyzer (Phase 1)
// =============================================================================

export const RESUME_RECOMMENDATIONS = [
  "Highly Recommended",
  "Recommended",
  "Average",
  "Not Recommended",
] as const;

export type ResumeRecommendation = (typeof RESUME_RECOMMENDATIONS)[number];

export function isResumeRecommendation(value: unknown): value is ResumeRecommendation {
  return (RESUME_RECOMMENDATIONS as readonly unknown[]).includes(value);
}

export type ResumeAnalysisInput = {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
  jobRequirements?: string;
  requiredSkills?: string[];
  candidateSkills?: string[];
  yearsOfExperience?: number | null;
  educationSummary?: string;
  currentPosition?: string | null;
};

/** Structured output from Groq resume analysis / evaluation. */
export type ResumeAnalysis = {
  /** Alias of overallScore — used by existing UI + ranking. */
  score: number;
  overallScore: number;
  technicalScore: number;
  experienceScore: number;
  educationScore: number;
  communicationScore: number;
  skillMatch: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skills: string[];
  /** Skills present on both the job required list and the candidate/resume. */
  matchedSkills: string[];
  missingSkills: string[];
  experience: string;
  education: string;
  /** UI-safe recommendation enum. */
  recommendation: ResumeRecommendation;
  /** Original hire label from the model (e.g. "Strong Hire"). */
  recommendationLabel: string;
  confidence: number;
};

/** @deprecated Use `ResumeAnalysis` — kept for internal consistency during migration. */
export type ResumeAnalysisResult = ResumeAnalysis;

export class ResumeAnalysisError extends Error {
  override name = "ResumeAnalysisError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

/** Safe default used when nested AI helpers need a placeholder analysis. */
export function emptyResumeAnalysis(
  overrides: Partial<ResumeAnalysis> = {}
): ResumeAnalysis {
  return {
    score: 70,
    overallScore: 70,
    technicalScore: 70,
    experienceScore: 70,
    educationScore: 70,
    communicationScore: 70,
    skillMatch: 70,
    summary: "",
    strengths: [],
    weaknesses: [],
    skills: [],
    matchedSkills: [],
    missingSkills: [],
    experience: "",
    education: "",
    recommendation: "Average",
    recommendationLabel: "Average",
    confidence: 70,
    ...overrides,
  };
}

function recommendationFromScore(score: number): ResumeRecommendation {
  if (score >= 85) return "Highly Recommended";
  if (score >= 70) return "Recommended";
  if (score >= 50) return "Average";
  return "Not Recommended";
}

function toSummaryString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function mapHireRecommendation(raw: unknown, score: number): {
  recommendation: ResumeRecommendation;
  recommendationLabel: string;
} {
  if (typeof raw === "string" && raw.trim()) {
    const label = raw.trim();
    const lower = label.toLowerCase();

    if (isResumeRecommendation(label)) {
      return { recommendation: label, recommendationLabel: label };
    }
    if (lower.includes("strong hire") || lower.includes("highly recommended")) {
      return { recommendation: "Highly Recommended", recommendationLabel: label };
    }
    if (lower === "hire" || lower.includes("recommended")) {
      return { recommendation: "Recommended", recommendationLabel: label };
    }
    if (lower.includes("maybe") || lower.includes("average") || lower.includes("review")) {
      return { recommendation: "Average", recommendationLabel: label };
    }
    if (lower.includes("no hire") || lower.includes("not recommended") || lower.includes("reject")) {
      return { recommendation: "Not Recommended", recommendationLabel: label };
    }

    return { recommendation: recommendationFromScore(score), recommendationLabel: label };
  }

  const fallback = recommendationFromScore(score);
  return { recommendation: fallback, recommendationLabel: fallback };
}

/**
 * Normalizes raw Groq JSON into a well-formed `ResumeAnalysis`.
 * Coerces invalid or missing fields to safe defaults rather than throwing.
 * Accepts both the legacy `{ score }` shape and the full evaluation schema.
 */
export function normalizeResumeAnalysis(raw: unknown): ResumeAnalysis {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const overallScore = clampScore(
    obj.overallScore ?? obj.overall_score ?? obj.score ?? obj.skillMatch ?? obj.skillsMatch
  );
  const technicalScore =
    obj.technicalScore != null || obj.technical_score != null
      ? clampScore(obj.technicalScore ?? obj.technical_score)
      : overallScore;
  const experienceScore =
    obj.experienceScore != null || obj.experience_score != null || obj.experienceMatch != null
      ? clampScore(obj.experienceScore ?? obj.experience_score ?? obj.experienceMatch)
      : overallScore;
  const educationScore =
    obj.educationScore != null || obj.education_score != null || obj.educationMatch != null
      ? clampScore(obj.educationScore ?? obj.education_score ?? obj.educationMatch)
      : overallScore;
  const communicationScore =
    obj.communicationScore != null || obj.communication_score != null
      ? clampScore(obj.communicationScore ?? obj.communication_score)
      : overallScore;
  const skillMatch =
    obj.skillMatch != null || obj.skill_match != null || obj.skillsMatch != null
      ? clampScore(obj.skillMatch ?? obj.skill_match ?? obj.skillsMatch)
      : overallScore;

  const { recommendation, recommendationLabel } = mapHireRecommendation(
    obj.recommendation,
    overallScore
  );

  const experienceText =
    typeof obj.experience === "string"
      ? toSummaryString(obj.experience, "Experience could not be assessed from the resume.")
      : `Experience score: ${experienceScore}/100.`;
  const educationText =
    typeof obj.education === "string"
      ? toSummaryString(obj.education, "Education could not be assessed from the resume.")
      : `Education score: ${educationScore}/100.`;

  return {
    score: overallScore,
    overallScore,
    technicalScore,
    experienceScore,
    educationScore,
    communicationScore,
    skillMatch,
    summary: toSummaryString(obj.summary, "No summary was returned for this analysis."),
    strengths: toStringArray(obj.strengths),
    weaknesses: toStringArray(obj.weaknesses),
    skills: toStringArray(obj.skills),
    matchedSkills: toStringArray(obj.matchedSkills ?? obj.matched_skills),
    missingSkills: toStringArray(obj.missingSkills ?? obj.missing_skills),
    experience: experienceText,
    education: educationText,
    recommendation,
    recommendationLabel,
    confidence: clampScore(obj.confidence),
  };
}

// =============================================================================
// Interview question generator (Phase 4)
// =============================================================================

export const INTERVIEW_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type InterviewDifficulty = (typeof INTERVIEW_DIFFICULTIES)[number];

export function isInterviewDifficulty(value: unknown): value is InterviewDifficulty {
  return (INTERVIEW_DIFFICULTIES as readonly unknown[]).includes(value);
}

export type InterviewQuestions = {
  technicalQuestions: string[];
  behavioralQuestions: string[];
  followUpQuestions: string[];
  redFlags: string[];
  focusAreas: string[];
  overallDifficulty: InterviewDifficulty;
};

export type InterviewGeneratorInput = {
  jobTitle: string;
  jobDescription: string;
  resumeAnalysis: ResumeAnalysis;
  resumeText: string;
};

export class InterviewGeneratorError extends Error {
  override name = "InterviewGeneratorError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

function defaultDifficulty(analysis: ResumeAnalysis): InterviewDifficulty {
  if (analysis.score >= 85) return "Hard";
  if (analysis.score >= 65) return "Medium";
  return "Easy";
}

/**
 * Normalizes raw Groq JSON into a well-formed `InterviewQuestions`.
 */
export function normalizeInterviewQuestions(
  raw: unknown,
  resumeAnalysis: ResumeAnalysis
): InterviewQuestions {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  return {
    technicalQuestions: toStringArray(obj.technicalQuestions ?? obj.technical_questions),
    behavioralQuestions: toStringArray(obj.behavioralQuestions ?? obj.behavioral_questions),
    followUpQuestions: toStringArray(obj.followUpQuestions ?? obj.follow_up_questions),
    redFlags: toStringArray(obj.redFlags ?? obj.red_flags),
    focusAreas: toStringArray(obj.focusAreas ?? obj.focus_areas),
    overallDifficulty: isInterviewDifficulty(obj.overallDifficulty ?? obj.overall_difficulty)
      ? ((obj.overallDifficulty ?? obj.overall_difficulty) as InterviewDifficulty)
      : defaultDifficulty(resumeAnalysis),
  };
}

// =============================================================================
// Job description generator (Phase 6)
// =============================================================================

export type GeneratedJobDescription = {
  title: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  preferredQualifications: string[];
  experienceRequired: string;
  educationRequired: string;
  employmentType: string;
  seniorityLevel: string;
  department: string;
  location: string;
  workMode: string;
  salaryMin: string;
  salaryMax: string;
  benefits: string[];
  aboutCompany: string;
  seoKeywords: string[];
  matchingKeywords: string[];
};

export type JobDescriptionGeneratorInput = {
  jobTitle: string;
  department: string;
  employmentType: string;
  experience: string;
  location: string;
  salary?: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  companyName: string;
};

export class JobDescriptionGeneratorError extends Error {
  override name = "JobDescriptionGeneratorError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export function normalizeGeneratedJobDescription(raw: unknown): GeneratedJobDescription {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const summary = toSummaryString(
    obj.summary,
    "No summary was generated for this job posting."
  );
  const detailed = toSummaryString(obj.description ?? obj.detailedDescription, "");

  return {
    title: toSummaryString(obj.title, "Untitled Role"),
    summary,
    description: detailed || summary,
    responsibilities: toStringArray(obj.responsibilities),
    requirements: toStringArray(obj.requirements),
    requiredSkills: toStringArray(
      obj.requiredSkills ?? obj.required_skills ?? obj.skills
    ),
    preferredSkills: toStringArray(obj.preferredSkills ?? obj.preferred_skills),
    preferredQualifications: toStringArray(
      obj.preferredQualifications ?? obj.preferred_qualifications
    ),
    experienceRequired: toSummaryString(
      obj.experienceRequired ?? obj.experience_required ?? obj.experience,
      ""
    ),
    educationRequired: toSummaryString(
      obj.educationRequired ?? obj.education_required ?? obj.education,
      ""
    ),
    employmentType: toSummaryString(obj.employmentType ?? obj.employment_type, ""),
    seniorityLevel: toSummaryString(obj.seniorityLevel ?? obj.seniority_level, ""),
    department: toSummaryString(obj.department, ""),
    location: toSummaryString(obj.location, ""),
    workMode: toSummaryString(obj.workMode ?? obj.work_mode, ""),
    salaryMin: (() => {
      const raw =
        obj.salaryMin ??
        obj.salary_min ??
        (obj.salaryRange as { min?: unknown } | undefined)?.min;
      if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
      return toSummaryString(raw, "");
    })(),
    salaryMax: (() => {
      const raw =
        obj.salaryMax ??
        obj.salary_max ??
        (obj.salaryRange as { max?: unknown } | undefined)?.max;
      if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
      return toSummaryString(raw, "");
    })(),
    benefits: toStringArray(obj.benefits),
    aboutCompany: toSummaryString(obj.aboutCompany ?? obj.about_company, ""),
    seoKeywords: toStringArray(obj.seoKeywords ?? obj.seo_keywords),
    matchingKeywords: toStringArray(
      obj.matchingKeywords ?? obj.matching_keywords ?? obj.seoKeywords ?? obj.seo_keywords
    ),
  };
}

/** Maps Groq output into all corresponding HR job form fields. */
export function mapGeneratedJobToFormFields(generated: GeneratedJobDescription): {
  title: string;
  summary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchingKeywords: string[];
  experienceRequired: string;
  educationRequired: string;
  employmentType: string;
  seniorityLevel: string;
  department: string;
  location: string;
  workMode: string;
  salaryMin: string;
  salaryMax: string;
} {
  const descriptionParts = [
    generated.description || generated.summary,
    generated.aboutCompany ? `\n\nAbout the company:\n${generated.aboutCompany}` : "",
  ]
    .join("")
    .trim();

  const responsibilities = generated.responsibilities.map((item) => `• ${item}`).join("\n");
  const requirements = generated.requirements.map((item) => `• ${item}`).join("\n");
  const benefits =
    generated.benefits.length > 0
      ? generated.benefits.map((item) => `• ${item}`).join("\n")
      : "";

  const preferredSkills = [
    ...generated.preferredSkills,
    ...generated.preferredQualifications,
  ].filter((skill, index, arr) => {
    const key = skill.toLowerCase();
    return arr.findIndex((s) => s.toLowerCase() === key) === index;
  });

  return {
    title: generated.title,
    summary: generated.summary,
    description: descriptionParts,
    responsibilities,
    requirements,
    benefits,
    requiredSkills: generated.requiredSkills.slice(0, 20),
    preferredSkills: preferredSkills.slice(0, 20),
    matchingKeywords: (generated.matchingKeywords.length
      ? generated.matchingKeywords
      : generated.seoKeywords
    ).slice(0, 20),
    experienceRequired: generated.experienceRequired,
    educationRequired: generated.educationRequired,
    employmentType: generated.employmentType,
    seniorityLevel: generated.seniorityLevel,
    department: generated.department,
    location: generated.location,
    workMode: generated.workMode,
    salaryMin: generated.salaryMin.replace(/[^\d.]/g, ""),
    salaryMax: generated.salaryMax.replace(/[^\d.]/g, ""),
  };
}

// =============================================================================
// Email generator (Phase 8)
// =============================================================================

export const EMAIL_TYPES = [
  "interview_invitation",
  "interview_reminder",
  "interview_reschedule",
  "interview_cancellation",
  "rejection",
  "offer_letter",
  "follow_up",
  "general",
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];

export function isEmailType(value: unknown): value is EmailType {
  return typeof value === "string" && (EMAIL_TYPES as readonly string[]).includes(value);
}

export const EMAIL_TONES = ["professional", "friendly", "formal"] as const;

export type EmailTone = (typeof EMAIL_TONES)[number];

export function isEmailTone(value: unknown): value is EmailTone {
  return typeof value === "string" && (EMAIL_TONES as readonly string[]).includes(value);
}

export type GeneratedEmail = {
  subject: string;
  body: string;
  shortSummary: string;
};

export type EmailGeneratorInput = {
  emailType: EmailType;
  tone: EmailTone;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate?: string | null;
  interviewTime?: string | null;
  interviewLocation?: string | null;
  hrNotes?: string | null;
};

export class EmailGeneratorError extends Error {
  override name = "EmailGeneratorError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

function toEmailString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function normalizeGeneratedEmail(raw: unknown): GeneratedEmail {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  return {
    subject: toEmailString(obj.subject, "Message from our recruitment team"),
    body: toEmailString(
      obj.body,
      "Thank you for your interest in joining our team. Our HR department will be in touch with you shortly."
    ),
    shortSummary: toEmailString(obj.shortSummary ?? obj.short_summary, "HR email draft"),
  };
}
