import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { normalizeResumeAnalysis } from "@/lib/ai/types";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/hr/status";
import { isInterviewStatus, type InterviewStatus } from "@/lib/hr/interviews";
import { sanitizeSearchTerm } from "@/lib/hr/search/constants";
import { logCopilotDebug } from "@/lib/ai/copilot-debug";
import {
  analyzeHiringRisks,
  analyzeSkillGaps,
  compareCandidatesDecision,
  explainAIDecision,
  generateDecisionReport,
  getHiringRecommendation,
  getInterviewPriority,
  getSalaryRecommendation,
  type HiringDecisionToolResult,
} from "@/lib/ai/hiring-decision-tools";
import {
  generateAgentEmail,
  generateAgentReport,
  getHRAnalytics,
  getPredictions,
  getSmartAlerts,
  type AgentToolResult,
} from "@/lib/ai/agent-tools";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type AnySupabase = SupabaseClient;

async function getSupabase(client?: AnySupabase): Promise<AnySupabase> {
  if (client) return client;
  return (await createClient()) as unknown as AnySupabase;
}

function clampLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)));
}

function skillMatches(haystack: string[], needle: string): boolean {
  const normalized = needle.trim().toLowerCase();
  if (!normalized) return false;
  return haystack.some(
    (item) =>
      item.toLowerCase() === normalized ||
      item.toLowerCase().includes(normalized) ||
      normalized.includes(item.toLowerCase())
  );
}

function monthRange(month: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const mon = Number(match[2]);
  if (mon < 1 || mon > 12) return null;
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

function todayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

function weekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday)
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

function normalizeJobStatus(status?: string): "draft" | "published" | "closed" | undefined {
  if (!status?.trim()) return undefined;
  const value = status.trim().toLowerCase();
  if (value === "active" || value === "open" || value === "published") return "published";
  if (value === "closed") return "closed";
  if (value === "draft") return "draft";
  return undefined;
}

function throwQueryError(tool: string, table: string, error: { message: string }): never {
  console.error(`[ai/hr-tools] tool=${tool} table=${table} rows=0 error=`, error.message);
  throw new Error(`[ai/hr-tools] ${tool} query on ${table} failed: ${error.message}`);
}

function logRows(tool: string, table: string, rows: number): void {
  logCopilotDebug("Supabase Query", { tool, table, rowsReturned: rows });
}

/**
 * Drop meta/filter tokens the LLM often invents from prompts like "Show AI ranking".
 * Those are NOT job titles or candidate names and would wipe all rows.
 */
const META_FILTER_STOPWORDS =
  /^(ai|a\.?i\.?|ranking|rankings|rank|score|scores|show|list|display|get|all|top|best|highest|lowest|leaderboard|resume|analysis|cv|candidate|candidates|applicant|applicants|person|people|hiring|recommendation|compare|comparison|hire|strong|reservations|maybe|reject|interview|salary|offer|worth|him|her|them|they|he|she|is|are|was|were|better|another|suitable|against|good|fit|why|should|would|recommend|explain|missing|skills?|strengths?|weaknesses?|react|angular|vue|next\.?js|typescript|javascript|python|html|css|tailwind|senior|junior|mid|title|role|questions?|based|generate|technical|behavioral|follow)$/i;

export function sanitizeAiListFilter(value?: string | null): string {
  const cleaned = sanitizeSearchTerm(value ?? "").trim();
  if (!cleaned) return "";
  if (META_FILTER_STOPWORDS.test(cleaned)) return "";
  // Multi-word meta phrases / pronoun placeholders
  if (
    /^(ai\s+)?(ranking|score|analysis|resume|candidates?)(\s+list)?$/i.test(cleaned) ||
    /^(show|list|get|display)\s+/i.test(cleaned) ||
    /^(this|that)\s+candidate$/i.test(cleaned) ||
    /^(this|that)$/i.test(cleaned)
  ) {
    return "";
  }
  return cleaned;
}

export type CopilotCandidateRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  yearsOfExperience: number | null;
  location: string | null;
  skills: string[];
  hasResume: boolean;
  appliedAt: string | null;
  profilePath: string;
};

export type CopilotApplicationRecord = {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  status: ApplicationStatus;
  submittedAt: string;
  department: string | null;
  profilePath: string;
};

export type CopilotJobRecord = {
  id: string;
  title: string;
  department: string | null;
  status: string;
  location: string | null;
  isRemote: boolean;
  createdAt: string;
};

export type CopilotInterviewRecord = {
  id: string;
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  status: InterviewStatus;
  interviewerName: string;
  applicationPath: string;
};

export type CopilotAnalysisRecord = {
  candidateId: string;
  candidateName: string;
  applicationId: string | null;
  jobTitle: string;
  score: number;
  overallScore: number;
  technicalScore: number;
  experienceScore: number;
  educationScore: number;
  communicationScore: number;
  skillMatch: number;
  matchPercent: number;
  recommendation: string;
  recommendationLabel: string;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  summary: string;
  experience: string;
  education: string;
  confidence: number;
  rank: number | null;
  profilePath: string;
};

export type CopilotRankingRecord = {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  score: number;
  rank: number;
  reason: string;
  profilePath: string;
};

export type CopilotDashboardStats = {
  totalCandidates: number;
  totalJobs: number;
  totalInterviews: number;
  totalApplications: number;
  openJobs: number;
  scheduledInterviews: number;
  todaysInterviews: number;
  thisWeeksApplications: number;
  /** Application status counts (live from applications table). */
  totalShortlisted: number;
  totalHired: number;
  totalRejected: number;
  totalInInterview: number;
  totalPendingReview: number;
};

export type CopilotCandidateProfile = {
  candidateId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  yearsOfExperience: number | null;
  location: string | null;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
  }>;
  resume: { fileName: string; uploadedAt: string } | null;
  recentApplications: Array<{
    id: string;
    jobTitle: string;
    status: string;
    submittedAt: string;
  }>;
  profilePath: string | null;
};

export type SearchCandidatesParams = {
  query?: string;
  skill?: string;
  limit?: number;
  todayOnly?: boolean;
  hasPhone?: boolean;
  withoutResume?: boolean;
};

export type SearchApplicationsParams = {
  status?: string;
  month?: string;
  todayOnly?: boolean;
  thisWeekOnly?: boolean;
  jobQuery?: string;
  limit?: number;
};

export type SearchJobsParams = {
  query?: string;
  status?: string;
  remoteOnly?: boolean;
  limit?: number;
};

export type SearchInterviewsParams = {
  status?: string;
  waitingForInterview?: boolean;
  todayOnly?: boolean;
  upcomingOnly?: boolean;
  limit?: number;
};

export type SearchAnalysisParams = {
  skill?: string;
  minScore?: number;
  minMatchPercent?: number;
  topN?: number;
  orderBy?: "score" | "date";
  ascending?: boolean;
  jobQuery?: string;
  candidateQuery?: string;
  focus?: "strengths" | "weaknesses" | "missingSkills" | "recommendation" | "all";
};

export type SearchRankingParams = {
  topN?: number;
  jobQuery?: string;
  orderBy?: "score" | "rank";
  ascending?: boolean;
  candidateQuery?: string;
};

export type CompareCandidatesParams = {
  names?: string[];
  limit?: number;
};

export type GetCandidateProfileParams = {
  query?: string;
  limit?: number;
};

export type MatchJobCandidatesParams = {
  jobQuery?: string;
  topN?: number; // default 5 for hiring decision engine
};

export type SearchCandidatesResult = {
  tool: "searchCandidates";
  count: number;
  candidates: CopilotCandidateRecord[];
};

export type SearchApplicationsResult = {
  tool: "searchApplications";
  count: number;
  totalMatching?: number;
  month?: string;
  applications: CopilotApplicationRecord[];
};

export type SearchJobsResult = {
  tool: "searchJobs";
  count: number;
  jobs: CopilotJobRecord[];
};

export type SearchInterviewsResult = {
  tool: "searchInterviews";
  count: number;
  interviews: CopilotInterviewRecord[];
  waitingCandidates?: CopilotApplicationRecord[];
};

export type SearchAnalysisResult = {
  tool: "searchResumeAnalysis" | "searchAnalysis";
  count: number;
  analyses: CopilotAnalysisRecord[];
};

export type SearchRankingResult = {
  tool: "searchAIRanking" | "searchRanking";
  count: number;
  rankings: CopilotRankingRecord[];
};

export type GetDashboardStatsResult = {
  tool: "getDashboardStats";
  count: number;
  stats: CopilotDashboardStats;
};

export type GetCandidateProfileResult = {
  tool: "getCandidateProfile";
  count: number;
  profiles: CopilotCandidateProfile[];
};

export type MatchJobCandidatesResult = {
  tool: "matchJobCandidates";
  count: number;
  job: { id: string; title: string; department: string | null } | null;
  criteria: Array<{ name: string; weight: number; required: boolean }>;
  rankings: CopilotRankingRecord[];
  analyses: CopilotAnalysisRecord[];
  applicants?: CopilotApplicationRecord[];
};

export async function searchCandidates(
  params: SearchCandidatesParams = {},
  client?: AnySupabase
): Promise<SearchCandidatesResult> {
  const supabase = await getSupabase(client);
  const limit = clampLimit(params.limit);
  const skillFilter = params.skill?.trim().toLowerCase();
  const query = sanitizeSearchTerm(params.query ?? "");

  let appQuery = supabase
    .from("applications")
    .select("id, full_name, email, phone, candidate_id, submitted_at, years_of_experience")
    .order("submitted_at", { ascending: false })
    .limit(500);

  if (params.todayOnly) {
    const { start, end } = todayRange();
    appQuery = appQuery.gte("submitted_at", start).lte("submitted_at", end);
  }

  if (params.hasPhone) {
    appQuery = appQuery.not("phone", "is", null).neq("phone", "");
  }

  const { data: appData, error: appError } = await appQuery;
  if (appError) throwQueryError("searchCandidates", "applications", appError);
  logRows("searchCandidates", "applications", appData?.length ?? 0);

  type AppRow = {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    candidate_id: string | null;
    submitted_at: string;
    years_of_experience: number | null;
  };

  let apps = (appData ?? []) as AppRow[];

  // Skill filter via application skills + candidate profile skills
  let profileSkillCandidateIds = new Set<string>();
  if (skillFilter) {
    const [{ data: skillRows, error: skillError }, { data: profileSkillRows, error: profileSkillError }] =
      await Promise.all([
        supabase
          .from("skills")
          .select("application_id, skill_name")
          .ilike("skill_name", `%${skillFilter}%`)
          .limit(500),
        supabase
          .from("candidate_profile_details")
          .select("candidate_id, skills")
          .not("skills", "eq", "{}"),
      ]);

    if (skillError) throwQueryError("searchCandidates", "skills", skillError);
    if (profileSkillError) {
      throwQueryError("searchCandidates", "candidate_profile_details.skills", profileSkillError);
    }
    logRows("searchCandidates", "skills", skillRows?.length ?? 0);

    const appIds = new Set(
      (skillRows ?? []).map((r) => (r as { application_id: string }).application_id)
    );
    profileSkillCandidateIds = new Set(
      ((profileSkillRows ?? []) as { candidate_id: string; skills: string[] | null }[])
        .filter(
          (row) =>
            Array.isArray(row.skills) &&
            row.skills.some((skill) => skill.toLowerCase().includes(skillFilter))
        )
        .map((row) => row.candidate_id)
    );

    apps = apps.filter(
      (a) =>
        appIds.has(a.id) ||
        (a.candidate_id != null && profileSkillCandidateIds.has(a.candidate_id))
    );
  }

  const candidateIds = [
    ...new Set(apps.map((a) => a.candidate_id).filter((id): id is string => typeof id === "string")),
  ];

  const resumeSet = new Set<string>();
  if (candidateIds.length > 0) {
    const { data: resumeRows, error: resumeError } = await supabase
      .from("candidate_resumes")
      .select("candidate_id")
      .in("candidate_id", candidateIds);

    if (resumeError) throwQueryError("searchCandidates", "candidate_resumes", resumeError);
    logRows("searchCandidates", "candidate_resumes", resumeRows?.length ?? 0);

    for (const row of resumeRows ?? []) {
      resumeSet.add((row as { candidate_id: string }).candidate_id);
    }
  }

  if (params.withoutResume) {
    apps = apps.filter((a) => !a.candidate_id || !resumeSet.has(a.candidate_id));
  }

  type ProfileRow = {
    id: string;
    full_name: string;
    email: string;
    candidate_profile_details:
      | {
          years_of_experience: number | null;
          city: string | null;
          province: string | null;
          country: string | null;
          skills: string[] | null;
        }
      | {
          years_of_experience: number | null;
          city: string | null;
          province: string | null;
          country: string | null;
          skills: string[] | null;
        }[]
      | null;
  };

  const profileById = new Map<string, ProfileRow>();
  if (candidateIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("candidate_profiles")
      .select(
        `
        id,
        full_name,
        email,
        candidate_profile_details ( years_of_experience, city, province, country, skills )
      `
      )
      .in("id", candidateIds);

    if (profileError) throwQueryError("searchCandidates", "candidate_profiles", profileError);
    logRows("searchCandidates", "candidate_profiles", profileData?.length ?? 0);

    for (const row of (profileData ?? []) as ProfileRow[]) {
      profileById.set(row.id, row);
    }
  }

  const skillsByApp = new Map<string, string[]>();
  if (apps.length > 0) {
    const appIds = apps.map((a) => a.id);
    const { data: skillRows, error: skillError } = await supabase
      .from("skills")
      .select("application_id, skill_name")
      .in("application_id", appIds.slice(0, 200));

    if (skillError) throwQueryError("searchCandidates", "skills", skillError);

    for (const row of skillRows ?? []) {
      const typed = row as { application_id: string; skill_name: string };
      const list = skillsByApp.get(typed.application_id) ?? [];
      list.push(typed.skill_name);
      skillsByApp.set(typed.application_id, list);
    }
  }

  const byKey = new Map<string, CopilotCandidateRecord>();

  for (const app of apps) {
    const key = app.candidate_id ?? `email:${app.email.toLowerCase()}`;
    if (byKey.has(key)) continue;

    const profile = app.candidate_id ? profileById.get(app.candidate_id) : undefined;
    const details = profile
      ? Array.isArray(profile.candidate_profile_details)
        ? (profile.candidate_profile_details[0] ?? null)
        : profile.candidate_profile_details
      : null;

    const fullName = app.full_name.trim() || profile?.full_name || "Unknown candidate";
    const email = app.email.trim() || profile?.email || "";

    if (query) {
      const q = query.toLowerCase();
      if (!fullName.toLowerCase().includes(q) && !email.toLowerCase().includes(q)) {
        continue;
      }
    }

    const locationParts = [details?.city, details?.province, details?.country].filter(Boolean);
    const profileSkills = Array.isArray(details?.skills)
      ? details.skills.map((s) => s.trim()).filter(Boolean)
      : [];
    const applicationSkills = skillsByApp.get(app.id) ?? [];
    const mergedSkills = [...new Set([...profileSkills, ...applicationSkills])];

    byKey.set(key, {
      id: app.candidate_id ?? app.id,
      fullName,
      email,
      phone: app.phone,
      yearsOfExperience: details?.years_of_experience ?? app.years_of_experience ?? null,
      location: locationParts.length > 0 ? locationParts.join(", ") : null,
      skills: mergedSkills,
      hasResume: app.candidate_id ? resumeSet.has(app.candidate_id) : false,
      appliedAt: app.submitted_at,
      profilePath: app.candidate_id
        ? `/hr/candidates/${app.candidate_id}`
        : `/hr/applications/${app.id}`,
    });

    if (byKey.size >= limit) break;
  }

  const candidates = [...byKey.values()];
  console.log("Candidates loaded:", candidates.length);
  return { tool: "searchCandidates", count: candidates.length, candidates };
}

export async function searchApplications(
  params: SearchApplicationsParams = {},
  client?: AnySupabase
): Promise<SearchApplicationsResult> {
  const supabase = await getSupabase(client);
  const limit = clampLimit(params.limit);
  const month = params.month?.trim() || undefined;
  const jobQuery = sanitizeSearchTerm(params.jobQuery ?? "");

  let dbQuery = supabase
    .from("applications")
    .select("id, full_name, email, status, submitted_at, jobs ( title, department )", {
      count: "exact",
    })
    .order("submitted_at", { ascending: false });

  if (params.status && isApplicationStatus(params.status)) {
    dbQuery = dbQuery.eq("status", params.status);
  }

  if (params.todayOnly) {
    const { start, end } = todayRange();
    dbQuery = dbQuery.gte("submitted_at", start).lte("submitted_at", end);
  } else if (params.thisWeekOnly) {
    const { start, end } = weekRange();
    dbQuery = dbQuery.gte("submitted_at", start).lte("submitted_at", end);
  } else if (month) {
    const range = monthRange(month);
    if (range) {
      dbQuery = dbQuery.gte("submitted_at", range.start).lte("submitted_at", range.end);
    }
  }

  const { data, error, count } = await dbQuery.limit(Math.max(limit, jobQuery ? 100 : limit));
  if (error) throwQueryError("searchApplications", "applications", error);
  logRows("searchApplications", "applications", data?.length ?? 0);

  type Row = {
    id: string;
    full_name: string;
    email: string;
    status: string;
    submitted_at: string;
    jobs: { title: string; department: string | null } | { title: string; department: string | null }[] | null;
  };

  let applications: CopilotApplicationRecord[] = (data ?? []).map((row) => {
    const typed = row as Row;
    const job = Array.isArray(typed.jobs) ? (typed.jobs[0] ?? null) : typed.jobs;
    const status = isApplicationStatus(typed.status) ? typed.status : "new";

    return {
      id: typed.id,
      fullName: typed.full_name,
      email: typed.email,
      jobTitle: job?.title ?? "Unknown role",
      status,
      submittedAt: typed.submitted_at,
      department: job?.department ?? null,
      profilePath: `/hr/applications/${typed.id}`,
    };
  });

  if (jobQuery) {
    const q = jobQuery.toLowerCase();
    applications = applications.filter((a) => a.jobTitle.toLowerCase().includes(q));
  }

  applications = applications.slice(0, limit);
  console.log("Applications loaded:", applications.length);

  return {
    tool: "searchApplications",
    count: applications.length,
    totalMatching: count ?? applications.length,
    month: month ?? undefined,
    applications,
  };
}

export async function searchJobs(
  params: SearchJobsParams = {},
  client?: AnySupabase
): Promise<SearchJobsResult> {
  const supabase = await getSupabase(client);
  const limit = clampLimit(params.limit);
  const query = sanitizeSearchTerm(params.query ?? "");
  const status = normalizeJobStatus(params.status);

  let dbQuery = supabase
    .from("jobs")
    .select("id, title, department, status, location, is_remote, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,department.ilike.%${query}%`);
  }

  if (status) {
    dbQuery = dbQuery.eq("status", status);
  }

  if (params.remoteOnly) {
    dbQuery = dbQuery.eq("is_remote", true);
  }

  const { data, error } = await dbQuery;
  if (error) throwQueryError("searchJobs", "jobs", error);
  logRows("searchJobs", "jobs", data?.length ?? 0);

  const jobs: CopilotJobRecord[] = (data ?? []).map((row) => {
    const typed = row as {
      id: string;
      title: string;
      department: string | null;
      status: string;
      location: string | null;
      is_remote: boolean;
      created_at: string;
    };
    return {
      id: typed.id,
      title: typed.title,
      department: typed.department,
      status: typed.status,
      location: typed.location,
      isRemote: Boolean(typed.is_remote),
      createdAt: typed.created_at,
    };
  });

  console.log("Jobs loaded:", jobs.length);
  return { tool: "searchJobs", count: jobs.length, jobs };
}

export async function searchInterviews(
  params: SearchInterviewsParams = {},
  client?: AnySupabase
): Promise<SearchInterviewsResult> {
  const supabase = await getSupabase(client);
  const limit = clampLimit(params.limit);

  let dbQuery = supabase
    .from("interviews")
    .select(
      `
      id,
      interviewer_name,
      interview_date,
      interview_time,
      status,
      application_id,
      applications ( full_name, jobs ( title ) )
    `
    )
    .order("interview_date", { ascending: true })
    .limit(limit);

  if (params.status && isInterviewStatus(params.status)) {
    dbQuery = dbQuery.eq("status", params.status);
  }

  if (params.todayOnly) {
    const today = new Date().toISOString().slice(0, 10);
    dbQuery = dbQuery.eq("interview_date", today);
  } else if (params.upcomingOnly) {
    const today = new Date().toISOString().slice(0, 10);
    dbQuery = dbQuery.gte("interview_date", today);
  }

  const { data, error } = await dbQuery;
  if (error) throwQueryError("searchInterviews", "interviews", error);
  logRows("searchInterviews", "interviews", data?.length ?? 0);

  type Row = {
    id: string;
    interviewer_name: string;
    interview_date: string;
    interview_time: string;
    status: string;
    application_id: string;
    applications: {
      full_name: string;
      jobs: { title: string } | { title: string }[] | null;
    } | null;
  };

  const interviews: CopilotInterviewRecord[] = (data ?? []).map((row) => {
    const typed = row as unknown as Row;
    const job = typed.applications?.jobs;
    const jobTitle = Array.isArray(job)
      ? (job[0]?.title ?? "Unknown role")
      : (job?.title ?? "Unknown role");
    const status = isInterviewStatus(typed.status) ? typed.status : "scheduled";

    return {
      id: typed.id,
      candidateName: typed.applications?.full_name ?? "Unknown candidate",
      jobTitle,
      interviewDate: typed.interview_date,
      interviewTime: typed.interview_time,
      status,
      interviewerName: typed.interviewer_name,
      applicationPath: `/hr/applications/${typed.application_id}`,
    };
  });

  let waitingCandidates: CopilotApplicationRecord[] | undefined;
  if (params.waitingForInterview) {
    const waiting = await searchApplications({ status: "interview", limit }, supabase);
    waitingCandidates = waiting.applications;
  }

  console.log("Interviews loaded:", interviews.length);
  return {
    tool: "searchInterviews",
    count: interviews.length,
    interviews,
    waitingCandidates,
  };
}

function toFiniteScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function searchAnalysis(
  params: SearchAnalysisParams = {},
  client?: AnySupabase
): Promise<SearchAnalysisResult> {
  try {
    const supabase = await getSupabase(client);
    const topN = clampLimit(params.topN ?? DEFAULT_LIMIT);
    const rawSkill = params.skill?.trim() ?? "";
    const skillFilter =
      rawSkill && !META_FILTER_STOPWORDS.test(rawSkill) && rawSkill.length > 1
        ? rawSkill
        : "";
    const minScore = params.minScore ?? params.minMatchPercent;
    const orderBy = params.orderBy ?? "score";
    const ascending = Boolean(params.ascending);
    const candidateQuery = sanitizeAiListFilter(params.candidateQuery);
    let jobQuery = sanitizeAiListFilter(params.jobQuery);
    console.log("[pipeline] searchResumeAnalysis filters", {
      candidateQuery: candidateQuery || null,
      jobQuery: jobQuery || null,
      skillFilter: skillFilter || null,
      rawCandidateQuery: params.candidateQuery ?? null,
      rawJobQuery: params.jobQuery ?? null,
      rawSkill: params.skill ?? null,
    });

    // Schema: id, candidate_id, application_id, resume_hash, job_title,
    // job_description, analysis_json, score, recommendation, created_at, updated_at
    let data: unknown[] | null = null;
    let error: { message: string } | null = null;

    const embedded = await supabase
      .from("ai_resume_analysis")
      .select(
        `
        id,
        candidate_id,
        application_id,
        job_title,
        score,
        recommendation,
        analysis_json,
        created_at,
        candidate_profiles ( full_name )
      `
      )
      .order(orderBy === "date" ? "created_at" : "score", { ascending })
      .limit(topN * 4);

    data = embedded.data;
    error = embedded.error;

    if (error) {
      console.error("[ai/hr-tools] searchResumeAnalysis embed SQL error:", error);
      const plain = await supabase
        .from("ai_resume_analysis")
        .select(
          "id, candidate_id, application_id, job_title, score, recommendation, analysis_json, created_at"
        )
        .order(orderBy === "date" ? "created_at" : "score", { ascending })
        .limit(topN * 4);
      if (plain.error) {
        throwQueryError("searchAnalysis", "ai_resume_analysis", plain.error);
      }
      data = plain.data;
      error = null;
      console.log("[ai/hr-tools] searchResumeAnalysis fell back to plain select");
    }

    logRows("searchAnalysis", "ai_resume_analysis", data?.length ?? 0);
    console.log("Resume loaded:", data?.length ?? 0);
    console.log(
      "[ai/hr-tools] searchResumeAnalysis sample:",
      data?.[0]
        ? {
            candidate_id: (data[0] as { candidate_id?: string }).candidate_id,
            job_title: (data[0] as { job_title?: string }).job_title,
            score: (data[0] as { score?: unknown }).score,
          }
        : null
    );

    type Row = {
      candidate_id: string;
      application_id: string | null;
      job_title: string | null;
      score: number | string | null;
      recommendation: string | null;
      analysis_json: unknown;
      created_at: string;
      candidate_profiles?: { full_name: string } | { full_name: string }[] | null;
    };

    const analyses: CopilotAnalysisRecord[] = [];
    const nameById = new Map<string, string>();

    // Hydrate names if embed was unavailable
    const needsNameHydration = (data ?? []).some(
      (row) => !(row as Row).candidate_profiles
    );
    if (needsNameHydration) {
      const ids = [
        ...new Set(
          (data ?? [])
            .map((row) => (row as Row).candidate_id)
            .filter((id): id is string => Boolean(id))
        ),
      ];
      if (ids.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("candidate_profiles")
          .select("id, full_name")
          .in("id", ids);
        if (profileError) {
          console.error(
            "[ai/hr-tools] searchResumeAnalysis profile hydrate error:",
            profileError
          );
        } else {
          for (const p of profiles ?? []) {
            const typed = p as { id: string; full_name: string };
            nameById.set(typed.id, typed.full_name);
          }
        }
      }
    }

    const mapRows = (activeJobQuery: string) => {
      const out: CopilotAnalysisRecord[] = [];
      const jobQueryLower = activeJobQuery.toLowerCase();
      for (const raw of data ?? []) {
        try {
          const row = raw as Row;
          const score = toFiniteScore(row.score);
          if (minScore != null && Number.isFinite(minScore) && score < minScore) continue;

          const analysis = normalizeResumeAnalysis(row.analysis_json ?? {});
          const skills = [...analysis.skills, ...analysis.strengths];

          if (skillFilter && !skillMatches(skills, skillFilter)) continue;
          const jobTitle = row.job_title?.trim() || "Unknown role";
          if (jobQueryLower && !jobTitle.toLowerCase().includes(jobQueryLower)) continue;

          const profile = Array.isArray(row.candidate_profiles)
            ? (row.candidate_profiles[0] ?? null)
            : (row.candidate_profiles ?? null);
          const candidateName =
            profile?.full_name?.trim() ||
            nameById.get(row.candidate_id) ||
            "Unknown candidate";

          if (
            candidateQuery &&
            !candidateName.toLowerCase().includes(candidateQuery.toLowerCase())
          ) {
            continue;
          }

          const overallScore =
            analysis.overallScore > 0 ? analysis.overallScore : score;

          out.push({
            candidateId: row.candidate_id,
            candidateName,
            applicationId: row.application_id,
            jobTitle,
            score: overallScore,
            overallScore,
            technicalScore: analysis.technicalScore,
            experienceScore: analysis.experienceScore,
            educationScore: analysis.educationScore,
            communicationScore: analysis.communicationScore,
            skillMatch: analysis.skillMatch,
            matchPercent: analysis.skillMatch,
            recommendation: analysis.recommendation || row.recommendation || "",
            recommendationLabel: analysis.recommendationLabel,
            skills: analysis.skills,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            missingSkills: analysis.missingSkills,
            summary: analysis.summary,
            experience: analysis.experience,
            education: analysis.education,
            confidence: analysis.confidence,
            rank: null,
            profilePath: `/hr/candidates/${row.candidate_id}`,
          });

          if (out.length >= topN) break;
        } catch (mapError) {
          console.error("[ai/hr-tools] searchResumeAnalysis row mapping error:", mapError);
          if (mapError instanceof Error) console.error(mapError.stack);
          throw new Error(
            `searchResumeAnalysis mapping failed: ${
              mapError instanceof Error ? mapError.message : String(mapError)
            }`,
            { cause: mapError }
          );
        }
      }
      return out;
    };

    analyses.push(...mapRows(jobQuery));
    // Role-fit / wrong job-title filters often wipe rows — fall back to unfiltered
    // (or candidate-only) analysis so the agent can still answer.
    if (analyses.length === 0 && jobQuery) {
      console.log(
        "[pipeline] searchResumeAnalysis retry without job filter",
        { candidateQuery, jobQuery }
      );
      analyses.push(...mapRows(""));
    }

    if (params.focus === "strengths") {
      for (const item of analyses) {
        item.weaknesses = [];
        item.missingSkills = [];
      }
    } else if (params.focus === "weaknesses") {
      for (const item of analyses) {
        item.strengths = [];
        item.missingSkills = [];
      }
    } else if (params.focus === "missingSkills") {
      for (const item of analyses) {
        item.strengths = [];
        item.weaknesses = [];
      }
    } else if (params.focus === "recommendation") {
      for (const item of analyses) {
        item.strengths = [];
        item.weaknesses = [];
        item.missingSkills = [];
      }
    }

    if (analyses.length > 0) {
      const candidateIds = analyses.map((a) => a.candidateId);
      const { data: rankingRows, error: rankingError } = await supabase
        .from("ai_candidate_ranking")
        .select("candidate_id, rank, score")
        .in("candidate_id", candidateIds);

      if (rankingError) {
        console.error(
          "[ai/hr-tools] searchResumeAnalysis ranking enrich SQL error:",
          rankingError
        );
      } else {
        console.log("Ranking loaded:", rankingRows?.length ?? 0);
        const rankMap = new Map<string, number>();
        for (const r of (rankingRows ?? []) as { candidate_id: string; rank: number }[]) {
          const existing = rankMap.get(r.candidate_id);
          if (existing == null || r.rank < existing) rankMap.set(r.candidate_id, r.rank);
        }
        for (const item of analyses) {
          const rank = rankMap.get(item.candidateId);
          if (rank != null) item.rank = rank;
        }
      }
    } else {
      console.log("Ranking loaded:", 0);
    }

    const result: SearchAnalysisResult = {
      tool: "searchResumeAnalysis",
      count: analyses.length,
      analyses,
    };
    try {
      JSON.stringify(result);
    } catch (serError) {
      console.error("[ai/hr-tools] searchResumeAnalysis JSON serialization failed:", serError);
      throw serError;
    }
    return result;
  } catch (error) {
    console.error("[ai/hr-tools] searchResumeAnalysis failed:", error);
    if (error instanceof Error) console.error(error.stack);
    throw error;
  }
}

/** Alias used by the intent router. */
export async function searchResumeAnalysis(
  params: SearchAnalysisParams = {},
  client?: AnySupabase
): Promise<SearchAnalysisResult> {
  return searchAnalysis(params, client);
}

export async function searchRanking(
  params: SearchRankingParams = {},
  client?: AnySupabase
): Promise<SearchRankingResult> {
  try {
    const supabase = await getSupabase(client);
    const topN = clampLimit(params.topN ?? DEFAULT_LIMIT);
    const jobQuery = sanitizeAiListFilter(params.jobQuery);
    const candidateQuery = sanitizeAiListFilter(params.candidateQuery);
    const orderBy = params.orderBy ?? "score";
    const ascending =
      params.ascending ??
      (orderBy === "rank" ? true : false);

    console.log("[pipeline] searchAIRanking() start", {
      topN,
      orderBy,
      ascending,
      jobQuery: jobQuery || null,
      candidateQuery: candidateQuery || null,
      rawJobQuery: params.jobQuery ?? null,
      rawCandidateQuery: params.candidateQuery ?? null,
    });

    // Schema: id, job_id, candidate_id, rank, score, reason, created_at
    let data: unknown[] | null = null;

    const embedded = await supabase
      .from("ai_candidate_ranking")
      .select(
        `
        candidate_id,
        job_id,
        rank,
        score,
        reason,
        candidate_profiles ( full_name ),
        jobs ( title )
      `
      )
      .order(orderBy === "rank" ? "rank" : "score", { ascending })
      .limit(topN * 3);

    if (embedded.error) {
      console.error("[ai/hr-tools] searchAIRanking embed SQL error:", embedded.error);
      const plain = await supabase
        .from("ai_candidate_ranking")
        .select("candidate_id, job_id, rank, score, reason")
        .order(orderBy === "rank" ? "rank" : "score", { ascending })
        .limit(topN * 3);
      if (plain.error) {
        throwQueryError("searchRanking", "ai_candidate_ranking", plain.error);
      }
      data = plain.data;
      console.log("[ai/hr-tools] searchAIRanking fell back to plain select");
    } else {
      data = embedded.data;
    }

    logRows("searchRanking", "ai_candidate_ranking", data?.length ?? 0);
    console.log("[pipeline] searchAIRanking() SQL rows ->", data?.length ?? 0);
    console.log("Ranking loaded:", data?.length ?? 0);
    console.log(
      "[ai/hr-tools] searchAIRanking sample:",
      data?.[0]
        ? {
            candidate_id: (data[0] as { candidate_id?: string }).candidate_id,
            job_id: (data[0] as { job_id?: string }).job_id,
            rank: (data[0] as { rank?: unknown }).rank,
            score: (data[0] as { score?: unknown }).score,
          }
        : null
    );

    type Row = {
      candidate_id: string;
      job_id: string;
      rank: number | null;
      score: number | string | null;
      reason: string | null;
      candidate_profiles?: { full_name: string } | { full_name: string }[] | null;
      jobs?: { title: string } | { title: string }[] | null;
    };

    const nameById = new Map<string, string>();
    const jobTitleById = new Map<string, string>();
    const needsHydration = (data ?? []).some(
      (row) => !(row as Row).candidate_profiles || !(row as Row).jobs
    );
    if (needsHydration && (data?.length ?? 0) > 0) {
      const candidateIds = [
        ...new Set((data as Row[]).map((r) => r.candidate_id).filter(Boolean)),
      ];
      const jobIds = [...new Set((data as Row[]).map((r) => r.job_id).filter(Boolean))];
      const [profilesRes, jobsRes] = await Promise.all([
        candidateIds.length
          ? supabase.from("candidate_profiles").select("id, full_name").in("id", candidateIds)
          : Promise.resolve({ data: [], error: null }),
        jobIds.length
          ? supabase.from("jobs").select("id, title").in("id", jobIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (profilesRes.error) {
        console.error("[ai/hr-tools] searchAIRanking profile hydrate error:", profilesRes.error);
      }
      if (jobsRes.error) {
        console.error("[ai/hr-tools] searchAIRanking job hydrate error:", jobsRes.error);
      }
      for (const p of profilesRes.data ?? []) {
        const typed = p as { id: string; full_name: string };
        nameById.set(typed.id, typed.full_name);
      }
      for (const j of jobsRes.data ?? []) {
        const typed = j as { id: string; title: string };
        jobTitleById.set(typed.id, typed.title);
      }
    }

    const rankings: CopilotRankingRecord[] = [];

    for (const raw of data ?? []) {
      try {
        const row = raw as Row;
        const profile = Array.isArray(row.candidate_profiles)
          ? (row.candidate_profiles[0] ?? null)
          : (row.candidate_profiles ?? null);
        const job = Array.isArray(row.jobs) ? (row.jobs[0] ?? null) : (row.jobs ?? null);
        const jobTitle =
          job?.title?.trim() || jobTitleById.get(row.job_id) || "Unknown role";
        const candidateName =
          profile?.full_name?.trim() ||
          nameById.get(row.candidate_id) ||
          "Unknown candidate";

        if (jobQuery && !jobTitle.toLowerCase().includes(jobQuery.toLowerCase())) {
          continue;
        }
        if (
          candidateQuery &&
          !candidateName.toLowerCase().includes(candidateQuery.toLowerCase())
        ) {
          continue;
        }

        rankings.push({
          candidateId: row.candidate_id,
          candidateName,
          jobId: row.job_id,
          jobTitle,
          score: toFiniteScore(row.score),
          rank: typeof row.rank === "number" && Number.isFinite(row.rank) ? row.rank : rankings.length + 1,
          reason: row.reason?.trim() || "No reason provided",
          profilePath: `/hr/candidates/${row.candidate_id}`,
        });

        if (rankings.length >= topN) break;
      } catch (mapError) {
        console.error("[ai/hr-tools] searchAIRanking row mapping error:", mapError);
        if (mapError instanceof Error) console.error(mapError.stack);
        throw new Error(
          `searchAIRanking mapping failed: ${
            mapError instanceof Error ? mapError.message : String(mapError)
          }`,
          { cause: mapError }
        );
      }
    }

    // Fallback: derive ranking from ai_resume_analysis when ranking table is empty.
    if (rankings.length === 0) {
      console.log("Ranking loaded: 0 — falling back to ai_resume_analysis scores");
      const analysis = await searchAnalysis(
        {
          topN,
          jobQuery: params.jobQuery,
          candidateQuery: params.candidateQuery,
          orderBy: "score",
          ascending,
        },
        supabase
      );

      const derived = analysis.analyses.map((item, index) => ({
        candidateId: item.candidateId,
        candidateName: item.candidateName,
        jobId: "",
        jobTitle: item.jobTitle,
        score: toFiniteScore(item.overallScore),
        rank: index + 1,
        reason:
          item.recommendationLabel ||
          item.recommendation ||
          "Derived from resume analysis score",
        profilePath: item.profilePath,
      }));

      const derivedResult: SearchRankingResult = {
        tool: "searchAIRanking",
        count: derived.length,
        rankings: derived,
      };
      JSON.stringify(derivedResult);
      return derivedResult;
    }

    const result: SearchRankingResult = {
      tool: "searchAIRanking",
      count: rankings.length,
      rankings,
    };
    console.log(
      "[pipeline] searchAIRanking() mapped rankings ->",
      result.count,
      result.rankings.map((r) => `${r.rank}:${r.candidateName}:${r.score}`)
    );
    try {
      JSON.stringify(result);
      console.log("[pipeline] searchAIRanking() JSON.stringify OK");
    } catch (serError) {
      console.error("[ai/hr-tools] searchAIRanking JSON serialization failed:", serError);
      throw serError;
    }
    return result;
  } catch (error) {
    console.error("[ai/hr-tools] searchAIRanking failed:", error);
    if (error instanceof Error) console.error(error.stack);
    throw error;
  }
}

export type {
  CompareDecisionResult as CompareCandidatesResult,
  HiringRecommendationResult,
  SkillGapResult,
  InterviewPriorityResult,
  SalaryRecommendationResult,
  RiskAnalysisResult,
  ExplainDecisionResult,
  DecisionReportResult,
} from "@/lib/ai/hiring-decision-tools";

export {
  compareCandidatesDecision,
  compareCandidatesDecision as compareCandidates,
  getHiringRecommendation,
  analyzeSkillGaps,
  getInterviewPriority,
  getSalaryRecommendation,
  analyzeHiringRisks,
  explainAIDecision,
  generateDecisionReport,
};

/** Alias used by the intent router. */
export async function searchAIRanking(
  params: SearchRankingParams = {},
  client?: AnySupabase
): Promise<SearchRankingResult> {
  return searchRanking(params, client);
}

export async function getDashboardStats(
  _params: Record<string, unknown> = {},
  client?: AnySupabase
): Promise<GetDashboardStatsResult> {
  const supabase = await getSupabase(client);
  const today = new Date().toISOString().slice(0, 10);
  const { start: weekStart, end: weekEnd } = weekRange();

  const [
    candidates,
    jobs,
    interviews,
    applications,
    openJobs,
    scheduledInterviews,
    todaysInterviews,
    thisWeekApps,
    shortlisted,
    hired,
    rejected,
    inInterview,
    pendingReview,
  ] = await Promise.all([
    supabase.from("candidate_profiles").select("id", { count: "exact", head: true }),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("interviews").select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled"),
    supabase
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .eq("interview_date", today),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("submitted_at", weekStart)
      .lte("submitted_at", weekEnd),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "ai_shortlisted"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "hired"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "interview"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "hr_review"]),
  ]);

  const errors = [
    candidates.error,
    jobs.error,
    interviews.error,
    applications.error,
    openJobs.error,
    scheduledInterviews.error,
    todaysInterviews.error,
    thisWeekApps.error,
    shortlisted.error,
    hired.error,
    rejected.error,
    inInterview.error,
    pendingReview.error,
  ].filter(Boolean);

  if (errors[0]) {
    throwQueryError("getDashboardStats", "aggregate", errors[0] as { message: string });
  }

  const stats: CopilotDashboardStats = {
    totalCandidates: candidates.count ?? 0,
    totalJobs: jobs.count ?? 0,
    totalInterviews: interviews.count ?? 0,
    totalApplications: applications.count ?? 0,
    openJobs: openJobs.count ?? 0,
    scheduledInterviews: scheduledInterviews.count ?? 0,
    todaysInterviews: todaysInterviews.count ?? 0,
    thisWeeksApplications: thisWeekApps.count ?? 0,
    totalShortlisted: shortlisted.count ?? 0,
    totalHired: hired.count ?? 0,
    totalRejected: rejected.count ?? 0,
    totalInInterview: inInterview.count ?? 0,
    totalPendingReview: pendingReview.count ?? 0,
  };

  logCopilotDebug("Supabase Query", { tool: "getDashboardStats", stats });
  console.log("Dashboard stats loaded:", stats);

  return {
    tool: "getDashboardStats",
    count:
      stats.totalCandidates +
      stats.totalJobs +
      stats.totalInterviews +
      stats.totalApplications,
    stats,
  };
}

export async function getCandidateProfile(
  params: GetCandidateProfileParams = {},
  client?: AnySupabase
): Promise<GetCandidateProfileResult> {
  const supabase = await getSupabase(client);
  const limit = clampLimit(params.limit ?? 5);
  const query = sanitizeSearchTerm(params.query ?? "");

  let appQuery = supabase
    .from("applications")
    .select(
      "id, full_name, email, phone, candidate_id, status, submitted_at, years_of_experience, jobs ( title )"
    )
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (query) {
    appQuery = appQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data: appData, error: appError } = await appQuery;
  if (appError) throwQueryError("getCandidateProfile", "applications", appError);
  logRows("getCandidateProfile", "applications", appData?.length ?? 0);

  type AppRow = {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    candidate_id: string | null;
    status: string;
    submitted_at: string;
    years_of_experience: number | null;
    jobs: { title: string } | { title: string }[] | null;
  };

  const apps = (appData ?? []) as AppRow[];
  const grouped = new Map<string, AppRow[]>();

  for (const app of apps) {
    const key = app.candidate_id ?? `email:${app.email.toLowerCase()}`;
    const list = grouped.get(key) ?? [];
    list.push(app);
    grouped.set(key, list);
  }

  const profiles: CopilotCandidateProfile[] = [];

  for (const [, group] of grouped) {
    if (profiles.length >= limit) break;
    const primary = group[0];
    const job = Array.isArray(primary.jobs) ? primary.jobs[0] : primary.jobs;

    const appIds = group.map((g) => g.id);
    const [skillsRes, eduRes, resumeResult, detailsResult] = await Promise.all([
      supabase.from("skills").select("skill_name").in("application_id", appIds),
      supabase
        .from("education")
        .select("institution_name, degree, field_of_study")
        .in("application_id", appIds),
      primary.candidate_id
        ? supabase
            .from("candidate_resumes")
            .select("file_name, uploaded_at")
            .eq("candidate_id", primary.candidate_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      primary.candidate_id
        ? supabase
            .from("candidate_profile_details")
            .select("years_of_experience, city, province, country, skills")
            .eq("candidate_id", primary.candidate_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (skillsRes.error) throwQueryError("getCandidateProfile", "skills", skillsRes.error);
    if (eduRes.error) throwQueryError("getCandidateProfile", "education", eduRes.error);
    if (resumeResult.error) {
      throwQueryError("getCandidateProfile", "candidate_resumes", resumeResult.error);
    }
    if (detailsResult.error) {
      throwQueryError("getCandidateProfile", "candidate_profile_details", detailsResult.error);
    }

    const skillRows = skillsRes.data;
    const eduRows = eduRes.data;

    const details = detailsResult.data as {
      years_of_experience: number | null;
      city: string | null;
      province: string | null;
      country: string | null;
      skills: string[] | null;
    } | null;

    const locationParts = [details?.city, details?.province, details?.country].filter(Boolean);
    const resume = resumeResult.data as { file_name: string; uploaded_at: string } | null;
    const profileSkills = Array.isArray(details?.skills)
      ? details.skills.map((s) => s.trim()).filter(Boolean)
      : [];
    const applicationSkills = (skillRows ?? []).map(
      (s) => (s as { skill_name: string }).skill_name
    );

    profiles.push({
      candidateId: primary.candidate_id,
      fullName: primary.full_name,
      email: primary.email,
      phone: primary.phone,
      yearsOfExperience: details?.years_of_experience ?? primary.years_of_experience ?? null,
      location: locationParts.length > 0 ? locationParts.join(", ") : null,
      skills: [...new Set([...profileSkills, ...applicationSkills])],
      education: (eduRows ?? []).map((e) => {
        const typed = e as {
          institution_name: string;
          degree: string;
          field_of_study: string | null;
        };
        return {
          institution: typed.institution_name,
          degree: typed.degree,
          fieldOfStudy: typed.field_of_study,
        };
      }),
      resume: resume
        ? { fileName: resume.file_name, uploadedAt: resume.uploaded_at }
        : null,
      recentApplications: group.slice(0, 5).map((g) => {
        const gJob = Array.isArray(g.jobs) ? g.jobs[0] : g.jobs;
        return {
          id: g.id,
          jobTitle: gJob?.title ?? job?.title ?? "Unknown role",
          status: g.status,
          submittedAt: g.submitted_at,
        };
      }),
      profilePath: primary.candidate_id
        ? `/hr/candidates/${primary.candidate_id}`
        : `/hr/applications/${primary.id}`,
    });
  }

  console.log("Profiles loaded:", profiles.length);
  return { tool: "getCandidateProfile", count: profiles.length, profiles };
}

export async function matchJobCandidates(
  params: MatchJobCandidatesParams = {},
  client?: AnySupabase
): Promise<MatchJobCandidatesResult> {
  const supabase = await getSupabase(client);
  const topN = clampLimit(params.topN ?? 5);
  const jobQuery = sanitizeSearchTerm(params.jobQuery ?? "developer");

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, department")
    .ilike("title", `%${jobQuery}%`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (jobsError) throwQueryError("matchJobCandidates", "jobs", jobsError);
  logRows("matchJobCandidates", "jobs", jobs?.length ?? 0);

  type JobRow = { id: string; title: string; department: string | null };
  const jobRows = (jobs ?? []) as JobRow[];

  // Prefer exact title match, then a job that already has ranking or applicants
  let job: JobRow | null =
    jobRows.find((j) => j.title.toLowerCase() === jobQuery.toLowerCase()) ?? null;

  if (!job && jobRows.length > 0) {
    for (const candidateJob of jobRows) {
      const [{ count: rankCount }, { count: appCount }] = await Promise.all([
        supabase
          .from("ai_candidate_ranking")
          .select("id", { count: "exact", head: true })
          .eq("job_id", candidateJob.id),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("job_id", candidateJob.id),
      ]);
      if ((rankCount ?? 0) > 0 || (appCount ?? 0) > 0) {
        job = candidateJob;
        break;
      }
    }
    job = job ?? jobRows[0] ?? null;
  }

  if (!job) {
    // Fallback: ranking/analysis filtered by job title text
    const [ranking, analysis] = await Promise.all([
      searchRanking({ topN, jobQuery, orderBy: "score" }, supabase),
      searchAnalysis({ topN, jobQuery, orderBy: "score" }, supabase),
    ]);
    const apps =
      ranking.count + analysis.count === 0
        ? await searchApplications({ jobQuery, limit: topN }, supabase)
        : null;

    return {
      tool: "matchJobCandidates",
      count: ranking.count + analysis.count + (apps?.count ?? 0),
      job: null,
      criteria: [],
      rankings: ranking.rankings,
      analyses: analysis.analyses,
      applicants: apps?.applications ?? [],
    };
  }

  const { data: criteriaRows, error: criteriaError } = await supabase
    .from("job_ai_criteria")
    .select("criteria_name, weight, is_required")
    .eq("job_id", job.id);

  if (criteriaError) throwQueryError("matchJobCandidates", "job_ai_criteria", criteriaError);

  const { data: rankingRows, error: rankingError } = await supabase
    .from("ai_candidate_ranking")
    .select(
      `
      candidate_id,
      job_id,
      rank,
      score,
      reason,
      candidate_profiles ( full_name ),
      jobs ( title )
    `
    )
    .eq("job_id", job.id)
    .order("rank", { ascending: true })
    .limit(topN);

  if (rankingError) throwQueryError("matchJobCandidates", "ai_candidate_ranking", rankingError);
  logRows("matchJobCandidates", "ai_candidate_ranking", rankingRows?.length ?? 0);
  console.log("Ranking loaded:", rankingRows?.length ?? 0);

  type RankRow = {
    candidate_id: string;
    job_id: string;
    rank: number;
    score: number | string;
    reason: string;
    candidate_profiles: { full_name: string } | { full_name: string }[] | null;
    jobs: { title: string } | { title: string }[] | null;
  };

  const rankings: CopilotRankingRecord[] = ((rankingRows ?? []) as RankRow[]).map((row) => {
    const profile = Array.isArray(row.candidate_profiles)
      ? (row.candidate_profiles[0] ?? null)
      : row.candidate_profiles;
    const jobRel = Array.isArray(row.jobs) ? (row.jobs[0] ?? null) : row.jobs;
    return {
      candidateId: row.candidate_id,
      candidateName: profile?.full_name ?? "Unknown candidate",
      jobId: row.job_id,
      jobTitle: jobRel?.title ?? job.title,
      score: typeof row.score === "number" ? row.score : Number(row.score),
      rank: row.rank,
      reason: row.reason,
      profilePath: `/hr/candidates/${row.candidate_id}`,
    };
  });

  const analysis = await searchAnalysis(
    { topN, jobQuery: job.title, orderBy: "score" },
    supabase
  );

  // Live fallback: applicants for this exact job when AI ranking/analysis is empty
  let applicantFallback: CopilotApplicationRecord[] = [];
  if (rankings.length === 0 && analysis.count === 0) {
    const { data: appRows, error: appError } = await supabase
      .from("applications")
      .select("id, full_name, email, status, submitted_at, jobs ( title, department )")
      .eq("job_id", job.id)
      .order("submitted_at", { ascending: false })
      .limit(topN);

    if (appError) throwQueryError("matchJobCandidates", "applications", appError);
    logRows("matchJobCandidates", "applications", appRows?.length ?? 0);

    applicantFallback = ((appRows ?? []) as Array<{
      id: string;
      full_name: string;
      email: string;
      status: string;
      submitted_at: string;
      jobs: { title: string; department: string | null } | { title: string; department: string | null }[] | null;
    }>).map((row) => {
      const jobRel = Array.isArray(row.jobs) ? (row.jobs[0] ?? null) : row.jobs;
      const status = isApplicationStatus(row.status) ? row.status : "new";
      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        jobTitle: jobRel?.title ?? job.title,
        status,
        submittedAt: row.submitted_at,
        department: jobRel?.department ?? job.department,
        profilePath: `/hr/applications/${row.id}`,
      };
    });
  }

  return {
    tool: "matchJobCandidates",
    count: rankings.length + analysis.count + applicantFallback.length,
    job,
    criteria: (criteriaRows ?? []).map((c) => {
      const typed = c as { criteria_name: string; weight: number; is_required: boolean };
      return {
        name: typed.criteria_name,
        weight: Number(typed.weight),
        required: Boolean(typed.is_required),
      };
    }),
    rankings,
    analyses: analysis.analyses,
    applicants: applicantFallback,
  };
}

export type CopilotToolName =
  | "searchCandidates"
  | "searchApplications"
  | "searchJobs"
  | "searchInterviews"
  | "searchAnalysis"
  | "searchResumeAnalysis"
  | "searchRanking"
  | "searchAIRanking"
  | "compareCandidates"
  | "getHiringRecommendation"
  | "analyzeSkillGaps"
  | "getInterviewPriority"
  | "getSalaryRecommendation"
  | "analyzeHiringRisks"
  | "explainAIDecision"
  | "generateDecisionReport"
  | "getHRAnalytics"
  | "getPredictions"
  | "getSmartAlerts"
  | "generateAgentEmail"
  | "generateAgentReport"
  | "getDashboardStats"
  | "getCandidateProfile"
  | "matchJobCandidates";

export type CopilotToolCall = {
  tool: CopilotToolName;
  params?: Record<string, unknown>;
};

export type CopilotToolResult =
  | SearchCandidatesResult
  | SearchApplicationsResult
  | SearchJobsResult
  | SearchInterviewsResult
  | SearchAnalysisResult
  | SearchRankingResult
  | HiringDecisionToolResult
  | AgentToolResult
  | GetDashboardStatsResult
  | GetCandidateProfileResult
  | MatchJobCandidatesResult;

export async function executeCopilotTool(
  call: CopilotToolCall,
  client?: AnySupabase
): Promise<CopilotToolResult> {
  const params = call.params ?? {};
  logCopilotDebug("Executed Tool", { tool: call.tool, params });

  switch (call.tool) {
    case "searchCandidates":
      return searchCandidates(params as SearchCandidatesParams, client);
    case "searchApplications":
      return searchApplications(params as SearchApplicationsParams, client);
    case "searchJobs":
      return searchJobs(params as SearchJobsParams, client);
    case "searchInterviews":
      return searchInterviews(params as SearchInterviewsParams, client);
    case "searchAnalysis":
    case "searchResumeAnalysis":
      return searchResumeAnalysis(params as SearchAnalysisParams, client);
    case "searchRanking":
    case "searchAIRanking":
      return searchAIRanking(params as SearchRankingParams, client);
    case "compareCandidates":
      return compareCandidatesDecision({
        names: (params as CompareCandidatesParams).names,
        topN: typeof params.topN === "number" ? params.topN : undefined,
        jobQuery: typeof params.jobQuery === "string" ? params.jobQuery : undefined,
      }, client);
    case "getHiringRecommendation":
      return getHiringRecommendation(
        params as { candidateQuery?: string; jobQuery?: string },
        client
      );
    case "analyzeSkillGaps":
      return analyzeSkillGaps(
        params as {
          mode?: "missing" | "knows" | "lacks" | "weak";
          skill?: string;
          candidateQuery?: string;
          jobQuery?: string;
          topN?: number;
        },
        client
      );
    case "getInterviewPriority":
      return getInterviewPriority(
        params as { jobQuery?: string; topN?: number },
        client
      );
    case "getSalaryRecommendation":
      return getSalaryRecommendation(
        params as { candidateQuery?: string; jobQuery?: string; topN?: number },
        client
      );
    case "analyzeHiringRisks":
      return analyzeHiringRisks(
        params as { candidateQuery?: string; jobQuery?: string; topN?: number },
        client
      );
    case "explainAIDecision":
      return explainAIDecision(
        params as { candidateQuery?: string; jobQuery?: string; topN?: number },
        client
      );
    case "generateDecisionReport":
      return generateDecisionReport(
        params as { candidateQuery?: string; jobQuery?: string; topN?: number },
        client
      );
    case "getHRAnalytics":
      return getHRAnalytics(params, client);
    case "getPredictions":
      return getPredictions(
        params as { jobQuery?: string; topN?: number },
        client
      );
    case "getSmartAlerts":
      return getSmartAlerts(params, client);
    case "generateAgentEmail":
      return generateAgentEmail(
        params as {
          emailType?: string;
          candidateQuery?: string;
          jobQuery?: string;
          companyName?: string;
          tone?: string;
        },
        client
      );
    case "generateAgentReport":
      return generateAgentReport(
        params as { reportType?: string; jobQuery?: string },
        client
      );
    case "getDashboardStats":
      return getDashboardStats(params, client);
    case "getCandidateProfile":
      return getCandidateProfile(params as GetCandidateProfileParams, client);
    case "matchJobCandidates":
      return matchJobCandidates(params as MatchJobCandidatesParams, client);
    default: {
      const exhaustive: never = call.tool;
      throw new Error(`[ai/hr-tools] Unknown tool: ${String(exhaustive)}`);
    }
  }
}

function toolResultRowCount(result: CopilotToolResult): number {
  switch (result.tool) {
    case "searchAIRanking":
    case "searchRanking":
      return result.rankings?.length ?? result.count ?? 0;
    case "searchResumeAnalysis":
    case "searchAnalysis":
      return result.analyses?.length ?? result.count ?? 0;
    case "searchCandidates":
      return result.candidates?.length ?? result.count ?? 0;
    case "searchApplications":
      return result.applications?.length ?? result.count ?? 0;
    case "searchJobs":
      return result.jobs?.length ?? result.count ?? 0;
    case "searchInterviews":
      return result.interviews?.length ?? result.count ?? 0;
    case "compareCandidates":
      return result.comparisonTable?.length ?? result.count ?? 0;
    case "matchJobCandidates":
      return (
        (result.rankings?.length ?? 0) +
        (result.analyses?.length ?? 0) +
        (result.applicants?.length ?? 0)
      );
    case "getHiringRecommendation":
      if (result.formattedReport || result.decision != null) return Math.max(1, result.count ?? 0);
      return result.count ?? 0;
    case "getDashboardStats":
      return (
        result.stats.totalCandidates +
        result.stats.totalJobs +
        result.stats.totalApplications +
        result.stats.totalInterviews
      );
    case "generateAgentEmail":
      return result.draft ? Math.max(1, result.count ?? 0) : 0;
    default:
      return "count" in result && typeof result.count === "number" ? result.count : 0;
  }
}

/** True when tool payloads contain no usable HR records. */
export function isEmptyToolContext(results: CopilotToolResult[]): boolean {
  if (results.length === 0) return true;

  const counts = results.map((r) => ({
    tool: r.tool,
    rows: toolResultRowCount(r),
  }));
  console.log("[pipeline] isEmptyToolContext() row counts ->", counts);

  // Prefer array lengths over stale/mismatched count fields.
  return counts.every((c) => c.rows === 0);
}
