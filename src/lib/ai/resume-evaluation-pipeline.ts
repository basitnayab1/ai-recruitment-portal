import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { parseResumeFromStorage, ResumeParseError } from "@/lib/ai/resume-parser";
import {
  normalizeResumeAnalysis,
  ResumeAnalysisError,
  type ResumeAnalysis,
} from "@/lib/ai/types";
import { blendRankingScore, computeSkillMatch } from "@/lib/hr/skill-match";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EvaluateApplicationResult = {
  analysis: ResumeAnalysis;
  cached: boolean;
  applicationId: string;
  jobId: string;
  candidateId: string;
  rankingUpdated: boolean;
};

function normalizeJobText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function computeJobContentHash(
  jobTitle: string,
  jobDescription: string,
  requiredSkills: string[] = []
): string {
  const skillsKey = requiredSkills
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
  return createHash("sha256")
    .update(
      `${normalizeJobText(jobTitle)}\n${normalizeJobText(jobDescription)}\n${skillsKey}`
    )
    .digest("hex");
}

/** Overlay deterministic required-skill matching onto Groq analysis. */
export function applyStructuredSkillMatch(
  analysis: ResumeAnalysis,
  requiredSkills: string[],
  candidateSkills: string[]
): ResumeAnalysis {
  if (!requiredSkills.length) {
    return {
      ...analysis,
      matchedSkills: analysis.matchedSkills ?? [],
    };
  }

  const resumeSkills = [
    ...new Set([...(candidateSkills ?? []), ...(analysis.skills ?? [])]),
  ];
  const match = computeSkillMatch(requiredSkills, resumeSkills);
  const blended = blendRankingScore(
    analysis.overallScore ?? analysis.score,
    match.skillMatchPercentage,
    true
  );

  return {
    ...analysis,
    skillMatch: match.skillMatchPercentage,
    matchedSkills: match.matchedSkills,
    missingSkills: match.missingSkills.length
      ? match.missingSkills
      : analysis.missingSkills,
    // Keep model overallScore; ranking uses blend via skillMatch + overall.
    // Also nudge overall slightly toward skill reality for UI consistency.
    overallScore: blended,
    score: blended,
  };
}

type ApplicationContext = {
  applicationId: string;
  jobId: string;
  candidateId: string;
  fullName: string;
  currentPosition: string | null;
  yearsOfExperience: number | null;
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string;
  requiredSkills: string[];
  candidateSkills: string[];
  educationSummary: string;
  resumeStoragePath: string;
  resumeFileName: string;
  resumeMimeType: string;
};

async function getDataClient(preferAdmin: boolean): Promise<SupabaseClient> {
  if (preferAdmin) {
    return createAdminClient() as unknown as SupabaseClient;
  }
  return (await createClient()) as unknown as SupabaseClient;
}

async function loadApplicationContext(
  applicationId: string,
  client: SupabaseClient
): Promise<ApplicationContext> {
  const { data, error } = await client
    .from("applications")
    .select(
      `
      id,
      job_id,
      candidate_id,
      full_name,
      current_position,
      years_of_experience,
      cv_storage_path,
      jobs ( id, title, description, requirements, required_skills, preferred_skills ),
      skills ( skill_name ),
      education ( institution_name, degree, field_of_study )
    `
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data) {
    throw new ResumeAnalysisError(error?.message ?? "Application not found for evaluation.");
  }

  const row = data as unknown as {
    id: string;
    job_id: string;
    candidate_id: string | null;
    full_name: string;
    current_position: string | null;
    years_of_experience: number | null;
    cv_storage_path: string;
    jobs:
      | {
          id: string;
          title: string;
          description: string;
          requirements: string | null;
          required_skills: string[] | null;
          preferred_skills: string[] | null;
        }
      | {
          id: string;
          title: string;
          description: string;
          requirements: string | null;
          required_skills: string[] | null;
          preferred_skills: string[] | null;
        }[]
      | null;
    skills: { skill_name: string }[] | null;
    education:
      | { institution_name: string; degree: string; field_of_study: string | null }[]
      | null;
  };

  if (!row.candidate_id) {
    throw new ResumeAnalysisError("Application is not linked to a candidate profile.");
  }

  const job = Array.isArray(row.jobs) ? (row.jobs[0] ?? null) : row.jobs;
  if (!job?.title?.trim() || !job.description?.trim()) {
    throw new ResumeAnalysisError("Job details are missing for this application.");
  }

  const { data: criteriaRows } = await client
    .from("job_ai_criteria")
    .select("criteria_name")
    .eq("job_id", row.job_id);

  const { data: resumeRow, error: resumeError } = await client
    .from("candidate_resumes")
    .select("storage_path, file_name, mime_type")
    .eq("candidate_id", row.candidate_id)
    .maybeSingle();

  if (resumeError) {
    throw new ResumeAnalysisError(`Candidate resume lookup failed: ${resumeError.message}`);
  }

  const resume = resumeRow as {
    storage_path: string;
    file_name: string;
    mime_type: string;
  } | null;

  // Prefer profile résumé; fall back to the CV attached on the application.
  const resumeStoragePath = (resume?.storage_path || row.cv_storage_path || "").trim();
  if (!resumeStoragePath) {
    throw new ResumeAnalysisError("Candidate resume not found for evaluation.");
  }

  const fileNameFromPath = resumeStoragePath.split("/").pop() || "resume.pdf";
  const lowerName = fileNameFromPath.toLowerCase();
  const inferredMime = lowerName.endsWith(".docx")
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : lowerName.endsWith(".txt")
      ? "text/plain"
      : "application/pdf";

  const educationSummary = (row.education ?? [])
    .map((e) =>
      [e.degree, e.field_of_study, e.institution_name].filter(Boolean).join(" — ")
    )
    .filter(Boolean)
    .join("; ");

  const { data: profileDetails } = await client
    .from("candidate_profile_details")
    .select("current_job_title, years_of_experience, skills, current_company")
    .eq("candidate_id", row.candidate_id)
    .maybeSingle();

  const details = profileDetails as {
    current_job_title: string | null;
    years_of_experience: number | null;
    skills: string[] | null;
    current_company: string | null;
  } | null;

  const profileSkills = Array.isArray(details?.skills)
    ? details.skills.map((s) => s.trim()).filter(Boolean)
    : [];
  const applicationSkills = (row.skills ?? []).map((s) => s.skill_name.trim()).filter(Boolean);
  const candidateSkills = [...new Set([...profileSkills, ...applicationSkills])];

  const currentPosition =
    details?.current_job_title?.trim() ||
    row.current_position?.trim() ||
    null;
  const yearsOfExperience = details?.years_of_experience ?? row.years_of_experience;

  return {
    applicationId: row.id,
    jobId: row.job_id,
    candidateId: row.candidate_id,
    fullName: row.full_name,
    currentPosition,
    yearsOfExperience,
    jobTitle: job.title.trim(),
    jobDescription: job.description.trim(),
    jobRequirements: (job.requirements ?? "").trim(),
    requiredSkills: [
      ...new Set([
        ...(Array.isArray(job.required_skills) ? job.required_skills : []),
        ...(criteriaRows ?? []).map((c) => (c as { criteria_name: string }).criteria_name),
      ]),
    ].filter(Boolean),
    candidateSkills,
    educationSummary,
    resumeStoragePath,
    resumeFileName: resume?.file_name || fileNameFromPath,
    resumeMimeType: resume?.mime_type || inferredMime,
  };
}

type CachedRow = {
  id: string;
  resume_hash: string;
  job_title: string;
  job_description: string;
  analysis_json: unknown;
  score: number | string;
  recommendation: string;
};

async function getAnalysisForApplication(
  client: SupabaseClient,
  applicationId: string
): Promise<CachedRow | null> {
  const { data, error } = await client
    .from("ai_resume_analysis")
    .select("id, resume_hash, job_title, job_description, analysis_json, score, recommendation")
    .eq("application_id", applicationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[ai/resume-evaluation] cache lookup failed:", error.message);
    return null;
  }

  return (data as CachedRow | null) ?? null;
}

async function saveAnalysis(
  client: SupabaseClient,
  input: {
    candidateId: string;
    applicationId: string;
    resumeHash: string;
    jobTitle: string;
    jobDescription: string;
    analysis: ResumeAnalysis;
  }
): Promise<void> {
  const payload = {
    candidate_id: input.candidateId,
    application_id: input.applicationId,
    resume_hash: input.resumeHash,
    job_title: input.jobTitle,
    job_description: input.jobDescription,
    analysis_json: input.analysis,
    score: input.analysis.overallScore,
    recommendation: input.analysis.recommendation,
    updated_at: new Date().toISOString(),
  };

  const existing = await getAnalysisForApplication(client, input.applicationId);

  if (existing) {
    const { error } = await client.from("ai_resume_analysis").update(payload).eq("id", existing.id);
    if (error) throw new ResumeAnalysisError(error.message);
    return;
  }

  const { error } = await client.from("ai_resume_analysis").insert(payload);
  if (error) throw new ResumeAnalysisError(error.message);
}

/**
 * Recalculates rankings for every evaluated candidate on a job.
 * Highest overallScore = Rank 1.
 */
export async function recalculateJobRanking(
  jobId: string,
  client: SupabaseClient
): Promise<number> {
  const { data: applications, error } = await client
    .from("applications")
    .select(
      `
      id,
      candidate_id,
      full_name,
      ai_resume_analysis ( score, recommendation, analysis_json )
    `
    )
    .eq("job_id", jobId)
    .not("candidate_id", "is", null);

  if (error) {
    throw new ResumeAnalysisError(`Ranking load failed: ${error.message}`);
  }

  type AppRow = {
    id: string;
    candidate_id: string;
    full_name: string;
    ai_resume_analysis:
      | { score: number | string; recommendation: string; analysis_json: unknown }
      | { score: number | string; recommendation: string; analysis_json: unknown }[]
      | null;
  };

  const scored = ((applications ?? []) as AppRow[])
    .map((row) => {
      const analysisRow = Array.isArray(row.ai_resume_analysis)
        ? (row.ai_resume_analysis[0] ?? null)
        : row.ai_resume_analysis;
      if (!analysisRow) return null;

      const analysis = normalizeResumeAnalysis(analysisRow.analysis_json);
      const score = blendRankingScore(
        analysis.overallScore ?? analysis.score,
        analysis.skillMatch ?? 0,
        (analysis.matchedSkills?.length ?? 0) + (analysis.missingSkills?.length ?? 0) > 0 ||
          analysis.skillMatch > 0
      );
      const reasonParts = [
        `Overall ${score}/100`,
        analysis.skillMatch != null ? `Skill match ${analysis.skillMatch}%` : null,
        analysis.recommendationLabel || analysis.recommendation,
        ...(analysis.matchedSkills?.slice(0, 2) ?? analysis.strengths.slice(0, 2)),
      ].filter(Boolean);

      return {
        candidateId: row.candidate_id,
        score,
        reason: reasonParts.join("; "),
      };
    })
    .filter((row): row is { candidateId: string; score: number; reason: string } => row != null)
    .sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId));

  await client.from("ai_candidate_ranking").delete().eq("job_id", jobId);

  if (scored.length === 0) {
    console.log("Ranking updated: 0");
    return 0;
  }

  const insertPayload = scored.map((entry, index) => ({
    job_id: jobId,
    candidate_id: entry.candidateId,
    rank: index + 1,
    score: entry.score,
    reason: entry.reason,
  }));

  const { error: insertError } = await client.from("ai_candidate_ranking").insert(insertPayload);
  if (insertError) {
    throw new ResumeAnalysisError(`Ranking save failed: ${insertError.message}`);
  }

  console.log("Ranking updated:", insertPayload.length);
  return insertPayload.length;
}

/**
 * Full AI resume evaluation for one application.
 * - Reads resume + job context
 * - Calls Groq only when cache miss / force / resume or JD changed
 * - Saves ai_resume_analysis
 * - Recalculates ai_candidate_ranking for the job
 */
export async function evaluateApplicationResume(input: {
  applicationId: string;
  force?: boolean;
  /** Use service-role client (required for candidate apply path). */
  useAdmin?: boolean;
}): Promise<EvaluateApplicationResult> {
  const force = Boolean(input.force);
  const useAdmin = input.useAdmin !== false; // default admin for reliable writes
  const client = await getDataClient(useAdmin);

  const context = await loadApplicationContext(input.applicationId, client);
  console.log("Job loaded:", {
    jobId: context.jobId,
    jobTitle: context.jobTitle,
    applicationId: context.applicationId,
  });

  const { text: resumeText, hash: resumeHash } = await parseResumeFromStorage(
    context.resumeStoragePath,
    context.resumeMimeType,
    context.resumeFileName
  );
  console.log("Resume parsed:", {
    chars: resumeText.length,
    hash: resumeHash.slice(0, 12),
  });

  const jobHash = computeJobContentHash(
    context.jobTitle,
    context.jobDescription,
    context.requiredSkills
  );
  const existing = await getAnalysisForApplication(client, context.applicationId);

  if (!force && existing) {
    const sameResume = existing.resume_hash === resumeHash;
    const sameJob =
      normalizeJobText(existing.job_description) === normalizeJobText(context.jobDescription) &&
      normalizeJobText(existing.job_title) === normalizeJobText(context.jobTitle);

    if (sameResume && sameJob) {
      const cachedAnalysis = applyStructuredSkillMatch(
        normalizeResumeAnalysis(existing.analysis_json),
        context.requiredSkills,
        context.candidateSkills
      );
      console.log("Score saved: cache hit (skip Groq)", {
        applicationId: context.applicationId,
        overallScore: cachedAnalysis.overallScore,
        skillMatch: cachedAnalysis.skillMatch,
        jobHash: jobHash.slice(0, 12),
      });

      // Ensure ranking stays in sync even on cache hits
      const ranked = await recalculateJobRanking(context.jobId, client);

      return {
        analysis: cachedAnalysis,
        cached: true,
        applicationId: context.applicationId,
        jobId: context.jobId,
        candidateId: context.candidateId,
        rankingUpdated: ranked > 0,
      };
    }
  }

  const rawAnalysis = await analyzeResume({
    resumeText,
    jobTitle: context.jobTitle,
    jobDescription: context.jobDescription,
    jobRequirements: context.jobRequirements,
    requiredSkills: context.requiredSkills,
    candidateSkills: context.candidateSkills,
    yearsOfExperience: context.yearsOfExperience,
    educationSummary: context.educationSummary,
    currentPosition: context.currentPosition,
  });

  const analysis = applyStructuredSkillMatch(
    rawAnalysis,
    context.requiredSkills,
    context.candidateSkills
  );

  await saveAnalysis(client, {
    candidateId: context.candidateId,
    applicationId: context.applicationId,
    resumeHash,
    jobTitle: context.jobTitle,
    jobDescription: context.jobDescription,
    analysis,
  });

  console.log("Score saved:", {
    applicationId: context.applicationId,
    overallScore: analysis.overallScore,
    recommendation: analysis.recommendationLabel,
    force,
  });

  const rankedCount = await recalculateJobRanking(context.jobId, client);

  return {
    analysis,
    cached: false,
    applicationId: context.applicationId,
    jobId: context.jobId,
    candidateId: context.candidateId,
    rankingUpdated: rankedCount > 0,
  };
}

/**
 * Safe wrapper for apply-time evaluation — never throws to the caller.
 */
export async function evaluateApplicationResumeSafe(
  applicationId: string
): Promise<EvaluateApplicationResult | null> {
  try {
    return await evaluateApplicationResume({
      applicationId,
      force: false,
      useAdmin: true,
    });
  } catch (error) {
    if (error instanceof ResumeAnalysisError || error instanceof ResumeParseError) {
      console.error("[ai/resume-evaluation] apply-time evaluation failed:", error.message);
    } else {
      console.error("[ai/resume-evaluation] apply-time evaluation failed:", error);
    }
    return null;
  }
}
