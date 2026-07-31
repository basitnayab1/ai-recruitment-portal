import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/hr/status";
import { isEmploymentType, type EmploymentType } from "@/lib/hr/jobs";

// Without generated DB types, postgrest-js can't infer embed cardinality
// from the select string alone, so it types the `jobs` embed as an array
// even though `applications.job_id -> jobs.id` is to-one. The cast in
// `getCandidateApplications` goes through `unknown` for that reason (same
// pattern as `src/lib/candidate/dashboard-data.ts`).
type CandidateApplicationRow = {
  id: string;
  status: string;
  submitted_at: string;
  jobs: {
    id: string;
    title: string;
    department: string | null;
    location: string | null;
    is_remote: boolean;
    employment_type: string;
  } | null;
};

export type CandidateApplicationListItem = {
  id: string;
  jobId: string | null;
  jobTitle: string;
  department: string | null;
  location: string | null;
  isRemote: boolean;
  employmentType: EmploymentType;
  status: ApplicationStatus;
  submittedAt: string;
};

/**
 * All applications the caller has submitted, newest first. Uses the
 * caller's own authenticated session — RLS ("Candidates can view own
 * applications", 004 migration) means this can only ever return the
 * caller's own rows, so the `candidate_id` filter below is a defense-in-
 * depth clarity aid, not the actual security boundary.
 */
export async function getCandidateApplications(candidateId: string): Promise<CandidateApplicationListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, submitted_at, jobs ( id, title, department, location, is_remote, employment_type )")
    .eq("candidate_id", candidateId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[application-data] Failed to load candidate applications:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as CandidateApplicationRow[]).map((row) => ({
    id: row.id,
    jobId: row.jobs?.id ?? null,
    jobTitle: row.jobs?.title ?? "Unknown role",
    department: row.jobs?.department ?? null,
    location: row.jobs?.location ?? null,
    isRemote: row.jobs?.is_remote ?? false,
    employmentType: row.jobs?.employment_type && isEmploymentType(row.jobs.employment_type)
      ? row.jobs.employment_type
      : "full_time",
    status: isApplicationStatus(row.status) ? row.status : "new",
    submittedAt: row.submitted_at,
  }));
}

// Discriminated result instead of a plain boolean: a real Postgres/RLS
// error (e.g. "column applications.candidate_id does not exist" if
// 004/008's schema changes were never applied) must never be silently
// swallowed into "not applied" — that would let a candidate proceed past
// this check while the underlying problem is still there, only to hit the
// exact same error again at insert time. Callers must handle `"error"`
// explicitly rather than assuming `applied: false`.
export type HasAppliedToJobResult =
  | { status: "checked"; applied: boolean }
  | { status: "error"; message: string };

/**
 * Whether the caller has already applied to a given job — used to show
 * "You have already applied for this job." proactively on the apply page,
 * before the candidate even attempts to submit. The
 * `applications_candidate_job_unique` constraint on `(candidate_id, job_id)`
 * (008_applications_candidate_schema.sql) is still the real,
 * race-condition-proof backstop enforced at insert time.
 */
export async function hasAppliedToJob(
  candidateId: string,
  jobId: string
): Promise<HasAppliedToJobResult> {
  const supabase = await createClient();

  // NOTE: intentionally NOT using `head: true` here. A `head: true` select
  // issues an HTTP HEAD request, and HEAD responses are never allowed to
  // have a body (HTTP spec) — so when this query fails, PostgREST's JSON
  // error payload (message/code/details/hint) never reaches the client at
  // all, and supabase-js is left with an effectively empty error object.
  // That was silently turning every real failure here into a useless
  // `{}` — this select still only needs `count`, so dropping `head: true`
  // costs nothing (at most one tiny `id` value comes back) and restores
  // real, diagnosable error messages.
  const { count, error } = await supabase
    .from("applications")
    .select("id", { count: "exact" })
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId);

  if (error) {
    const message = error.message || error.details || error.hint || String(error);
    console.error("[application-data] Failed to check for an existing application.", {
      query: 'select id from public.applications where candidate_id = $1 and job_id = $2 (count: "exact")',
      params: { candidateId, jobId },
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      raw: error,
    });
    return { status: "error", message };
  }

  return { status: "checked", applied: (count ?? 0) > 0 };
}
