import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  getHRProfilePictureSignedUrlForCandidate,
  getHRProfilePictureSignedUrlsByCandidateIds,
} from "@/lib/candidate/profile-picture-urls";
import { getLatestResumeAnalysisForCandidate } from "@/lib/hr/resume-analysis-data";
import { HR_LIST_PAGE_SIZE, sanitizeSearchTerm } from "@/lib/hr/search/constants";
import type { ResumeAnalysis } from "@/lib/ai/types";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/hr/status";
import {
  isGender,
  isHighestQualification,
  isNoticePeriod,
  type Gender,
  type HighestQualification,
  type NoticePeriod,
} from "@/lib/candidate/profile-details";

export const HR_CANDIDATES_PAGE_SIZE = HR_LIST_PAGE_SIZE;

export const HR_CANDIDATE_SORTS = ["newest", "oldest", "name_asc", "experience_desc"] as const;
export type HRCandidateSort = (typeof HR_CANDIDATE_SORTS)[number];

export function isHRCandidateSort(value: string): value is HRCandidateSort {
  return (HR_CANDIDATE_SORTS as readonly string[]).includes(value);
}

export type HRCandidatesFilters = {
  q?: string;
  minExperience?: number;
  resumeUploaded?: "yes" | "no";
  createdFrom?: string;
  createdTo?: string;
  sort: HRCandidateSort;
  page: number;
};

export type HRCandidateListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  yearsOfExperience: number | null;
  location: string | null;
  hasResume: boolean;
  hasProfilePicture: boolean;
  pictureUrl: string | null;
};

export type HRCandidatesPage = {
  candidates: HRCandidateListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type HRCandidateEducation = {
  id: string;
  institutionName: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  grade: string | null;
};

export type HRCandidateSkill = {
  id: string;
  skillName: string;
  proficiencyLevel: string | null;
  yearsOfExperience: number | null;
};

export type HRCandidateApplicationSummary = {
  id: string;
  jobTitle: string;
  department: string | null;
  status: ApplicationStatus;
  submittedAt: string;
};

export type HRCandidateDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  joinedAt: string;
  profile: {
    cnic: string | null;
    dateOfBirth: string | null;
    gender: Gender | null;
    country: string | null;
    province: string | null;
    city: string | null;
    address: string | null;
    currentJobTitle: string | null;
    yearsOfExperience: number | null;
    highestQualification: HighestQualification | null;
    currentCompany: string | null;
    currentSalary: number | null;
    expectedSalary: number | null;
    noticePeriod: NoticePeriod | null;
    skills: string[];
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    githubUrl: string | null;
    profileCompletion: number;
  } | null;
  resume: {
    fileName: string;
    fileSize: number;
    uploadedAt: string;
  } | null;
  resumeAnalysis: {
    analysis: ResumeAnalysis;
    jobTitle: string;
    updatedAt: string;
  } | null;
  hasProfilePicture: boolean;
  pictureUrl: string | null;
  education: HRCandidateEducation[];
  skills: HRCandidateSkill[];
  applications: HRCandidateApplicationSummary[];
};

// Row shapes returned by Supabase. Manually typed since DB types have not
// been generated yet; see the same note in src/lib/hr/jobs-data.ts.
type CandidateProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
};

type ProfileDetailsRow = {
  candidate_id: string;
  cnic: string | null;
  date_of_birth: string | null;
  gender: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  current_job_title: string | null;
  years_of_experience: number | null;
  highest_qualification: string | null;
  current_company: string | null;
  current_salary: number | null;
  expected_salary: number | null;
  notice_period: string | null;
  skills: string[] | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  profile_completion: number;
};

type ResumeRow = {
  candidate_id: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
};

type ApplicationDetailRow = {
  id: string;
  status: string;
  submitted_at: string;
  jobs: { title: string; department: string | null } | null;
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

function formatLocation(details: {
  city: string | null;
  province: string | null;
  country: string | null;
} | null): string | null {
  if (!details) {
    return null;
  }

  const parts = [details.city, details.province, details.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

type CandidateListEmbedRow = CandidateProfileRow & {
  candidate_profile_details:
    | {
        years_of_experience: number | null;
        city: string | null;
        province: string | null;
        country: string | null;
      }
    | {
        years_of_experience: number | null;
        city: string | null;
        province: string | null;
        country: string | null;
      }[]
    | null;
  candidate_resumes: { candidate_id: string } | { candidate_id: string }[] | null;
  candidate_profile_pictures: { candidate_id: string } | { candidate_id: string }[] | null;
};

async function findCandidateIdsBySkillSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  q: string
): Promise<string[]> {
  const qLower = q.toLowerCase();

  const [appSkillsResult, profileSkillsResult] = await Promise.all([
    supabase.from("skills").select("application_id").ilike("skill_name", `%${q}%`),
    supabase
      .from("candidate_profile_details")
      .select("candidate_id, skills")
      .not("skills", "eq", "{}"),
  ]);

  if (appSkillsResult.error) {
    console.error("[hr/candidates-data] Failed to search skills:", appSkillsResult.error.message);
  }
  if (profileSkillsResult.error) {
    console.error(
      "[hr/candidates-data] Failed to search profile skills:",
      profileSkillsResult.error.message
    );
  }

  const ids = new Set<string>();

  for (const row of (profileSkillsResult.data ?? []) as {
    candidate_id: string;
    skills: string[] | null;
  }[]) {
    if (
      Array.isArray(row.skills) &&
      row.skills.some((skill) => skill.toLowerCase().includes(qLower))
    ) {
      ids.add(row.candidate_id);
    }
  }

  const applicationIds = (appSkillsResult.data ?? []).map(
    (row) => (row as { application_id: string }).application_id
  );
  if (applicationIds.length > 0) {
    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select("candidate_id")
      .in("id", applicationIds)
      .not("candidate_id", "is", null);

    if (applicationsError) {
      console.error(
        "[hr/candidates-data] Failed to resolve skill applications:",
        applicationsError.message
      );
    } else {
      for (const row of applications ?? []) {
        const candidateId = (row as { candidate_id: string | null }).candidate_id;
        if (candidateId) ids.add(candidateId);
      }
    }
  }

  return [...ids];
}

async function resolveCandidateSearchIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  q: string
): Promise<string[]> {
  const detailsOrParts = [
    `city.ilike.%${q}%`,
    `province.ilike.%${q}%`,
    `country.ilike.%${q}%`,
    `current_job_title.ilike.%${q}%`,
  ];
  const experienceQuery = Number.parseInt(q, 10);
  if (Number.isFinite(experienceQuery)) {
    detailsOrParts.push(`years_of_experience.eq.${experienceQuery}`);
  }

  const [profileResult, detailsResult, skillCandidateIds] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("id")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`),
    supabase.from("candidate_profile_details").select("candidate_id").or(detailsOrParts.join(",")),
    findCandidateIdsBySkillSearch(supabase, q),
  ]);

  if (profileResult.error) {
    console.error("[hr/candidates-data] Failed to search candidate profiles:", profileResult.error.message);
  }
  if (detailsResult.error) {
    console.error("[hr/candidates-data] Failed to search profile details:", detailsResult.error.message);
  }

  const ids = new Set<string>();
  for (const row of (profileResult.data ?? []) as { id: string }[]) {
    ids.add(row.id);
  }
  for (const row of (detailsResult.data ?? []) as { candidate_id: string }[]) {
    ids.add(row.candidate_id);
  }
  for (const id of skillCandidateIds) {
    ids.add(id);
  }

  return [...ids];
}

async function findCandidateIdsWithResume(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string[]> {
  const { data, error } = await supabase.from("candidate_resumes").select("candidate_id");
  if (error) {
    console.error("[hr/candidates-data] Failed to load resume index:", error.message);
    return [];
  }
  return (data ?? []).map((row) => (row as { candidate_id: string }).candidate_id);
}

/**
 * A paginated, searchable directory of every candidate account, read
 * directly and only from `public.candidate_profiles` (never `profiles` —
 * that table is exclusively internal HR/admin staff accounts, see
 * 002_candidate_profiles.sql). Relies on the "HR and admin can view all
 * candidate profiles" policy added in 009_hr_candidate_read_access.sql.
 */
export async function getHRCandidates(filters: HRCandidatesFilters): Promise<HRCandidatesPage> {
  const supabase = await createClient();
  const pageSize = HR_CANDIDATES_PAGE_SIZE;
  const page = Math.max(1, filters.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const q = filters.q ? sanitizeSearchTerm(filters.q) : "";
  let searchIds: string[] | null = null;

  if (q) {
    searchIds = await resolveCandidateSearchIds(supabase, q);
    if (searchIds.length === 0) {
      return { candidates: [], total: 0, page, pageSize };
    }
  }

  const useInnerDetails = filters.minExperience !== undefined;
  const detailsEmbed = useInnerDetails
    ? "candidate_profile_details!inner ( years_of_experience, city, province, country )"
    : "candidate_profile_details ( years_of_experience, city, province, country )";

  let query = supabase
    .from("candidate_profiles")
    .select(`id, full_name, email, phone, created_at, ${detailsEmbed}, candidate_resumes ( candidate_id ), candidate_profile_pictures ( candidate_id )`, {
      count: "exact",
    });

  if (searchIds) {
    query = query.in("id", searchIds);
  }

  if (filters.createdFrom) {
    query = query.gte("created_at", `${filters.createdFrom}T00:00:00.000Z`);
  }
  if (filters.createdTo) {
    query = query.lte("created_at", `${filters.createdTo}T23:59:59.999Z`);
  }
  if (filters.minExperience !== undefined) {
    query = query.gte("candidate_profile_details.years_of_experience", filters.minExperience);
  }

  if (filters.resumeUploaded === "yes" || filters.resumeUploaded === "no") {
    const resumeCandidateIds = await findCandidateIdsWithResume(supabase);
    if (filters.resumeUploaded === "yes") {
      if (resumeCandidateIds.length === 0) {
        return { candidates: [], total: 0, page, pageSize };
      }
      query = query.in("id", resumeCandidateIds);
    } else if (resumeCandidateIds.length > 0) {
      query = query.not("id", "in", `(${resumeCandidateIds.join(",")})`);
    }
  }

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name_asc":
      query = query.order("full_name", { ascending: true });
      break;
    case "experience_desc":
      query = query.order("years_of_experience", {
        foreignTable: "candidate_profile_details",
        ascending: false,
        nullsFirst: false,
      });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("[hr/candidates-data] Failed to load candidates:", error.message);
    return { candidates: [], total: 0, page, pageSize };
  }

  const rows = (data ?? []) as CandidateListEmbedRow[];

  const candidates: HRCandidateListItem[] = rows.map((row) => {
    const details = Array.isArray(row.candidate_profile_details)
      ? (row.candidate_profile_details[0] ?? null)
      : row.candidate_profile_details;
    const resume = Array.isArray(row.candidate_resumes)
      ? row.candidate_resumes[0]
      : row.candidate_resumes;
    const picture = Array.isArray(row.candidate_profile_pictures)
      ? row.candidate_profile_pictures[0]
      : row.candidate_profile_pictures;

    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      createdAt: row.created_at,
      yearsOfExperience: details?.years_of_experience ?? null,
      location: formatLocation(details),
      hasResume: Boolean(resume),
      hasProfilePicture: Boolean(picture),
      pictureUrl: null,
    };
  });

  const pictureUrls = await getHRProfilePictureSignedUrlsByCandidateIds(
    candidates.filter((candidate) => candidate.hasProfilePicture).map((candidate) => candidate.id)
  );

  const candidatesWithUrls = candidates.map((candidate) => ({
    ...candidate,
    pictureUrl: pictureUrls.get(candidate.id) ?? null,
  }));

  return { candidates: candidatesWithUrls, total: count ?? candidatesWithUrls.length, page, pageSize };
}

/**
 * Full candidate-centric profile for /hr/candidates/[id]: identity,
 * extended profile details, résumé, and every application the candidate
 * has submitted. Education/skills are read via that candidate's own
 * applications (`education`/`skills` are keyed by `application_id`, not
 * `candidate_id` — see 001_initial_schema.sql) using the existing
 * "HR and admin can manage education/skills" policies; for candidates who
 * applied only through the current self-service flow (which doesn't yet
 * collect education/skills) these lists are simply empty, not an error.
 */
export async function getHRCandidateById(id: string): Promise<HRCandidateDetail | null> {
  const supabase = await createClient();

  const [profileResult, detailsResult, resumeResult, pictureResult, applicationsResult] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("id, full_name, email, phone, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("candidate_profile_details").select("*").eq("candidate_id", id).maybeSingle(),
    supabase
      .from("candidate_resumes")
      .select("candidate_id, file_name, file_size, uploaded_at")
      .eq("candidate_id", id)
      .maybeSingle(),
    supabase
      .from("candidate_profile_pictures")
      .select("candidate_id")
      .eq("candidate_id", id)
      .maybeSingle(),
    supabase
      .from("applications")
      .select("id, status, submitted_at, jobs ( title, department )")
      .eq("candidate_id", id)
      .order("submitted_at", { ascending: false }),
  ]);

  if (profileResult.error || !profileResult.data) {
    return null;
  }

  const hasProfilePicture = Boolean(pictureResult.data);
  const pictureUrl = hasProfilePicture
    ? await getHRProfilePictureSignedUrlForCandidate(id)
    : null;

  const profileRow = profileResult.data as CandidateProfileRow;

  const detailsRow = detailsResult.data as ProfileDetailsRow | null;
  const resumeRow = resumeResult.data as ResumeRow | null;
  const applicationRows = (applicationsResult.data ?? []) as unknown as ApplicationDetailRow[];

  const applicationIds = applicationRows.map((row) => row.id);
  const defaultApplicationId = applicationRows[0]?.id ?? null;

  let educationRows: EducationRow[] = [];
  let skillRows: SkillRow[] = [];

  if (applicationIds.length > 0) {
    const [educationResult, skillsResult] = await Promise.all([
      supabase
        .from("education")
        .select("id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade")
        .in("application_id", applicationIds)
        .order("start_date", { ascending: false }),
      supabase
        .from("skills")
        .select("id, skill_name, proficiency_level, years_of_experience")
        .in("application_id", applicationIds),
    ]);
    educationRows = (educationResult.data ?? []) as EducationRow[];
    skillRows = (skillsResult.data ?? []) as SkillRow[];
  }

  const profileSkillNames = Array.isArray(detailsRow?.skills)
    ? detailsRow.skills.map((s) => s.trim()).filter(Boolean)
    : [];
  const mergedSkills: HRCandidateSkill[] = [];
  const seenSkills = new Set<string>();
  for (const [index, skillName] of profileSkillNames.entries()) {
    const key = skillName.toLowerCase();
    if (seenSkills.has(key)) continue;
    seenSkills.add(key);
    mergedSkills.push({
      id: `profile-skill-${index}`,
      skillName,
      proficiencyLevel: null,
      yearsOfExperience: null,
    });
  }
  for (const row of skillRows) {
    const key = row.skill_name.trim().toLowerCase();
    if (!key || seenSkills.has(key)) continue;
    seenSkills.add(key);
    mergedSkills.push({
      id: row.id,
      skillName: row.skill_name,
      proficiencyLevel: row.proficiency_level,
      yearsOfExperience: row.years_of_experience,
    });
  }

  const storedAnalysis = resumeRow
    ? await getLatestResumeAnalysisForCandidate(id, defaultApplicationId)
    : null;

  const resumeUploadedAt = resumeRow?.uploaded_at ?? null;
  const analysisIsStale =
    storedAnalysis &&
    resumeUploadedAt &&
    new Date(resumeUploadedAt).getTime() > new Date(storedAnalysis.updatedAt).getTime();

  return {
    id: profileRow.id,
    fullName: profileRow.full_name,
    email: profileRow.email,
    phone: profileRow.phone,
    joinedAt: profileRow.created_at,
    profile: detailsRow
      ? {
          cnic: detailsRow.cnic,
          dateOfBirth: detailsRow.date_of_birth,
          gender: detailsRow.gender && isGender(detailsRow.gender) ? detailsRow.gender : null,
          country: detailsRow.country,
          province: detailsRow.province,
          city: detailsRow.city,
          address: detailsRow.address,
          currentJobTitle: detailsRow.current_job_title,
          yearsOfExperience: detailsRow.years_of_experience,
          highestQualification:
            detailsRow.highest_qualification && isHighestQualification(detailsRow.highest_qualification)
              ? detailsRow.highest_qualification
              : null,
          currentCompany: detailsRow.current_company,
          currentSalary: detailsRow.current_salary ?? null,
          expectedSalary: detailsRow.expected_salary,
          noticePeriod:
            detailsRow.notice_period && isNoticePeriod(detailsRow.notice_period)
              ? detailsRow.notice_period
              : null,
          skills: profileSkillNames,
          linkedinUrl: detailsRow.linkedin_url,
          portfolioUrl: detailsRow.portfolio_url,
          githubUrl: detailsRow.github_url,
          profileCompletion: detailsRow.profile_completion,
        }
      : null,
    resume: resumeRow
      ? {
          fileName: resumeRow.file_name,
          fileSize: resumeRow.file_size,
          uploadedAt: resumeRow.uploaded_at,
        }
      : null,
    resumeAnalysis:
      storedAnalysis && !analysisIsStale
        ? {
            analysis: storedAnalysis.analysis,
            jobTitle: storedAnalysis.jobTitle,
            updatedAt: storedAnalysis.updatedAt,
          }
        : null,
    hasProfilePicture,
    pictureUrl,
    education: educationRows.map((row) => ({
      id: row.id,
      institutionName: row.institution_name,
      degree: row.degree,
      fieldOfStudy: row.field_of_study,
      startDate: row.start_date,
      endDate: row.end_date,
      isCurrent: row.is_current,
      grade: row.grade,
    })),
    skills: mergedSkills,
    applications: applicationRows.map((row) => ({
      id: row.id,
      jobTitle: row.jobs?.title ?? "Unknown role",
      department: row.jobs?.department ?? null,
      status: isApplicationStatus(row.status) ? row.status : "new",
      submittedAt: row.submitted_at,
    })),
  };
}
