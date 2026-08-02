"use server";

import { revalidatePath } from "next/cache";
import { generateInterviewQuestions } from "@/lib/ai/interview-generator";
import { InterviewGeneratorError, type InterviewQuestions } from "@/lib/ai/types";
import { parseResumeFromStorage, ResumeParseError } from "@/lib/ai/resume-parser";
import { requireHRUser } from "@/lib/auth/dal";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import {
  getCachedInterviewQuestions,
  saveInterviewQuestions,
  type StoredInterviewQuestions,
} from "@/lib/hr/interview-questions-data";
import { getLatestResumeAnalysisForCandidate } from "@/lib/hr/resume-analysis-data";
import { createClient } from "@/lib/supabase/server";

export type InterviewQuestionsActionState =
  | { status: "success"; questions: InterviewQuestions; cached: boolean; stored: StoredInterviewQuestions }
  | { status: "error"; message: string }
  | undefined;

const LOG = "[hr/interview-questions]";

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TXT_MIME = "text/plain";

type ApplicationContext = {
  id: string;
  candidateId: string;
  cvStoragePath: string;
  jobTitle: string;
  jobDescription: string;
};

function mimeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".docx")) return DOCX_MIME;
  if (lower.endsWith(".txt")) return TXT_MIME;
  return PDF_MIME;
}

function logStep(step: string, details?: Record<string, unknown>): void {
  if (details) {
    console.log(`${LOG} ${step}`, details);
  } else {
    console.log(`${LOG} ${step}`);
  }
}

async function loadApplicationContext(applicationId: string): Promise<ApplicationContext> {
  logStep("loadApplicationContext:start", { applicationId });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("id, candidate_id, cv_storage_path, jobs ( title, description )")
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data) {
    console.error(`${LOG} loadApplicationContext:failed`, {
      applicationId,
      error: error?.message ?? "no row",
    });
    throw new InterviewGeneratorError("Application not found.");
  }

  const row = data as unknown as {
    id: string;
    candidate_id: string | null;
    cv_storage_path: string | null;
    jobs: { title: string; description: string } | { title: string; description: string }[] | null;
  };

  if (!row.candidate_id) {
    throw new InterviewGeneratorError("This application has no linked candidate profile.");
  }

  const job = Array.isArray(row.jobs) ? (row.jobs[0] ?? null) : row.jobs;
  const jobTitle = job?.title?.trim();
  const jobDescription = job?.description?.trim();

  if (!jobTitle) {
    throw new InterviewGeneratorError(
      "Job title is missing for this application. Add a job title before generating interview questions."
    );
  }
  if (!jobDescription) {
    throw new InterviewGeneratorError(
      "Job description is missing for this application. Add a job description before generating interview questions."
    );
  }

  let storagePath = row.cv_storage_path?.trim() ?? "";

  if (!storagePath) {
    const { data: resumeRow } = await supabase
      .from("candidate_resumes")
      .select("storage_path")
      .eq("candidate_id", row.candidate_id)
      .maybeSingle();

    storagePath = (resumeRow as { storage_path: string } | null)?.storage_path?.trim() ?? "";
  }

  if (!storagePath) {
    throw new InterviewGeneratorError(
      "No résumé is available for this application. Ask the candidate to upload a résumé, then try again."
    );
  }

  logStep("loadApplicationContext:ok", {
    applicationId: row.id,
    candidateId: row.candidate_id,
    jobTitle,
    jobDescriptionChars: jobDescription.length,
    resumePath: storagePath,
  });

  return {
    id: row.id,
    candidateId: row.candidate_id,
    cvStoragePath: storagePath,
    jobTitle,
    jobDescription,
  };
}

async function loadResumeText(storagePath: string): Promise<string> {
  logStep("loadResumeText:start", { storagePath });
  const fileName = storagePath.split("/").pop() ?? "resume.pdf";
  const mimeType = mimeFromFileName(fileName);
  const { text } = await parseResumeFromStorage(storagePath, mimeType, fileName);
  logStep("loadResumeText:ok", { fileName, mimeType, resumeChars: text.length });
  return text;
}

/**
 * Core interview question pipeline shared by generate and regenerate actions.
 * Skips Groq when cached questions exist unless `force` is true.
 */
export async function runInterviewQuestionGeneration(input: {
  applicationId: string;
  force: boolean;
}): Promise<{ questions: InterviewQuestions; cached: boolean; stored: StoredInterviewQuestions }> {
  logStep("request received", { applicationId: input.applicationId, force: input.force });

  const hr = await requireHRUser();
  logStep("auth:ok");

  const limit = checkRateLimit({
    key: rateLimitKey("hr-interview-questions", hr.id),
    limit: 40,
    windowMs: 60 * 60 * 1000,
    message: "Interview question generation rate limit reached. Please try again later.",
  });
  if (!limit.ok) {
    throw new InterviewGeneratorError(limit.message);
  }

  const context = await loadApplicationContext(input.applicationId);

  logStep("resumeAnalysis:lookup", {
    candidateId: context.candidateId,
    applicationId: input.applicationId,
  });
  const resumeAnalysis = await getLatestResumeAnalysisForCandidate(
    context.candidateId,
    input.applicationId
  );

  if (!resumeAnalysis) {
    throw new InterviewGeneratorError(
      "AI résumé analysis is required first. Run AI Resume Analysis for this candidate, then generate interview questions."
    );
  }
  logStep("resumeAnalysis:ok", {
    analysisId: resumeAnalysis.id,
    score: resumeAnalysis.score,
    recommendation: resumeAnalysis.recommendation,
  });

  if (!input.force) {
    const cached = await getCachedInterviewQuestions(input.applicationId, resumeAnalysis.analysis);
    // Invalidate when résumé analysis was refreshed after questions were stored.
    const analysisIsNewer =
      Boolean(cached) &&
      new Date(resumeAnalysis.updatedAt).getTime() > new Date(cached!.updatedAt).getTime();
    if (cached && !analysisIsNewer) {
      logStep("cache:hit", { questionsId: cached.id });
      return { questions: cached.questions, cached: true, stored: cached };
    }
    logStep(analysisIsNewer ? "cache:stale (analysis newer)" : "cache:miss");
  } else {
    logStep("cache:bypassed (force regenerate)");
  }

  const resumeText = await loadResumeText(context.cvStoragePath);

  logStep("AI request:start", {
    jobTitle: context.jobTitle,
    jobDescriptionChars: context.jobDescription.length,
    resumeChars: resumeText.length,
    hasResumeAnalysis: true,
  });

  const questions = await generateInterviewQuestions({
    jobTitle: context.jobTitle,
    jobDescription: context.jobDescription,
    resumeAnalysis: resumeAnalysis.analysis,
    resumeText,
  });

  logStep("AI response:parsed", {
    technical: questions.technicalQuestions.length,
    behavioral: questions.behavioralQuestions.length,
    followUp: questions.followUpQuestions.length,
    difficulty: questions.overallDifficulty,
  });

  logStep("database write:start", {
    candidateId: context.candidateId,
    applicationId: input.applicationId,
  });

  const stored = await saveInterviewQuestions({
    candidateId: context.candidateId,
    applicationId: input.applicationId,
    questions,
  });

  logStep("database write:ok", { questionsId: stored.id });

  return { questions, cached: false, stored };
}

function mapDbSchemaError(message: string): string | null {
  if (
    /ai_interview_questions/i.test(message) ||
    (/schema cache/i.test(message) && /interview/i.test(message))
  ) {
    return (
      "Database table ai_interview_questions is missing. " +
      "Open the Supabase SQL Editor and run supabase/migrations/024_ai_interview_questions.sql, then try again."
    );
  }
  return null;
}

function handleError(error: unknown): InterviewQuestionsActionState {
  if (error instanceof InterviewGeneratorError || error instanceof ResumeParseError) {
    console.error(`${LOG} known error:`, error.message, error.stack);
    return { status: "error", message: error.message };
  }

  if (error instanceof Error) {
    console.error(`${LOG} Unexpected error:`, error.message);
    console.error(`${LOG} Error stack:`, error.stack);
    if (error.cause) {
      console.error(`${LOG} Error cause:`, error.cause);
    }

    const schemaMessage = mapDbSchemaError(error.message);
    if (schemaMessage) {
      return { status: "error", message: schemaMessage };
    }

    return { status: "error", message: error.message };
  }

  console.error(`${LOG} Unexpected non-Error:`, error);
  return { status: "error", message: "Interview question generation failed. Please try again." };
}

/**
 * Server Action: generate interview questions (uses cache when available).
 */
export async function generateInterviewQuestionsAction(
  _prevState: InterviewQuestionsActionState,
  formData: FormData
): Promise<InterviewQuestionsActionState> {
  try {
    const applicationId = String(formData.get("applicationId") ?? "").trim();
    logStep("generateInterviewQuestionsAction", { applicationId: applicationId || "(empty)" });

    if (!applicationId) {
      return { status: "error", message: "Missing application reference." };
    }

    const result = await runInterviewQuestionGeneration({
      applicationId,
      force: false,
    });

    revalidatePath(`/hr/applications/${applicationId}`);
    logStep("generateInterviewQuestionsAction:success", { cached: result.cached });

    return {
      status: "success",
      questions: result.questions,
      cached: result.cached,
      stored: result.stored,
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Server Action: force fresh Groq generation and overwrite cached questions.
 */
export async function regenerateInterviewQuestionsAction(
  _prevState: InterviewQuestionsActionState,
  formData: FormData
): Promise<InterviewQuestionsActionState> {
  try {
    const applicationId = String(formData.get("applicationId") ?? "").trim();
    logStep("regenerateInterviewQuestionsAction", { applicationId: applicationId || "(empty)" });

    if (!applicationId) {
      return { status: "error", message: "Missing application reference." };
    }

    const result = await runInterviewQuestionGeneration({
      applicationId,
      force: true,
    });

    revalidatePath(`/hr/applications/${applicationId}`);
    logStep("regenerateInterviewQuestionsAction:success");

    return {
      status: "success",
      questions: result.questions,
      cached: false,
      stored: result.stored,
    };
  } catch (error) {
    return handleError(error);
  }
}
