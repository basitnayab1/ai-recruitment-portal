"use server";

import { revalidatePath } from "next/cache";
import { requireHRUser } from "@/lib/auth/dal";
import { refreshCandidateRankingsForJob } from "@/lib/hr/candidate-ranking-data";
import type { StoredCandidateRanking } from "@/lib/hr/candidate-ranking-types";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type RefreshCandidateRankingState =
  | { status: "success"; rankedCount: number; rankings: StoredCandidateRanking[] }
  | { status: "error"; message: string }
  | undefined;

async function loadJobContext(jobId: string): Promise<{ title: string; description: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("title, description")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Job not found.");
  }

  const title = (data as { title: string }).title?.trim();
  const description = (data as { description: string }).description?.trim();

  if (!title || !description) {
    throw new Error("Job title and description are required to refresh rankings.");
  }

  return { title, description };
}

/**
 * Server Action: recompute and persist candidate rankings from cached AI data.
 */
export async function refreshCandidateRankingAction(
  _prevState: RefreshCandidateRankingState,
  formData: FormData
): Promise<RefreshCandidateRankingState> {
  try {
    const hr = await requireHRUser();

    const limit = checkRateLimit({
      key: rateLimitKey("hr-candidate-ranking", hr.id),
      limit: 40,
      windowMs: 60 * 60 * 1000,
      message: "Ranking refresh rate limit reached. Please try again later.",
    });
    if (!limit.ok) {
      return { status: "error", message: limit.message };
    }

    const jobId = String(formData.get("jobId") ?? "").trim();
    if (!jobId) {
      return { status: "error", message: "Missing job reference." };
    }

    const job = await loadJobContext(jobId);
    const result = await refreshCandidateRankingsForJob(jobId, job.title, job.description);

    revalidatePath(`/hr/jobs/${jobId}`);

    return {
      status: "success",
      rankedCount: result.rankedCount,
      rankings: result.rankings,
    };
  } catch (error) {
    console.error("[hr/candidate-ranking-actions] Refresh failed:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to refresh rankings.",
    };
  }
}
