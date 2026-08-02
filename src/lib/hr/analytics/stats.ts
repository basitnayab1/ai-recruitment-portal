import "server-only";

import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES } from "@/lib/hr/status";
import { emptyDistribution, unwrap } from "@/lib/hr/analytics/helpers";
import type { AnalyticsStats, StatusDistribution } from "@/lib/hr/analytics/types";

/**
 * Aggregates analytics with head counts + narrow column selects.
 * Avoids loading full application/job row payloads into memory.
 */
export async function fetchAnalyticsCounts(): Promise<{
  stats: AnalyticsStats;
  statusDistribution: StatusDistribution;
  submittedAts: string[];
  jobApplicationCounts: Map<string, number>;
}> {
  const supabase = await createClient();

  const [
    totalJobsResult,
    activeJobsResult,
    closedJobsResult,
    candidatesResult,
    interviewsResult,
    totalAppsResult,
    statusCountResults,
    submittedAtResult,
    jobIdResult,
  ] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "closed"),
    supabase.from("candidate_profiles").select("id", { count: "exact", head: true }),
    supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    Promise.all(
      APPLICATION_STATUSES.map((status) =>
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("status", status)
          .then((result) => ({ status, count: result.count ?? 0, error: result.error }))
      )
    ),
    supabase.from("applications").select("submitted_at"),
    supabase.from("applications").select("job_id"),
  ]);

  const statusDistribution = emptyDistribution();
  for (const entry of statusCountResults) {
    if (entry.error) {
      console.error(`[analytics] Failed to count status ${entry.status}:`, entry.error.message);
      continue;
    }
    statusDistribution[entry.status] = entry.count;
  }

  const submittedAts = (
    (unwrap(submittedAtResult, "application submitted_at") ?? []) as { submitted_at: string }[]
  ).map((row) => row.submitted_at);

  const jobApplicationCounts = new Map<string, number>();
  for (const row of (unwrap(jobIdResult, "application job_ids") ?? []) as { job_id: string }[]) {
    jobApplicationCounts.set(row.job_id, (jobApplicationCounts.get(row.job_id) ?? 0) + 1);
  }

  const stats: AnalyticsStats = {
    totalJobs: totalJobsResult.count ?? 0,
    activeJobs: activeJobsResult.count ?? 0,
    closedJobs: closedJobsResult.count ?? 0,
    totalCandidates: candidatesResult.count ?? 0,
    totalApplications: totalAppsResult.count ?? 0,
    pendingApplications: statusDistribution.new,
    underReview: statusDistribution.hr_review,
    shortlisted: statusDistribution.ai_shortlisted,
    interviewsScheduled: interviewsResult.count ?? 0,
    hiredCandidates: statusDistribution.hired,
    rejectedCandidates: statusDistribution.rejected,
  };

  return {
    stats,
    statusDistribution,
    submittedAts,
    jobApplicationCounts,
  };
}

/** Load titles only for the job IDs that appear in charts/insights. */
export async function fetchJobTitlesById(jobIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(jobIds.filter(Boolean))];
  if (unique.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("jobs").select("id, title").in("id", unique);

  if (error) {
    console.error("[analytics] Failed to load job titles:", error.message);
    return new Map();
  }

  return new Map(
    (data ?? []).map((row) => {
      const typed = row as { id: string; title: string };
      return [typed.id, typed.title];
    })
  );
}
