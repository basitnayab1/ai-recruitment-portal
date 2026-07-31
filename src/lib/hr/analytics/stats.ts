import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isApplicationStatus } from "@/lib/hr/status";
import { emptyDistribution, unwrap } from "@/lib/hr/analytics/helpers";
import type { AnalyticsStats, StatusDistribution } from "@/lib/hr/analytics/types";

type JobRow = { status: string };
type ApplicationRow = { status: string; submitted_at: string; job_id: string };

export async function fetchAnalyticsCounts(): Promise<{
  stats: AnalyticsStats;
  statusDistribution: StatusDistribution;
  submittedAts: string[];
  jobApplicationCounts: Map<string, number>;
}> {
  const supabase = await createClient();

  const [jobsResult, applicationsResult, candidatesResult, interviewsResult] = await Promise.all([
    supabase.from("jobs").select("id, title, status"),
    supabase.from("applications").select("id, status, submitted_at, job_id"),
    supabase.from("candidate_profiles").select("id", { count: "exact", head: true }),
    supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
  ]);

  const jobRows = (unwrap(jobsResult, "jobs") ?? []) as JobRow[];
  const applicationRows = (unwrap(applicationsResult, "applications") ?? []) as ApplicationRow[];

  const statusDistribution = emptyDistribution();
  const jobApplicationCounts = new Map<string, number>();

  for (const row of applicationRows) {
    if (isApplicationStatus(row.status)) {
      statusDistribution[row.status] += 1;
    }
    jobApplicationCounts.set(row.job_id, (jobApplicationCounts.get(row.job_id) ?? 0) + 1);
  }

  const stats: AnalyticsStats = {
    totalJobs: jobRows.length,
    activeJobs: jobRows.filter((job) => job.status === "published").length,
    closedJobs: jobRows.filter((job) => job.status === "closed").length,
    totalCandidates: candidatesResult.count ?? 0,
    totalApplications: applicationRows.length,
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
    submittedAts: applicationRows.map((row) => row.submitted_at),
    jobApplicationCounts,
  };
}

export async function fetchJobTitlesById(): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("jobs").select("id, title");

  if (error) {
    console.error("[analytics] Failed to load job titles:", error.message);
    return new Map();
  }

  return new Map((data ?? []).map((row) => [(row as { id: string; title: string }).id, (row as { id: string; title: string }).title]));
}
