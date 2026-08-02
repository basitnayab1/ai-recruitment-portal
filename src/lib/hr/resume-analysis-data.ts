import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isResumeRecommendation,
  normalizeResumeAnalysis,
  type ResumeAnalysis,
  type ResumeRecommendation,
} from "@/lib/ai/types";

export type StoredResumeAnalysis = {
  id: string;
  candidateId: string;
  applicationId: string | null;
  resumeHash: string;
  jobTitle: string;
  jobDescription: string;
  analysis: ResumeAnalysis;
  score: number;
  recommendation: ResumeRecommendation;
  createdAt: string;
  updatedAt: string;
};

type AiResumeAnalysisRow = {
  id: string;
  candidate_id: string;
  application_id: string | null;
  resume_hash: string;
  job_title: string;
  job_description: string;
  analysis_json: unknown;
  score: number | string;
  recommendation: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: AiResumeAnalysisRow): StoredResumeAnalysis {
  const recommendation = isResumeRecommendation(row.recommendation)
    ? row.recommendation
    : "Average";

  return {
    id: row.id,
    candidateId: row.candidate_id,
    applicationId: row.application_id,
    resumeHash: row.resume_hash,
    jobTitle: row.job_title,
    jobDescription: row.job_description,
    analysis: normalizeResumeAnalysis(row.analysis_json),
    score: typeof row.score === "number" ? row.score : Number(row.score),
    recommendation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Loads a cached analysis row for the exact candidate + résumé hash + job context.
 * Returns null when no matching cache entry exists.
 */
export async function getCachedResumeAnalysis(
  candidateId: string,
  resumeHash: string,
  applicationId: string | null
): Promise<StoredResumeAnalysis | null> {
  const supabase = await createClient();

  let query = supabase
    .from("ai_resume_analysis")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("resume_hash", resumeHash);

  if (applicationId) {
    query = query.eq("application_id", applicationId);
  } else {
    query = query.is("application_id", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[hr/resume-analysis-data] Cache lookup failed:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapRow(data as AiResumeAnalysisRow);
}

/**
 * Returns the most recent cached analysis for a candidate + optional application.
 * Used on the HR candidate profile page (before résumé hash is known).
 */
export async function getLatestResumeAnalysisForCandidate(
  candidateId: string,
  applicationId: string | null
): Promise<StoredResumeAnalysis | null> {
  const supabase = await createClient();

  let query = supabase
    .from("ai_resume_analysis")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (applicationId) {
    query = query.eq("application_id", applicationId);
  } else {
    query = query.is("application_id", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[hr/resume-analysis-data] Latest analysis lookup failed:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapRow(data as AiResumeAnalysisRow);
}

export type SaveResumeAnalysisInput = {
  candidateId: string;
  applicationId: string | null;
  resumeHash: string;
  jobTitle: string;
  jobDescription: string;
  analysis: ResumeAnalysis;
};

/**
 * Inserts or updates a cached analysis row (unique on candidate + hash + application).
 */
export async function saveResumeAnalysis(
  input: SaveResumeAnalysisInput
): Promise<StoredResumeAnalysis> {
  const supabase = await createClient();

  const payload = {
    candidate_id: input.candidateId,
    application_id: input.applicationId,
    resume_hash: input.resumeHash,
    job_title: input.jobTitle,
    job_description: input.jobDescription,
    analysis_json: input.analysis,
    score: input.analysis.overallScore ?? input.analysis.score,
    recommendation: input.analysis.recommendation,
    updated_at: new Date().toISOString(),
  };

  const existing = await getCachedResumeAnalysis(
    input.candidateId,
    input.resumeHash,
    input.applicationId
  );

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("ai_resume_analysis")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Failed to update résumé analysis.");
    }

    return mapRow(updated as AiResumeAnalysisRow);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("ai_resume_analysis")
    .insert(payload)
    .select("*")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to save résumé analysis.");
  }

  return mapRow(inserted as AiResumeAnalysisRow);
}
