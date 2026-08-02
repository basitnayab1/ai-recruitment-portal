import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateJobRanking } from "@/lib/ai/resume-evaluation-pipeline";
import type { ResumeRecommendation } from "@/lib/ai/types";
import type {
  RefreshRankingResult,
  StoredCandidateRanking,
} from "@/lib/hr/candidate-ranking-types";

export type { RefreshRankingResult, StoredCandidateRanking } from "@/lib/hr/candidate-ranking-types";

type RankingRow = {
  id: string;
  job_id: string;
  candidate_id: string;
  rank: number;
  score: number | string;
  reason: string;
  created_at: string;
};

function mapStoredRow(
  row: RankingRow,
  meta: {
    fullName: string;
    applicationId: string | null;
    recommendation: ResumeRecommendation | null;
  }
): StoredCandidateRanking {
  return {
    id: row.id,
    jobId: row.job_id,
    candidateId: row.candidate_id,
    applicationId: meta.applicationId,
    fullName: meta.fullName,
    rank: row.rank,
    score: typeof row.score === "number" ? row.score : Number(row.score),
    reason: row.reason,
    recommendation: meta.recommendation,
    createdAt: row.created_at,
  };
}

async function loadApplicationMetaByJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string
): Promise<Map<string, { fullName: string; applicationId: string; recommendation: ResumeRecommendation | null }>> {
  const { data } = await supabase
    .from("applications")
    .select("id, candidate_id, full_name, ai_resume_analysis ( recommendation )")
    .eq("job_id", jobId)
    .not("candidate_id", "is", null);

  const map = new Map<
    string,
    { fullName: string; applicationId: string; recommendation: ResumeRecommendation | null }
  >();

  for (const row of (data ?? []) as Array<{
    id: string;
    candidate_id: string;
    full_name: string;
    ai_resume_analysis: { recommendation: string } | { recommendation: string }[] | null;
  }>) {
    const analysis = Array.isArray(row.ai_resume_analysis)
      ? row.ai_resume_analysis[0]
      : row.ai_resume_analysis;

    map.set(row.candidate_id, {
      fullName: row.full_name,
      applicationId: row.id,
      recommendation: (analysis?.recommendation as ResumeRecommendation | undefined) ?? null,
    });
  }

  return map;
}

/**
 * Loads persisted rankings for a job, ordered by rank ascending.
 */
export async function getCandidateRankingsForJob(jobId: string): Promise<StoredCandidateRanking[]> {
  const supabase = await createClient();

  const [rankingsResult, metaMap] = await Promise.all([
    supabase
      .from("ai_candidate_ranking")
      .select("id, job_id, candidate_id, rank, score, reason, created_at")
      .eq("job_id", jobId)
      .order("rank", { ascending: true }),
    loadApplicationMetaByJob(supabase, jobId),
  ]);

  if (rankingsResult.error) {
    console.error("[hr/candidate-ranking-data] Load failed:", rankingsResult.error.message);
    return [];
  }

  return ((rankingsResult.data ?? []) as RankingRow[]).map((row) => {
    const meta = metaMap.get(row.candidate_id);
    return mapStoredRow(row, {
      fullName: meta?.fullName ?? "Unknown candidate",
      applicationId: meta?.applicationId ?? null,
      recommendation: meta?.recommendation ?? null,
    });
  });
}

/**
 * Recomputes rankings from cached AI data and persists to `ai_candidate_ranking`.
 * Highest overallScore = Rank 1. Does not call Groq or re-analyze résumés.
 */
export async function refreshCandidateRankingsForJob(
  jobId: string,
  _jobTitle: string,
  _jobDescription: string
): Promise<RefreshRankingResult> {
  const rankedCount = await recalculateJobRanking(jobId, createAdminClient() as never);
  const stored = await getCandidateRankingsForJob(jobId);
  return { rankings: stored, rankedCount };
}
