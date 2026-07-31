import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isEmploymentType,
  isJobStatus,
  type EmploymentType,
  type JobStatus,
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
  requirements: string | null;
  responsibilities: string | null;
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
  requirements: string | null;
  responsibilities: string | null;
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

  const [jobsResult, applicationsResult] = await Promise.all([
    jobsQuery.range(from, to),
    supabase.from("applications").select("job_id"),
  ]);

  if (jobsResult.error) {
    console.error("[jobs-data] Failed to load jobs:", jobsResult.error.message);
    return { jobs: [], total: 0, page, pageSize };
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

  const jobs = ((jobsResult.data ?? []) as JobListRow[]).map((row) => ({
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

  return {
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    isRemote: row.is_remote,
    employmentType: toEmploymentType(row.employment_type),
    status: toJobStatus(row.status),
    applicationCount: applicationsResult.count ?? 0,
    createdAt: row.created_at,
    description: row.description,
    requirements: row.requirements,
    responsibilities: row.responsibilities,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    publishedAt: row.published_at,
    closesAt: row.closes_at,
    updatedAt: row.updated_at,
  };
}
