import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isEmploymentType,
  isJobStatus,
  isSeniorityLevel,
  isWorkMode,
  type EmploymentType,
  type JobStatus,
  type SeniorityLevel,
  type WorkMode,
} from "@/lib/hr/jobs";
import { HR_LIST_PAGE_SIZE, sanitizeSearchTerm } from "@/lib/hr/search/constants";

export const HR_JOBS_PAGE_SIZE = HR_LIST_PAGE_SIZE;

export type HRJobsFilters = {
  q?: string;
  status?: JobStatus;
  page: number;
};

export type HRJobsPage = {
  jobs: JobListItem[];
  total: number;
  page: number;
  pageSize: number;
};

// Row shapes returned by Supabase. Manually typed since DB types have not
// been generated yet (`supabase gen types typescript`); replace with the
// generated `Database` type when available. See the same note in
// `src/lib/auth/dal.ts`.
type JobListRow = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  is_remote: boolean;
  employment_type: string;
  status: string;
  created_at: string;
};

type JobDetailRow = JobListRow & {
  description: string;
  summary: string | null;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  matching_keywords: string[] | null;
  experience_required: string | null;
  education_required: string | null;
  seniority_level: string | null;
  work_mode: string | null;
  open_positions: number | null;
  hiring_manager: string | null;
  internal_notes: string | null;
  salary_min: number | null;
  salary_max: number | null;
  published_at: string | null;
  closes_at: string | null;
  updated_at: string;
};

export type JobListItem = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  isRemote: boolean;
  employmentType: EmploymentType;
  status: JobStatus;
  applicationCount: number;
  createdAt: string;
};

export type JobDetail = JobListItem & {
  description: string;
  summary: string | null;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  matchingKeywords: string[];
  experienceRequired: string | null;
  educationRequired: string | null;
  seniorityLevel: SeniorityLevel | null;
  workMode: WorkMode | null;
  openPositions: number;
  hiringManager: string | null;
  internalNotes: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  publishedAt: string | null;
  closesAt: string | null;
  updatedAt: string;
};

function toEmploymentType(value: string): EmploymentType {
  return isEmploymentType(value) ? value : "full_time";
}

function toJobStatus(value: string): JobStatus {
  return isJobStatus(value) ? value : "draft";
}

/**
 * All jobs, newest first, for the HR jobs list. HR/admin can see every
 * status (RLS: "HR and admin can manage jobs"); this uses the caller's own
 * authenticated session, never a service-role key.
 *
 * Application counts are derived from a single `job_id`-only query rather
 * than one count query per job, to avoid N+1 round trips.
 */
export async function getJobs(): Promise<JobListItem[]> {
  const supabase = await createClient();

  const [jobsResult, applicationsResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, department, location, is_remote, employment_type, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("applications").select("job_id"),
  ]);

  if (jobsResult.error) {
    console.error("[jobs-data] Failed to load jobs:", jobsResult.error.message);
    return [];
  }

  const countsByJob = new Map<string, number>();
  if (applicationsResult.error) {
    console.error(
      "[jobs-data] Failed to load application counts:",
      applicationsResult.error.message
    );
  } else {
    for (const row of (applicationsResult.data ?? []) as { job_id: string }[]) {
      countsByJob.set(row.job_id, (countsByJob.get(row.job_id) ?? 0) + 1);
    }
  }

  return ((jobsResult.data ?? []) as JobListRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    isRemote: row.is_remote,
    employmentType: toEmploymentType(row.employment_type),
    status: toJobStatus(row.status),
    applicationCount: countsByJob.get(row.id) ?? 0,
    createdAt: row.created_at,
  }));
}

/**
 * Paginated, searchable jobs list for `/hr/jobs`.
 */
export async function getJobsPage(filters: HRJobsFilters): Promise<HRJobsPage> {
  const supabase = await createClient();
  const pageSize = HR_JOBS_PAGE_SIZE;
  const page = Math.max(1, filters.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, department, location, is_remote, employment_type, status, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  const q = filters.q ? sanitizeSearchTerm(filters.q) : "";
  if (q) {
    jobsQuery = jobsQuery.ilike("title", `%${q}%`);
  }
  if (filters.status) {
    jobsQuery = jobsQuery.eq("status", filters.status);
  }

  const jobsResult = await jobsQuery.range(from, to);

  if (jobsResult.error) {
    console.error("[jobs-data] Failed to load jobs:", jobsResult.error.message);
    return { jobs: [], total: 0, page, pageSize };
  }

  const jobRows = (jobsResult.data ?? []) as JobListRow[];
  const pageJobIds = jobRows.map((row) => row.id);
  const countsByJob = new Map<string, number>();

  if (pageJobIds.length > 0) {
    const applicationsResult = await supabase
      .from("applications")
      .select("job_id")
      .in("job_id", pageJobIds);

    if (applicationsResult.error) {
      console.error(
        "[jobs-data] Failed to load application counts:",
        applicationsResult.error.message
      );
    } else {
      for (const row of (applicationsResult.data ?? []) as { job_id: string }[]) {
        countsByJob.set(row.job_id, (countsByJob.get(row.job_id) ?? 0) + 1);
      }
    }
  }

  const jobs = jobRows.map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    isRemote: row.is_remote,
    employmentType: toEmploymentType(row.employment_type),
    status: toJobStatus(row.status),
    applicationCount: countsByJob.get(row.id) ?? 0,
    createdAt: row.created_at,
  }));

  return { jobs, total: jobsResult.count ?? jobs.length, page, pageSize };
}

/**
 * Full detail for a single job, for the detail/edit pages. Returns `null`
 * if the job doesn't exist (RLS also means a non-HR caller would never see
 * a non-published job here, but every caller of this function is already
 * behind `requireHRUser()`).
 */
export async function getJobById(id: string): Promise<JobDetail | null> {
  const supabase = await createClient();

  const [jobResult, applicationsResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id),
  ]);

  if (jobResult.error || !jobResult.data) {
    return null;
  }

  const row = jobResult.data as JobDetailRow;

  const workMode =
    row.work_mode && isWorkMode(row.work_mode)
      ? row.work_mode
      : row.is_remote
        ? ("remote" as const)
        : null;

  return {
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    isRemote: row.is_remote || workMode === "remote",
    employmentType: toEmploymentType(row.employment_type),
    status: toJobStatus(row.status),
    applicationCount: applicationsResult.count ?? 0,
    createdAt: row.created_at,
    description: row.description,
    summary: row.summary ?? null,
    requirements: row.requirements,
    responsibilities: row.responsibilities,
    benefits: row.benefits ?? null,
    requiredSkills: Array.isArray(row.required_skills) ? row.required_skills : [],
    preferredSkills: Array.isArray(row.preferred_skills) ? row.preferred_skills : [],
    matchingKeywords: Array.isArray(row.matching_keywords) ? row.matching_keywords : [],
    experienceRequired: row.experience_required ?? null,
    educationRequired: row.education_required ?? null,
    seniorityLevel:
      row.seniority_level && isSeniorityLevel(row.seniority_level)
        ? row.seniority_level
        : null,
    workMode,
    openPositions:
      typeof row.open_positions === "number" && row.open_positions >= 1
        ? row.open_positions
        : 1,
    hiringManager: row.hiring_manager ?? null,
    internalNotes: row.internal_notes ?? null,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    publishedAt: row.published_at,
    closesAt: row.closes_at,
    updatedAt: row.updated_at,
  };
}
