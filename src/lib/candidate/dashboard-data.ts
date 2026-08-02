import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/hr/status";
import { isEmploymentType, type EmploymentType } from "@/lib/hr/jobs";
import type { CandidateProfile } from "@/lib/candidate-auth/dal";
export {
  getProfileCompletion,
  type ProfileCompletion,
  type ProfileCompletionField,
} from "@/lib/candidate/profile-completion";

type CandidateApplicationRow = {
  id: string;
  status: string;
  submitted_at: string;
  jobs: { title: string } | null;
};

type PublishedJobRow = {
  id: string;
  title: string;
  location: string | null;
  is_remote: boolean;
  employment_type: string;
  published_at: string | null;
};

export type CandidateApplicationSummary = {
  id: string;
  jobTitle: string;
  status: ApplicationStatus;
  submittedAt: string;
};

export type LatestJobSummary = {
  id: string;
  title: string;
  location: string | null;
  isRemote: boolean;
  employmentType: EmploymentType;
  postedAt: string | null;
};

export type CandidateStats = {
  total: number;
  pending: number;
  shortlisted: number;
  interview: number;
  rejected: number;
};

export type CandidateDashboardData = {
  applications: CandidateApplicationSummary[];
  stats: CandidateStats;
  latestJobs: LatestJobSummary[];
};

function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string
): T | null {
  if (result.error) {
    console.error(`[candidate-dashboard-data] Failed to load ${context}:`, result.error.message);
    return null;
  }
  return result.data;
}

const MAX_RECENT_APPLICATIONS = 5;
const MAX_LATEST_JOBS = 5;

/**
 * Loads candidate dashboard data with bounded recent-application reads
 * and head counts for stats (no full-history payload).
 */
export async function getCandidateDashboardData(
  profile: CandidateProfile
): Promise<CandidateDashboardData> {
  const supabase = await createClient();

  const [recentAppsResult, jobsResult, totalResult, pendingResult, shortlistedResult, interviewResult, rejectedResult] =
    await Promise.all([
      supabase
        .from("applications")
        .select("id, status, submitted_at, jobs ( title )")
        .eq("candidate_id", profile.id)
        .order("submitted_at", { ascending: false })
        .limit(MAX_RECENT_APPLICATIONS),
      supabase
        .from("jobs")
        .select("id, title, location, is_remote, employment_type, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(MAX_LATEST_JOBS),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", profile.id),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", profile.id)
        .eq("status", "new"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", profile.id)
        .eq("status", "ai_shortlisted"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", profile.id)
        .eq("status", "interview"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", profile.id)
        .eq("status", "rejected"),
    ]);

  const applicationRows = (unwrap(recentAppsResult, "candidate applications") ??
    []) as unknown as CandidateApplicationRow[];

  const applications: CandidateApplicationSummary[] = applicationRows.map((row) => ({
    id: row.id,
    jobTitle: row.jobs?.title ?? "Unknown role",
    status: isApplicationStatus(row.status) ? row.status : "new",
    submittedAt: row.submitted_at,
  }));

  const stats: CandidateStats = {
    total: totalResult.count ?? 0,
    pending: pendingResult.count ?? 0,
    shortlisted: shortlistedResult.count ?? 0,
    interview: interviewResult.count ?? 0,
    rejected: rejectedResult.count ?? 0,
  };

  const jobRows = (unwrap(jobsResult, "latest published jobs") ?? []) as PublishedJobRow[];
  const latestJobs: LatestJobSummary[] = jobRows.map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location,
    isRemote: row.is_remote,
    employmentType: isEmploymentType(row.employment_type) ? row.employment_type : "full_time",
    postedAt: row.published_at,
  }));

  return { applications, stats, latestJobs };
}

export const MIN_PROFILE_COMPLETION_TO_APPLY = 70;
