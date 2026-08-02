import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isEmploymentType, type EmploymentType } from "@/lib/hr/jobs";

export const PUBLIC_JOB_SORTS = ["newest", "closing_soon"] as const;
export type PublicJobsSort = (typeof PUBLIC_JOB_SORTS)[number];

export const PUBLIC_JOBS_PAGE_SIZE = 24;

export function isPublicJobsSort(value: string): value is PublicJobsSort {
  return (PUBLIC_JOB_SORTS as readonly string[]).includes(value);
}

export type PublicJobsFilters = {
  q?: string;
  department?: string;
  location?: string;
  employmentType?: EmploymentType;
  sort: PublicJobsSort;
  page?: number;
};

export type PublicJobListItem = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  isRemote: boolean;
  employmentType: EmploymentType;
  shortDescription: string;
  publishedAt: string | null;
  closesAt: string | null;
};

export type PublicJobDetail = PublicJobListItem & {
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
};

export type PublicJobsFacets = {
  departments: string[];
  locations: string[];
};

export type PublicJobsResult = {
  jobs: PublicJobListItem[];
  facets: PublicJobsFacets;
  total: number;
  page: number;
  pageSize: number;
};

// Row shapes returned by Supabase. Manually typed since DB types have not
// been generated yet (`supabase gen types typescript`); see the same note
// in `src/lib/hr/jobs-data.ts`.
type PublicJobListRow = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  is_remote: boolean;
  employment_type: string;
  description: string;
  published_at: string | null;
  closes_at: string | null;
};

type PublicJobDetailRow = PublicJobListRow & {
  responsibilities: string | null;
  requirements: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
};

function toEmploymentType(value: string): EmploymentType {
  return isEmploymentType(value) ? value : "full_time";
}

function toShortDescription(description: string, maxLength = 180): string {
  const collapsed = description.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength).trimEnd()}…`;
}

// PostgREST's `.or()` filter string uses `,` and `()` as syntax — strip
// them from user-supplied search text so a search term can never corrupt
// the filter expression.
function sanitizeSearchTerm(value: string): string {
  return value
    .replace(/[,().*\\]/g, " ")
    .replace(/[%_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function toListItem(row: PublicJobListRow): PublicJobListItem {
  return {
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    isRemote: row.is_remote,
    employmentType: toEmploymentType(row.employment_type),
    shortDescription: toShortDescription(row.description),
    publishedAt: row.published_at,
    closesAt: row.closes_at,
  };
}

/**
 * Published, not-yet-closed jobs for the public `/jobs` board, with
 * search/filter/sort applied server-side. Uses the anonymous Supabase
 * client — every row returned is already allowed by the "Public can view
 * published jobs" RLS policy (001_initial_schema.sql); the `closes_at`
 * check here only narrows further (hides postings HR published but hasn't
 * gotten around to manually closing yet), it never widens access.
 *
 * `facets` (available departments/locations) are computed from the full
 * set of active jobs, independent of the current filters, so the filter
 * dropdowns don't shrink to only what the current search already matches.
 */
export async function getPublicJobs(filters: PublicJobsFilters): Promise<PublicJobsResult> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const activeFilter = `closes_at.is.null,closes_at.gte.${nowIso}`;
  const pageSize = PUBLIC_JOBS_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("jobs")
    .select(
      "id, title, department, location, is_remote, employment_type, description, published_at, closes_at",
      { count: "exact" }
    )
    .eq("status", "published")
    .or(activeFilter);

  const q = filters.q ? sanitizeSearchTerm(filters.q) : "";
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,department.ilike.%${q}%`);
  }
  if (filters.department) {
    query = query.eq("department", filters.department);
  }
  if (filters.location) {
    query = query.eq("location", filters.location);
  }
  if (filters.employmentType) {
    query = query.eq("employment_type", filters.employmentType);
  }

  query =
    filters.sort === "closing_soon"
      ? query.order("closes_at", { ascending: true, nullsFirst: false })
      : query.order("published_at", { ascending: false, nullsFirst: false });

  const [jobsResult, facetsResult] = await Promise.all([
    query.range(from, to),
    supabase.from("jobs").select("department, location").eq("status", "published").or(activeFilter),
  ]);

  if (jobsResult.error) {
    console.error("[public/jobs-data] Failed to load jobs:", jobsResult.error.message);
    return { jobs: [], facets: { departments: [], locations: [] }, total: 0, page, pageSize };
  }

  const facetRows = (facetsResult.data ?? []) as { department: string | null; location: string | null }[];
  const departments = Array.from(
    new Set(facetRows.map((row) => row.department?.trim()).filter((value): value is string => Boolean(value)))
  ).sort((a, b) => a.localeCompare(b));
  const locations = Array.from(
    new Set(facetRows.map((row) => row.location?.trim()).filter((value): value is string => Boolean(value)))
  ).sort((a, b) => a.localeCompare(b));

  return {
    jobs: (jobsResult.data as PublicJobListRow[]).map(toListItem),
    facets: { departments, locations },
    total: jobsResult.count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Full detail for a single public job. Returns `null` both when the job
 * doesn't exist / isn't published (RLS-enforced) and when it has already
 * passed its `closes_at` date — a closed-out posting is treated the same
 * as "not found" on the public site, consistent with `/jobs` only ever
 * listing active postings. Wrapped in React `cache()` so `generateMetadata`
 * and the page body share one query per request instead of two.
 */
export const getPublicJobById = cache(async (id: string): Promise<PublicJobDetail | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, title, department, location, is_remote, employment_type, description, responsibilities, requirements, required_skills, preferred_skills, salary_min, salary_max, published_at, closes_at, status"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as PublicJobDetailRow;

  if (row.closes_at && new Date(row.closes_at) < new Date()) {
    return null;
  }

  return {
    ...toListItem(row),
    description: row.description,
    responsibilities: row.responsibilities,
    requirements: row.requirements,
    requiredSkills: Array.isArray(row.required_skills) ? row.required_skills : [],
    preferredSkills: Array.isArray(row.preferred_skills) ? row.preferred_skills : [],
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
  };
});

export type JobApplicationEligibility = {
  id: string;
  title: string;
  department: string | null;
  employmentType: EmploymentType;
  isOpen: boolean;
};

type JobApplicationRow = {
  id: string;
  title: string;
  department: string | null;
  employment_type: string;
  closes_at: string | null;
};

/**
 * Minimal job lookup for the candidate apply flow (/candidate/apply/[jobId]).
 * Unlike `getPublicJobById`, this distinguishes a job that exists and is
 * published but has passed its `closes_at` deadline (`isOpen: false` — a
 * friendly "this job is closed" message) from one that doesn't exist or
 * isn't published at all (`null` — treated as not-found). The
 * `status = 'published'` filter matches the "Public can view published
 * jobs" RLS policy (001), so drafts and jobs HR has explicitly closed
 * remain indistinguishable from "not found" here too — this never widens
 * what a candidate can see, only what friendly message they get for an
 * otherwise-visible listing.
 */
export async function getJobForApplication(id: string): Promise<JobApplicationEligibility | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, department, employment_type, closes_at")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as JobApplicationRow;
  const isOpen = !(row.closes_at && new Date(row.closes_at) < new Date());

  return {
    id: row.id,
    title: row.title,
    department: row.department,
    employmentType: toEmploymentType(row.employment_type),
    isOpen,
  };
}
