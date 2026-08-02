"use server";

import { revalidatePath } from "next/cache";
import { evaluateApplicationResume } from "@/lib/ai/resume-evaluation-pipeline";
import { parseResumeFromStorage, ResumeParseError } from "@/lib/ai/resume-parser";
import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { ResumeAnalysisError, type ResumeAnalysis } from "@/lib/ai/types";
import { requireHRUser } from "@/lib/auth/dal";
import {
  getCachedResumeAnalysis,
  getLatestResumeAnalysisForCandidate,
  saveResumeAnalysis,
  type StoredResumeAnalysis,
} from "@/lib/hr/resume-analysis-data";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { recalculateJobRanking } from "@/lib/ai/resume-evaluation-pipeline";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResumeAnalysisActionState =
  | { status: "success"; analysis: ResumeAnalysis; cached: boolean; stored: StoredResumeAnalysis }
  | { status: "error"; message: string }
  | undefined;

type CandidateResumeRow = {
  candidate_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  uploaded_at: string;
};

type JobContext = {
  jobTitle: string;
  jobDescription: string;
  jobId: string | null;
};

async function loadCandidateResume(candidateId: string): Promise<CandidateResumeRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidate_resumes")
    .select("candidate_id, storage_path, file_name, mime_type, uploaded_at")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CandidateResumeRow;
}

async function resolveJobContext(
  candidateId: string,
  applicationId: string | null
): Promise<JobContext> {
  const supabase = await createClient();

  if (applicationId) {
    const { data, error } = await supabase
      .from("applications")
      .select("candidate_id, job_id, jobs ( title, description )")
      .eq("id", applicationId)
      .maybeSingle();

    if (error || !data) {
      throw new ResumeAnalysisError("Application not found for résumé analysis.");
    }

    const raw = data as unknown as {
      candidate_id: string | null;
      job_id: string;
      jobs: { title: string; description: string } | { title: string; description: string }[] | null;
    };

    const job = Array.isArray(raw.jobs) ? (raw.jobs[0] ?? null) : raw.jobs;

    if (raw.candidate_id !== candidateId) {
      throw new ResumeAnalysisError("Application does not belong to this candidate.");
    }

    const title = job?.title?.trim();
    const description = job?.description?.trim();
    if (!title || !description) {
      throw new ResumeAnalysisError("Job details are missing for this application.");
    }

    return { jobTitle: title, jobDescription: description, jobId: raw.job_id };
  }

  const { data: profileDetails } = await supabase
    .from("candidate_profile_details")
    .select("current_job_title")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  const currentTitle = (profileDetails as { current_job_title: string | null } | null)
    ?.current_job_title?.trim();

  return {
    jobTitle: currentTitle ?? "General Candidate Evaluation",
    jobDescription:
      "Evaluate this candidate's résumé for general technical recruiting suitability. " +
      "No specific job posting was selected.",
    jobId: null,
  };
}

/**
 * Core résumé analysis pipeline shared by analyze and re-analyze actions.
 * Prefers the application evaluation pipeline when an applicationId is present.
 */
export async function runCandidateResumeAnalysis(input: {
  candidateId: string;
  applicationId: string | null;
  force: boolean;
}): Promise<{ analysis: ResumeAnalysis; cached: boolean; stored: StoredResumeAnalysis }> {
  const hr = await requireHRUser();

  const limit = checkRateLimit({
    key: rateLimitKey("hr-resume-analysis", hr.id),
    limit: 40,
    windowMs: 60 * 60 * 1000,
    message: "Resume analysis rate limit reached. Please try again later.",
  });
  if (!limit.ok) {
    throw new ResumeAnalysisError(limit.message);
  }

  if (input.applicationId) {
    const result = await evaluateApplicationResume({
      applicationId: input.applicationId,
      force: input.force,
      useAdmin: true,
    });

    const stored = await getLatestResumeAnalysisForCandidate(
      input.candidateId,
      input.applicationId
    );
    if (!stored) {
      throw new ResumeAnalysisError("Evaluation completed but cache row was not found.");
    }

    return { analysis: result.analysis, cached: result.cached, stored };
  }

  const resume = await loadCandidateResume(input.candidateId);
  if (!resume) {
    throw new ResumeAnalysisError("This candidate has not uploaded a résumé yet.");
  }

  const { text: resumeText, hash: resumeHash } = await parseResumeFromStorage(
    resume.storage_path,
    resume.mime_type,
    resume.file_name
  );

  if (!input.force) {
    const cached = await getCachedResumeAnalysis(
      input.candidateId,
      resumeHash,
      input.applicationId
    );
    if (cached) {
      return { analysis: cached.analysis, cached: true, stored: cached };
    }
  }

  const jobContext = await resolveJobContext(input.candidateId, input.applicationId);

  const analysis = await analyzeResume({
    resumeText,
    jobTitle: jobContext.jobTitle,
    jobDescription: jobContext.jobDescription,
  });

  const stored = await saveResumeAnalysis({
    candidateId: input.candidateId,
    applicationId: input.applicationId,
    resumeHash,
    jobTitle: jobContext.jobTitle,
    jobDescription: jobContext.jobDescription,
    analysis,
  });

  if (jobContext.jobId) {
    await recalculateJobRanking(jobContext.jobId, createAdminClient() as never);
  }

  return { analysis, cached: false, stored };
}

function parseApplicationId(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  return value.length > 0 ? value : null;
}

function handleAnalysisError(error: unknown): ResumeAnalysisActionState {
  if (error instanceof ResumeAnalysisError || error instanceof ResumeParseError) {
    return { status: "error", message: error.message };
  }

  console.error("[hr/resume-analysis-actions] Unexpected error:", error);
  return { status: "error", message: "Résumé analysis failed. Please try again." };
}

/**
 * Server Action: first-time résumé analysis (uses cache when available).
 */
export async function analyzeCandidateResumeAction(
  _prevState: ResumeAnalysisActionState,
  formData: FormData
): Promise<ResumeAnalysisActionState> {
  try {
    const candidateId = String(formData.get("candidateId") ?? "").trim();
    if (!candidateId) {
      return { status: "error", message: "Missing candidate reference." };
    }

    const applicationId = parseApplicationId(formData.get("applicationId"));

    const result = await runCandidateResumeAnalysis({
      candidateId,
      applicationId,
      force: false,
    });

    revalidatePath(`/hr/candidates/${candidateId}`);
    if (applicationId) {
      revalidatePath(`/hr/applications/${applicationId}`);
    }

    return {
      status: "success",
      analysis: result.analysis,
      cached: result.cached,
      stored: result.stored,
    };
  } catch (error) {
    return handleAnalysisError(error);
  }
}

/**
 * Server Action: force a fresh Groq analysis and overwrite the cache row.
 */
export async function reanalyzeCandidateResumeAction(
  _prevState: ResumeAnalysisActionState,
  formData: FormData
): Promise<ResumeAnalysisActionState> {
  try {
    const candidateId = String(formData.get("candidateId") ?? "").trim();
    if (!candidateId) {
      return { status: "error", message: "Missing candidate reference." };
    }

    const applicationId = parseApplicationId(formData.get("applicationId"));

    const result = await runCandidateResumeAnalysis({
      candidateId,
      applicationId,
      force: true,
    });

    revalidatePath(`/hr/candidates/${candidateId}`);
    if (applicationId) {
      revalidatePath(`/hr/applications/${applicationId}`);
    }

    return {
      status: "success",
      analysis: result.analysis,
      cached: false,
      stored: result.stored,
    };
  } catch (error) {
    return handleAnalysisError(error);
  }
}
