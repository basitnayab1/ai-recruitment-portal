import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/hr/status";
import { isEmploymentType, type EmploymentType } from "@/lib/hr/jobs";
import type { CandidateProfile } from "@/lib/candidate-auth/dal";
import type { CandidateProfileDetails } from "@/lib/candidate/profile-details";

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

export type ProfileCompletionField = {
  label: string;
  completed: boolean;
};

export type ProfileCompletion = {
  percentage: number;
  completedFields: number;
  totalFields: number;
  fields: ProfileCompletionField[];
};

function hasValue(value: string | number | null | undefined): boolean {
  if (typeof value === "number") return true;
  return Boolean(value && value.trim().length > 0);
}

/**
 * Calculates profile completion across both `candidate_profiles` (core
 * identity: name/email, plus phone as a fallback — see below) and
 * `candidate_profile_details` (the extended "complete your profile" fields
 * from supabase/migrations/003_candidate_profile_details.sql).
 *
 * `details` may be `null` (candidate hasn't saved their details yet) or a
 * partial object of *pending* values not yet persisted — this same
 * function is used both to display live completion and, in
 * `src/lib/candidate/profile-actions.ts`, to compute the
 * `profile_completion` value to persist on save.
 *
 * Phone exists on both tables (see profile-actions.ts / the profile page
 * for why); it is only counted once here, preferring the newer
 * `candidate_profile_details.phone` and falling back to the core profile's.
 */
export function getProfileCompletion(
  profile: CandidateProfile,
  details: Partial<CandidateProfileDetails> | null
): ProfileCompletion {
  const fields: ProfileCompletionField[] = [
    { label: "Full Name", completed: hasValue(profile.fullName) },
    { label: "Email", completed: hasValue(profile.email) },
    { label: "Phone", completed: hasValue(details?.phone ?? profile.phone) },
    { label: "CNIC", completed: hasValue(details?.cnic) },
    { label: "Date of Birth", completed: hasValue(details?.dateOfBirth) },
    { label: "Gender", completed: hasValue(details?.gender) },
    { label: "Country", completed: hasValue(details?.country) },
    { label: "Province", completed: hasValue(details?.province) },
    { label: "City", completed: hasValue(details?.city) },
    { label: "Address", completed: hasValue(details?.address) },
    { label: "Current Job Title", completed: hasValue(details?.currentJobTitle) },
    { label: "Years of Experience", completed: hasValue(details?.yearsOfExperience) },
    { label: "Highest Qualification", completed: hasValue(details?.highestQualification) },
    { label: "Current Company", completed: hasValue(details?.currentCompany) },
    { label: "Expected Salary", completed: hasValue(details?.expectedSalary) },
    { label: "Notice Period", completed: hasValue(details?.noticePeriod) },
    { label: "LinkedIn URL", completed: hasValue(details?.linkedinUrl) },
    { label: "Portfolio URL", completed: hasValue(details?.portfolioUrl) },
    { label: "GitHub URL", completed: hasValue(details?.githubUrl) },
  ];
  const completedFields = fields.filter((field) => field.completed).length;
  const totalFields = fields.length;

  return {
    percentage: Math.round((completedFields / totalFields) * 100),
    completedFields,
    totalFields,
    fields,
  };
}
