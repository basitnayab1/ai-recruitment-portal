import "server-only";

import { createClient } from "@/lib/supabase/server";
import { HR_LIST_PAGE_SIZE, sanitizeSearchTerm } from "@/lib/hr/search/constants";
import {
  getHRProfilePictureSignedUrlForCandidate,
  getHRProfilePictureSignedUrlsByCandidateIds,
} from "@/lib/candidate/profile-picture-urls";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/hr/status";
import { isEmploymentType, type EmploymentType } from "@/lib/hr/jobs";

export const HR_APPLICATIONS_PAGE_SIZE = HR_LIST_PAGE_SIZE;

export const HR_APPLICATION_SORTS = ["newest", "oldest"] as const;
export type HRApplicationSort = (typeof HR_APPLICATION_SORTS)[number];

export function isHRApplicationSort(value: string): value is HRApplicationSort {
  return (HR_APPLICATION_SORTS as readonly string[]).includes(value);
}

export type HRApplicationsFilters = {
  q?: string;
  status?: ApplicationStatus;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  sort: HRApplicationSort;
  page: number;
};

export type HRApplicationsPage = {
  applications: HRApplicationListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type HRApplicationListItem = {
  id: string;
  candidateId: string | null;
  candidateName: string;
  email: string;
  jobId: string | null;
  jobTitle: string;
  department: string | null;
  status: ApplicationStatus;
  submittedAt: string;
  hasResume: boolean;
  hasProfilePicture: boolean;
  pictureUrl: string | null;
};

export type HRApplicationEducation = {
  id: string;
  institutionName: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  grade: string | null;
};

export type HRApplicationSkill = {
  id: string;
  skillName: string;
  proficiencyLevel: string | null;
  yearsOfExperience: number | null;
};

export type HRApplicationNote = {
  id: string;
  note: string;
  authorName: string | null;
  createdAt: string;
};

export type HRApplicationDetail = {
  id: string;
  candidateId: string | null;
  hasProfilePicture: boolean;
  pictureUrl: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  currentPosition: string | null;
  currentCompany: string | null;
  yearsOfExperience: number | null;
  expectedSalary: number | null;
  noticePeriod: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  coverLetter: string | null;
  cvStoragePath: string;
  status: ApplicationStatus;
  submittedAt: string;
  education: HRApplicationEducation[];
  skills: HRApplicationSkill[];
  job: {
    id: string;
    title: string;
    department: string | null;
    location: string | null;
    isRemote: boolean;
    employmentType: EmploymentType;
    salaryMin: number | null;
    salaryMax: number | null;
  } | null;
};

// Row shapes returned by Supabase. Manually typed since DB types have not
// been generated yet; see the same note in src/lib/hr/jobs-data.ts. The
// casts below go through `unknown` because postgrest-js can't infer the
// `jobs` embed as to-one from the select string alone.
type ApplicationListRow = {
  id: string;
  candidate_id: string | null;
  full_name: string;
  email: string;
  status: string;
  submitted_at: string;
  cv_storage_path: string | null;
  jobs: { id: string; title: string; department: string | null } | null;
};

type ApplicationDetailRow = {
  id: string;
  candidate_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  current_position: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  expected_salary: number | null;
  notice_period: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  cover_letter: string | null;
  cv_storage_path: string;
  status: string;
  submitted_at: string;
  jobs: {
    id: string;
    title: string;
    department: string | null;
    location: string | null;
    is_remote: boolean;
    employment_type: string;
    salary_min: number | null;
    salary_max: number | null;
  } | null;
};

type EducationRow = {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  grade: string | null;
};

type SkillRow = {
  id: string;
  skill_name: string;
  proficiency_level: string | null;
  years_of_experience: number | null;
};

type ApplicationNoteRow = {
  id: string;
  note: string;
  created_at: string;
  profiles: { full_name: string } | null;
};

// PostgREST's `.or()` filter string uses `,` and `()` as syntax — strip
// them from user-supplied search text so a search term can never corrupt
// the filter expression (same guard as src/lib/public/jobs-data.ts).

/**
 * Every application across every job, for HR/admin review — RLS ("HR and
 * admin can manage applications", 001) already scopes this to
 * authenticated HR/admin staff only; the caller's own authenticated
 * session is used throughout, never the service-role key.
 *
 * Search matches candidate name/email directly, and job title indirectly:
 * PostgREST can't OR-combine a local-column filter with an embedded-table
 * column filter in one request, so a matching search term first resolves
 * to a set of job ids (via a small separate query), which are then folded
 * into the same `.or()` as `job_id.in.(...)`. The `jobs` embed always uses
 * `!inner` so the department filter (an embedded-column `.eq()`) works —
 * safe to do unconditionally since `applications.job_id` is `not null`,
 * so every application already has exactly one job to inner-join against.
 */
export async function getHRApplications(filters: HRApplicationsFilters): Promise<HRApplicationsPage> {
  const supabase = await createClient();
  const pageSize = HR_APPLICATIONS_PAGE_SIZE;
  const page = Math.max(1, filters.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("applications")
    .select(
      "id, candidate_id, full_name, email, status, submitted_at, cv_storage_path, jobs!inner ( id, title, department )",
      { count: "exact" }
    );

  const q = filters.q ? sanitizeSearchTerm(filters.q) : "";
  if (q) {
    const orParts = [`full_name.ilike.%${q}%`, `email.ilike.%${q}%`];

    const { data: matchingJobs, error: jobSearchError } = await supabase
      .from("jobs")
      .select("id")
      .ilike("title", `%${q}%`);

    if (jobSearchError) {
      console.error("[hr/applications-data] Failed to search jobs by title:", jobSearchError.message);
    } else if (matchingJobs && matchingJobs.length > 0) {
      const jobIds = matchingJobs.map((job) => (job as { id: string }).id);
      orParts.push(`job_id.in.(${jobIds.join(",")})`);
    }

    query = query.or(orParts.join(","));
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.department) {
    query = query.eq("jobs.department", filters.department);
  }
  if (filters.dateFrom) {
    query = query.gte("submitted_at", `${filters.dateFrom}T00:00:00.000Z`);
  }
  if (filters.dateTo) {
    query = query.lte("submitted_at", `${filters.dateTo}T23:59:59.999Z`);
  }

  query = query.order("submitted_at", { ascending: filters.sort === "oldest" });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("[hr/applications-data] Failed to load applications:", error.message);
    return { applications: [], total: 0, page, pageSize };
  }

  const rows = (data ?? []) as unknown as ApplicationListRow[];
  const candidateIds = [
    ...new Set(rows.map((row) => row.candidate_id).filter((id): id is string => Boolean(id))),
  ];
  // Single round-trip: signed URL map keys imply "has picture".
  const pictureUrls = await getHRProfilePictureSignedUrlsByCandidateIds(candidateIds);

  const applications = rows.map((row) => ({
    id: row.id,
    candidateId: row.candidate_id,
    candidateName: row.full_name,
    email: row.email,
    jobId: row.jobs?.id ?? null,
    jobTitle: row.jobs?.title ?? "Unknown role",
    department: row.jobs?.department ?? null,
    status: isApplicationStatus(row.status) ? row.status : "new",
    submittedAt: row.submitted_at,
    hasResume: Boolean(row.cv_storage_path),
    hasProfilePicture: row.candidate_id ? pictureUrls.has(row.candidate_id) : false,
    pictureUrl: row.candidate_id ? (pictureUrls.get(row.candidate_id) ?? null) : null,
  }));

  return { applications, total: count ?? applications.length, page, pageSize };
}

/**
 * Distinct list of job departments, for the Applications filter bar's
 * "Department" dropdown. Reads `jobs.department` directly (HR already has
 * full read access via "HR and admin can manage jobs", 001) rather than
 * deriving it from the applications list, so the facet stays complete
 * even under an active search/status/department filter.
 */
export async function getHRApplicationDepartments(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("jobs").select("department").not("department", "is", null);

  if (error) {
    console.error("[hr/applications-data] Failed to load departments:", error.message);
    return [];
  }

  const departments = new Set<string>();
  for (const row of (data ?? []) as { department: string | null }[]) {
    if (row.department) departments.add(row.department);
  }

  return Array.from(departments).sort((a, b) => a.localeCompare(b));
}

/**
 * Full detail for a single application, for the HR review page
 * (/hr/applications/[id]). Every candidate-facing field (contact info,
 * cover letter, expected salary, notice period) is read directly off the
 * `applications` row itself — these were captured at application time and
 * denormalized onto the row on submission (see
 * src/lib/candidate/application-actions.ts), so no join to
 * `candidate_profiles` is needed (HR has no read access to that table by
 * design — see 002_candidate_profiles.sql). Education/skills are read via
 * `application_id` directly (both tables are keyed by it, see
 * 001_initial_schema.sql) — for applications submitted through the
 * current self-service candidate flow (which doesn't yet collect
 * education/skills at apply time) these are simply empty, not an error.
 */
export async function getHRApplicationById(id: string): Promise<HRApplicationDetail | null> {
  const supabase = await createClient();

  const [applicationResult, educationResult, skillsResult] = await Promise.all([
    supabase
      .from("applications")
      .select(
        `id, candidate_id, full_name, email, phone, current_position, current_company, years_of_experience,
         expected_salary, notice_period, linkedin_url, portfolio_url, cover_letter, cv_storage_path,
         status, submitted_at,
         jobs ( id, title, department, location, is_remote, employment_type, salary_min, salary_max )`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("education")
      .select("id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade")
      .eq("application_id", id)
      .order("start_date", { ascending: false }),
    supabase
      .from("skills")
      .select("id, skill_name, proficiency_level, years_of_experience")
      .eq("application_id", id),
  ]);

  if (applicationResult.error || !applicationResult.data) {
    return null;
  }

  const row = applicationResult.data as unknown as ApplicationDetailRow;
  const educationRows = (educationResult.data ?? []) as EducationRow[];
  const skillRows = (skillsResult.data ?? []) as SkillRow[];

  let hasProfilePicture = false;
  let pictureUrl: string | null = null;
  if (row.candidate_id) {
    const { data: pictureRow } = await supabase
      .from("candidate_profile_pictures")
      .select("candidate_id")
      .eq("candidate_id", row.candidate_id)
      .maybeSingle();
    hasProfilePicture = Boolean(pictureRow);
    if (hasProfilePicture) {
      pictureUrl = await getHRProfilePictureSignedUrlForCandidate(row.candidate_id);
    }
  }

  return {
    id: row.id,
    candidateId: row.candidate_id,
    hasProfilePicture,
    pictureUrl,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    currentPosition: row.current_position,
    currentCompany: row.current_company,
    yearsOfExperience: row.years_of_experience,
    expectedSalary: row.expected_salary,
    noticePeriod: row.notice_period,
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    coverLetter: row.cover_letter,
    cvStoragePath: row.cv_storage_path,
    status: isApplicationStatus(row.status) ? row.status : "new",
    submittedAt: row.submitted_at,
    education: educationRows.map((edu) => ({
      id: edu.id,
      institutionName: edu.institution_name,
      degree: edu.degree,
      fieldOfStudy: edu.field_of_study,
      startDate: edu.start_date,
      endDate: edu.end_date,
      isCurrent: edu.is_current,
      grade: edu.grade,
    })),
    skills: skillRows.map((skill) => ({
      id: skill.id,
      skillName: skill.skill_name,
      proficiencyLevel: skill.proficiency_level,
      yearsOfExperience: skill.years_of_experience,
    })),
    job: row.jobs
      ? {
          id: row.jobs.id,
          title: row.jobs.title,
          department: row.jobs.department,
          location: row.jobs.location,
          isRemote: row.jobs.is_remote,
          employmentType: isEmploymentType(row.jobs.employment_type) ? row.jobs.employment_type : "full_time",
          salaryMin: row.jobs.salary_min,
          salaryMax: row.jobs.salary_max,
        }
      : null,
  };
}

/**
 * Internal HR notes for an application, newest first — RLS ("HR and admin
 * can manage application notes", 001) means only HR/admin can ever read
 * this; there is no candidate-facing policy on `application_notes` at
 * all, so a candidate session can never see these regardless of what the
 * application code does.
 */
export async function getApplicationNotes(applicationId: string): Promise<HRApplicationNote[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("application_notes")
    .select("id, note, created_at, profiles ( full_name )")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[hr/applications-data] Failed to load application notes:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as ApplicationNoteRow[]).map((row) => ({
    id: row.id,
    note: row.note,
    authorName: row.profiles?.full_name ?? null,
    createdAt: row.created_at,
  }));
}
