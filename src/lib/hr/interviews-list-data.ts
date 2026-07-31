import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isInterviewStatus,
  isInterviewType,
  type InterviewStatus,
  type InterviewType,
} from "@/lib/hr/interviews";
import { HR_LIST_PAGE_SIZE, sanitizeSearchTerm } from "@/lib/hr/search/constants";
import { getCandidateIdsWithProfilePictures } from "@/lib/candidate/profile-picture-data";
import { getHRProfilePictureSignedUrlsByCandidateIds } from "@/lib/candidate/profile-picture-urls";

export const HR_INTERVIEWS_PAGE_SIZE = HR_LIST_PAGE_SIZE;

export const HR_INTERVIEW_TIME_FILTERS = [
  "today",
  "this_week",
  "upcoming",
  "completed",
  "cancelled",
] as const;
export type HRInterviewTimeFilter = (typeof HR_INTERVIEW_TIME_FILTERS)[number];

export function isHRInterviewTimeFilter(value: string): value is HRInterviewTimeFilter {
  return (HR_INTERVIEW_TIME_FILTERS as readonly string[]).includes(value);
}

export type HRInterviewsFilters = {
  q?: string;
  timeFilter?: HRInterviewTimeFilter;
  page: number;
};

export type HRInterviewListItem = {
  id: string;
  applicationId: string;
  candidateId: string | null;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  interviewType: InterviewType;
  interviewDate: string;
  interviewTime: string;
  status: InterviewStatus;
  hasProfilePicture: boolean;
  pictureUrl: string | null;
};

export type HRInterviewsPage = {
  interviews: HRInterviewListItem[];
  total: number;
  page: number;
  pageSize: number;
};

type InterviewListRow = {
  id: string;
  application_id: string;
  candidate_id: string | null;
  interviewer_name: string;
  interview_type: string;
  interview_date: string;
  interview_time: string;
  status: string;
  applications: {
    full_name: string;
    jobs: { title: string } | null;
  } | null;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekRangeIsoDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday));
  const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6));
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

async function resolveInterviewSearchIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  q: string
): Promise<string[]> {
  const [interviewResult, jobResult] = await Promise.all([
    supabase.from("interviews").select("id").ilike("interviewer_name", `%${q}%`),
    supabase.from("jobs").select("id").ilike("title", `%${q}%`),
  ]);

  if (interviewResult.error) {
    console.error("[hr/interviews-list-data] Failed to search interviewers:", interviewResult.error.message);
  }
  if (jobResult.error) {
    console.error("[hr/interviews-list-data] Failed to search jobs:", jobResult.error.message);
  }

  const ids = new Set<string>();
  for (const row of (interviewResult.data ?? []) as { id: string }[]) {
    ids.add(row.id);
  }

  const jobIds = (jobResult.data ?? []).map((row) => (row as { id: string }).id);
  if (jobIds.length > 0) {
    const { data: jobInterviews, error: jobInterviewsError } = await supabase
      .from("interviews")
      .select("id")
      .in("job_id", jobIds);

    if (jobInterviewsError) {
      console.error("[hr/interviews-list-data] Failed to resolve job interviews:", jobInterviewsError.message);
    } else {
      for (const row of (jobInterviews ?? []) as { id: string }[]) {
        ids.add(row.id);
      }
    }
  }

  const { data: candidateApplications, error: candidateError } = await supabase
    .from("applications")
    .select("id")
    .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  if (candidateError) {
    console.error("[hr/interviews-list-data] Failed to search candidates:", candidateError.message);
  } else if (candidateApplications && candidateApplications.length > 0) {
    const applicationIds = candidateApplications.map((row) => (row as { id: string }).id);
    const { data: candidateInterviews, error: candidateInterviewsError } = await supabase
      .from("interviews")
      .select("id")
      .in("application_id", applicationIds);

    if (candidateInterviewsError) {
      console.error(
        "[hr/interviews-list-data] Failed to resolve candidate interviews:",
        candidateInterviewsError.message
      );
    } else {
      for (const row of (candidateInterviews ?? []) as { id: string }[]) {
        ids.add(row.id);
      }
    }
  }

  return ids.size > 0 ? [...ids] : [];
}

/**
 * Paginated HR interviews directory with search and time/status filters.
 */
export async function getHRInterviews(filters: HRInterviewsFilters): Promise<HRInterviewsPage> {
  const supabase = await createClient();
  const pageSize = HR_INTERVIEWS_PAGE_SIZE;
  const page = Math.max(1, filters.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const q = filters.q ? sanitizeSearchTerm(filters.q) : "";
  let searchIds: string[] | null = null;

  if (q) {
    const resolvedSearchIds = await resolveInterviewSearchIds(supabase, q);
    if (resolvedSearchIds.length === 0) {
      return { interviews: [], total: 0, page, pageSize };
    }
    searchIds = resolvedSearchIds;
  }

  let query = supabase
    .from("interviews")
    .select(
      "id, application_id, candidate_id, interviewer_name, interview_type, interview_date, interview_time, status, applications!inner ( full_name, jobs!inner ( title ) )",
      { count: "exact" }
    );

  if (searchIds) {
    query = query.in("id", searchIds);
  }

  switch (filters.timeFilter) {
    case "today":
      query = query.eq("interview_date", todayIsoDate());
      break;
    case "this_week": {
      const { start, end } = weekRangeIsoDates();
      query = query.gte("interview_date", start).lte("interview_date", end);
      break;
    }
    case "upcoming":
      query = query.eq("status", "scheduled").gte("interview_date", todayIsoDate());
      break;
    case "completed":
      query = query.eq("status", "completed");
      break;
    case "cancelled":
      query = query.eq("status", "cancelled");
      break;
    default:
      break;
  }

  query = query
    .order("interview_date", { ascending: true })
    .order("interview_time", { ascending: true });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("[hr/interviews-list-data] Failed to load interviews:", error.message);
    return { interviews: [], total: 0, page, pageSize };
  }

  const rows = (data ?? []) as unknown as InterviewListRow[];
  const candidateIds = [
    ...new Set(rows.map((row) => row.candidate_id).filter((id): id is string => Boolean(id))),
  ];
  const pictureIds = await getCandidateIdsWithProfilePictures(candidateIds);
  const pictureUrls = await getHRProfilePictureSignedUrlsByCandidateIds(
    candidateIds.filter((id) => pictureIds.has(id))
  );

  const interviews = rows.map((row) => ({
    id: row.id,
    applicationId: row.application_id,
    candidateId: row.candidate_id,
    candidateName: row.applications?.full_name ?? "Unknown candidate",
    jobTitle: row.applications?.jobs?.title ?? "Unknown role",
    interviewerName: row.interviewer_name,
    interviewType: isInterviewType(row.interview_type) ? row.interview_type : "online",
    interviewDate: row.interview_date,
    interviewTime: row.interview_time.length >= 5 ? row.interview_time.slice(0, 5) : row.interview_time,
    status: isInterviewStatus(row.status) ? row.status : "scheduled",
    hasProfilePicture: row.candidate_id ? pictureIds.has(row.candidate_id) : false,
    pictureUrl: row.candidate_id ? (pictureUrls.get(row.candidate_id) ?? null) : null,
  }));

  return { interviews, total: count ?? interviews.length, page, pageSize };
}
