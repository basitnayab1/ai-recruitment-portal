import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { generateHREmail } from "@/lib/ai/email-generator";
import {
  isEmailTone,
  isEmailType,
  type EmailTone,
  type EmailType,
  type GeneratedEmail,
} from "@/lib/ai/types";
import { logCopilotDebug } from "@/lib/ai/copilot-debug";
import { sanitizeSearchTerm } from "@/lib/hr/search/constants";

type AnySupabase = SupabaseClient;

async function getSupabase(client?: AnySupabase): Promise<AnySupabase> {
  if (client) return client;
  return (await createClient()) as unknown as AnySupabase;
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

function monthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

export type HRAnalyticsResult = {
  tool: "getHRAnalytics";
  count: number;
  analytics: {
    applicationsThisWeek: number;
    applicationsThisMonth: number;
    openPositions: number;
    closedPositions: number;
    draftPositions: number;
    totalApplications: number;
    totalCandidates: number;
    totalInterviews: number;
    averageAIScore: number | null;
    averageInterviewCountPerHire: number | null;
    averageHiringTimeDays: number | null;
    mostAppliedJob: { title: string; count: number } | null;
    leastAppliedJob: { title: string; count: number } | null;
    topDepartments: Array<{ department: string; jobCount: number; applicationCount: number }>;
    hiringTrends: Array<{ month: string; applications: number; hires: number }>;
  };
};

export type PredictionsResult = {
  tool: "getPredictions";
  count: number;
  predictions: Array<{
    jobId: string;
    jobTitle: string;
    hiringDifficulty: "Low" | "Medium" | "High";
    estimatedDaysToFill: number;
    candidateAvailability: "Low" | "Medium" | "High";
    probabilityOfHiringPercent: number;
    skillShortages: string[];
    basis: string[];
  }>;
};

export type SmartAlertsResult = {
  tool: "getSmartAlerts";
  count: number;
  alerts: Array<{
    severity: "info" | "warning" | "critical";
    type: string;
    message: string;
    relatedPath?: string;
  }>;
};

export type AgentEmailResult = {
  tool: "generateAgentEmail";
  count: number;
  emailType: EmailType | null;
  draft: GeneratedEmail | null;
  context: {
    candidateName: string | null;
    jobTitle: string | null;
    interviewDate: string | null;
    interviewTime: string | null;
    companyName: string | null;
    hrName: string | null;
    missingFields: string[];
  };
};

export type AgentReportResult = {
  tool: "generateAgentReport";
  count: number;
  reportType: string;
  report: {
    title: string;
    sections: Array<{ heading: string; bullets: string[] }>;
    generatedAt: string;
  };
};

/** HR analytics from live Supabase aggregates. */
export async function getHRAnalytics(
  _params: Record<string, unknown> = {},
  client?: AnySupabase
): Promise<HRAnalyticsResult> {
  const supabase = await getSupabase(client);
  const week = weekRange();
  const month = monthRange();

  const [
    appsWeek,
    appsMonth,
    jobs,
    appsAll,
    candidates,
    interviews,
    analyses,
    hiredApps,
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("submitted_at", week.start)
      .lte("submitted_at", week.end),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("submitted_at", month.start)
      .lte("submitted_at", month.end),
    supabase.from("jobs").select("id, title, department, status"),
    supabase.from("applications").select("id, job_id, status, submitted_at, updated_at"),
    supabase.from("candidate_profiles").select("id", { count: "exact", head: true }),
    supabase.from("interviews").select("id", { count: "exact", head: true }),
    supabase.from("ai_resume_analysis").select("score").limit(500),
    supabase
      .from("applications")
      .select("submitted_at, updated_at")
      .eq("status", "hired")
      .limit(200),
  ]);

  logCopilotDebug("Database Queries", {
    tool: "getHRAnalytics",
    jobs: jobs.data?.length ?? 0,
    applications: appsAll.data?.length ?? 0,
    analyses: analyses.data?.length ?? 0,
  });

  const jobRows = (jobs.data ?? []) as Array<{
    id: string;
    title: string;
    department: string | null;
    status: string;
  }>;
  const appRows = (appsAll.data ?? []) as Array<{
    id: string;
    job_id: string;
    status: string;
    submitted_at: string;
    updated_at: string;
  }>;

  const countsByJob = new Map<string, number>();
  const appsByDept = new Map<string, number>();
  const jobsByDept = new Map<string, number>();
  const trendMap = new Map<string, { applications: number; hires: number }>();

  for (const job of jobRows) {
    const dept = job.department?.trim() || "Unspecified";
    jobsByDept.set(dept, (jobsByDept.get(dept) ?? 0) + 1);
  }

  for (const app of appRows) {
    countsByJob.set(app.job_id, (countsByJob.get(app.job_id) ?? 0) + 1);
    const job = jobRows.find((j) => j.id === app.job_id);
    const dept = job?.department?.trim() || "Unspecified";
    appsByDept.set(dept, (appsByDept.get(dept) ?? 0) + 1);

    const monthKey = app.submitted_at.slice(0, 7);
    const bucket = trendMap.get(monthKey) ?? { applications: 0, hires: 0 };
    bucket.applications += 1;
    if (app.status === "hired") bucket.hires += 1;
    trendMap.set(monthKey, bucket);
  }

  const rankedJobs = [...countsByJob.entries()]
    .map(([jobId, count]) => ({
      title: jobRows.find((j) => j.id === jobId)?.title ?? "Unknown role",
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const scores = (analyses.data ?? [])
    .map((r) => Number((r as { score: number | string }).score))
    .filter((n) => Number.isFinite(n));
  const averageAIScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

  const hireDeltas = ((hiredApps.data ?? []) as Array<{ submitted_at: string; updated_at: string }>)
    .map((row) => {
      const start = Date.parse(row.submitted_at);
      const end = Date.parse(row.updated_at);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
      return (end - start) / (1000 * 60 * 60 * 24);
    })
    .filter((n): n is number => n != null);

  const averageHiringTimeDays =
    hireDeltas.length > 0
      ? Math.round((hireDeltas.reduce((a, b) => a + b, 0) / hireDeltas.length) * 10) / 10
      : null;

  const hiredCount = appRows.filter((a) => a.status === "hired").length;
  const interviewCount = interviews.count ?? 0;

  const topDepartments = [...jobsByDept.entries()]
    .map(([department, jobCount]) => ({
      department,
      jobCount,
      applicationCount: appsByDept.get(department) ?? 0,
    }))
    .sort((a, b) => b.applicationCount - a.applicationCount || b.jobCount - a.jobCount)
    .slice(0, 8);

  const hiringTrends = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([monthKey, value]) => ({
      month: monthKey,
      applications: value.applications,
      hires: value.hires,
    }));

  return {
    tool: "getHRAnalytics",
    count:
      (appsWeek.count ?? 0) +
      (appsMonth.count ?? 0) +
      jobRows.length +
      appRows.length,
    analytics: {
      applicationsThisWeek: appsWeek.count ?? 0,
      applicationsThisMonth: appsMonth.count ?? 0,
      openPositions: jobRows.filter((j) => j.status === "published").length,
      closedPositions: jobRows.filter((j) => j.status === "closed").length,
      draftPositions: jobRows.filter((j) => j.status === "draft").length,
      totalApplications: appRows.length,
      totalCandidates: candidates.count ?? 0,
      totalInterviews: interviewCount,
      averageAIScore,
      averageInterviewCountPerHire:
        hiredCount > 0
          ? Math.round((interviewCount / hiredCount) * 10) / 10
          : null,
      averageHiringTimeDays,
      mostAppliedJob: rankedJobs[0] ?? null,
      leastAppliedJob:
        rankedJobs.length > 0 ? rankedJobs[rankedJobs.length - 1] ?? null : null,
      topDepartments,
      hiringTrends,
    },
  };
}

/** Predictive signals derived from live application/ranking density (not invented people). */
export async function getPredictions(
  params: { jobQuery?: string; topN?: number } = {},
  client?: AnySupabase
): Promise<PredictionsResult> {
  const supabase = await getSupabase(client);
  const jobQuery = sanitizeSearchTerm(params.jobQuery ?? "");
  const limit = Math.max(1, Math.min(params.topN ?? 8, 20));

  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, status, department, published_at, closes_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (jobQuery) {
    jobsQuery = jobsQuery.or(`title.ilike.%${jobQuery}%,department.ilike.%${jobQuery}%`);
  }

  const { data: jobs, error } = await jobsQuery;
  if (error) throw new Error(`[agent] getPredictions jobs failed: ${error.message}`);

  const jobRows = (jobs ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    department: string | null;
    published_at: string | null;
    closes_at: string | null;
  }>;

  const predictions = [];
  for (const job of jobRows) {
    const [{ count: appCount }, { data: rankingRows }, { data: analysisRows }] =
      await Promise.all([
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("job_id", job.id),
        supabase
          .from("ai_candidate_ranking")
          .select("score")
          .eq("job_id", job.id)
          .limit(50),
        supabase
          .from("ai_resume_analysis")
          .select("analysis_json, score")
          .ilike("job_title", `%${job.title}%`)
          .limit(50),
      ]);

    const applications = appCount ?? 0;
    const scores = (rankingRows ?? [])
      .map((r) => Number((r as { score: number | string }).score))
      .filter((n) => Number.isFinite(n));
    const avgScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    const missing = new Map<string, number>();
    for (const row of analysisRows ?? []) {
      const json = (row as { analysis_json: { missingSkills?: string[] } }).analysis_json;
      for (const skill of json?.missingSkills ?? []) {
        missing.set(skill, (missing.get(skill) ?? 0) + 1);
      }
    }
    const skillShortages = [...missing.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    let hiringDifficulty: "Low" | "Medium" | "High" = "Medium";
    if (applications >= 8 && (avgScore ?? 0) >= 70) hiringDifficulty = "Low";
    if (applications <= 2 || (avgScore != null && avgScore < 55)) hiringDifficulty = "High";

    const candidateAvailability: "Low" | "Medium" | "High" =
      applications >= 8 ? "High" : applications >= 3 ? "Medium" : "Low";

    const probabilityOfHiringPercent = Math.max(
      5,
      Math.min(
        95,
        Math.round(
          20 +
            Math.min(applications, 15) * 3 +
            (avgScore != null ? avgScore * 0.35 : 15) -
            skillShortages.length * 4
        )
      )
    );

    const estimatedDaysToFill =
      hiringDifficulty === "Low" ? 21 : hiringDifficulty === "Medium" ? 35 : 55;

    predictions.push({
      jobId: job.id,
      jobTitle: job.title,
      hiringDifficulty,
      estimatedDaysToFill,
      candidateAvailability,
      probabilityOfHiringPercent,
      skillShortages,
      basis: [
        `${applications} live applications`,
        avgScore != null ? `Average ranking/AI score ${Math.round(avgScore)}` : "No AI scores yet",
        `${skillShortages.length} recurring missing skills in analyses`,
      ],
    });
  }

  logCopilotDebug("Database Queries", {
    tool: "getPredictions",
    jobs: jobRows.length,
    predictions: predictions.length,
  });

  return { tool: "getPredictions", count: predictions.length, predictions };
}

/** Operational smart alerts from live tables. */
export async function getSmartAlerts(
  _params: Record<string, unknown> = {},
  client?: AnySupabase
): Promise<SmartAlertsResult> {
  const supabase = await getSupabase(client);
  const today = new Date().toISOString().slice(0, 10);
  const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    interviewsToday,
    waitingReview,
    highScoreUnreviewed,
    jobsClosing,
    apps,
    resumes,
  ] = await Promise.all([
    supabase
      .from("interviews")
      .select("id, application_id, interview_date, applications ( full_name )")
      .eq("interview_date", today)
      .eq("status", "scheduled"),
    supabase
      .from("applications")
      .select("id, full_name, status")
      .in("status", ["new", "hr_review"])
      .order("submitted_at", { ascending: true })
      .limit(20),
    supabase
      .from("ai_resume_analysis")
      .select("candidate_id, application_id, score, candidate_profiles ( full_name )")
      .gte("score", 85)
      .order("score", { ascending: false })
      .limit(20),
    supabase
      .from("jobs")
      .select("id, title, closes_at")
      .eq("status", "published")
      .not("closes_at", "is", null)
      .lte("closes_at", inSevenDays)
      .gte("closes_at", today),
    supabase.from("applications").select("id, candidate_id, full_name, status").limit(200),
    supabase.from("candidate_resumes").select("candidate_id"),
  ]);

  const alerts: SmartAlertsResult["alerts"] = [];

  for (const row of interviewsToday.data ?? []) {
    const typed = row as {
      application_id: string;
      applications: { full_name: string } | { full_name: string }[] | null;
    };
    const application = Array.isArray(typed.applications)
      ? typed.applications[0]
      : typed.applications;
    alerts.push({
      severity: "warning",
      type: "interview_today",
      message: `Interview today for ${application?.full_name ?? "a candidate"}`,
      relatedPath: `/hr/applications/${typed.application_id}`,
    });
  }

  for (const row of waitingReview.data ?? []) {
    const typed = row as { id: string; full_name: string; status: string };
    alerts.push({
      severity: "info",
      type: "waiting_review",
      message: `${typed.full_name} is waiting review (status: ${typed.status})`,
      relatedPath: `/hr/applications/${typed.id}`,
    });
  }

  const appsById = new Map(
    ((apps.data ?? []) as Array<{ id: string; status: string }>).map((a) => [a.id, a])
  );

  for (const row of highScoreUnreviewed.data ?? []) {
    const typed = row as {
      application_id: string | null;
      score: number | string;
      candidate_profiles: { full_name: string } | { full_name: string }[] | null;
    };
    if (!typed.application_id) continue;
    const app = appsById.get(typed.application_id);
    // Only alert when still in early pipeline statuses
    if (app && app.status !== "new" && app.status !== "ai_shortlisted") continue;

    const profile = Array.isArray(typed.candidate_profiles)
      ? typed.candidate_profiles[0]
      : typed.candidate_profiles;
    alerts.push({
      severity: "critical",
      type: "high_score_unreviewed",
      message: `High scoring candidate ${profile?.full_name ?? "Unknown"} (score ${typed.score}) not reviewed`,
      relatedPath: `/hr/applications/${typed.application_id}`,
    });
  }

  for (const row of jobsClosing.data ?? []) {
    const typed = row as { id: string; title: string; closes_at: string };
    alerts.push({
      severity: "warning",
      type: "job_closing_soon",
      message: `Job "${typed.title}" closes on ${typed.closes_at.slice(0, 10)}`,
      relatedPath: `/hr/jobs/${typed.id}`,
    });
  }

  const resumeSet = new Set(
    (resumes.data ?? []).map((r) => (r as { candidate_id: string }).candidate_id)
  );

  // Applications without AI score / missing resumes
  const { data: allAnalyses } = await supabase
    .from("ai_resume_analysis")
    .select("application_id")
    .not("application_id", "is", null)
    .limit(500);
  const analyzedApps = new Set(
    (allAnalyses ?? []).map((r) => (r as { application_id: string }).application_id)
  );

  let missingScore = 0;
  let missingResume = 0;
  for (const row of (apps.data ?? []) as Array<{
    id: string;
    candidate_id: string | null;
    full_name: string;
  }>) {
    if (!analyzedApps.has(row.id)) {
      missingScore += 1;
      if (missingScore <= 5) {
        alerts.push({
          severity: "info",
          type: "application_without_ai_score",
          message: `Application for ${row.full_name} has no AI score yet`,
          relatedPath: `/hr/applications/${row.id}`,
        });
      }
    }
    if (row.candidate_id && !resumeSet.has(row.candidate_id)) {
      missingResume += 1;
      if (missingResume <= 5) {
        alerts.push({
          severity: "warning",
          type: "missing_resume",
          message: `${row.full_name} has no resume on file`,
          relatedPath: `/hr/applications/${row.id}`,
        });
      }
    }
  }

  logCopilotDebug("Database Queries", {
    tool: "getSmartAlerts",
    alerts: alerts.length,
  });

  return { tool: "getSmartAlerts", count: alerts.length, alerts: alerts.slice(0, 40) };
}

function mapEmailType(raw?: string): EmailType {
  const value = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  if (value.includes("offer")) return "offer_letter";
  if (value.includes("reject")) return "rejection";
  if (value.includes("remind")) return "interview_reminder";
  if (value.includes("reschedule")) return "interview_reschedule";
  if (value.includes("cancel")) return "interview_cancellation";
  if (value.includes("confirm")) return "interview_invitation";
  if (value.includes("salary") || value.includes("onboard") || value.includes("thank") || value.includes("document")) {
    return "general";
  }
  if (value.includes("shortlist")) return "general";
  if (value.includes("follow")) return "follow_up";
  if (value.includes("interview")) return "interview_invitation";
  if (isEmailType(value)) return value;
  return "general";
}

function mapEmailTone(raw?: string): EmailTone {
  const value = (raw ?? "").toLowerCase();
  if (isEmailTone(value)) return value;
  if (value.includes("friendly")) return "friendly";
  if (value.includes("formal")) return "formal";
  // short/detailed are Copilot-only tones; map to closest shared tone for Groq.
  if (value.includes("short") || value.includes("brief")) return "professional";
  if (value.includes("detailed")) return "formal";
  return "professional";
}

/** Draft HR emails using live candidate/job/interview context (+ Groq when available). */
export async function generateAgentEmail(
  params: {
    emailType?: string;
    candidateQuery?: string;
    jobQuery?: string;
    companyName?: string;
    tone?: string;
  } = {},
  client?: AnySupabase
): Promise<AgentEmailResult> {
  const supabase = await getSupabase(client);
  const candidateQuery = sanitizeSearchTerm(params.candidateQuery ?? "");
  const jobQuery = sanitizeSearchTerm(params.jobQuery ?? "");
  const emailType = mapEmailType(params.emailType);
  const tone = mapEmailTone(params.tone);
  const companyName =
    params.companyName?.trim() ||
    process.env.APP_NAME?.trim() ||
    "AI Recruitment Portal";

  let appQuery = supabase
    .from("applications")
    .select("id, full_name, jobs ( title )")
    .order("submitted_at", { ascending: false })
    .limit(8);

  if (candidateQuery) {
    appQuery = appQuery.ilike("full_name", `%${candidateQuery}%`);
  }

  const { data, error } = await appQuery;
  if (error) throw new Error(`[agent] generateAgentEmail failed: ${error.message}`);

  let candidateName: string | null = null;
  let jobTitle: string | null = jobQuery || null;
  let applicationId: string | null = null;
  const row = (data ?? [])[0] as
    | {
        id: string;
        full_name: string;
        jobs: { title: string } | { title: string }[] | null;
      }
    | undefined;

  if (row) {
    candidateName = row.full_name;
    applicationId = row.id;
    const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
    jobTitle = job?.title ?? jobTitle;
  }

  let interviewDate: string | null = null;
  let interviewTime: string | null = null;
  let hrName: string | null = null;

  let interviewQuery = supabase
    .from("interviews")
    .select(
      "interview_date, interview_time, interviewer_name, application_id, applications ( full_name, jobs ( title ) )"
    )
    .order("interview_date", { ascending: true })
    .limit(8);

  if (applicationId) {
    interviewQuery = interviewQuery.eq("application_id", applicationId);
  }

  const { data: interviewData } = await interviewQuery;
  type InterviewRow = {
    interview_date: string;
    interview_time: string;
    interviewer_name: string;
    applications: {
      full_name: string;
      jobs: { title: string } | { title: string }[] | null;
    } | null;
  };

  const interviewRows = (interviewData ?? []) as unknown as InterviewRow[];
  const interviewHit =
    (candidateQuery
      ? interviewRows.find((i) =>
          (i.applications?.full_name ?? "")
            .toLowerCase()
            .includes(candidateQuery.toLowerCase())
        )
      : undefined) ?? interviewRows[0];

  if (interviewHit) {
    interviewDate = interviewHit.interview_date || null;
    interviewTime = interviewHit.interview_time || null;
    hrName = interviewHit.interviewer_name || null;
    candidateName = candidateName || interviewHit.applications?.full_name || null;
    const job = interviewHit.applications?.jobs;
    const title = Array.isArray(job) ? job[0]?.title : job?.title;
    jobTitle = jobTitle || title || null;
  }

  const missingFields: string[] = [];
  if (!candidateName) {
    missingFields.push("Candidate Name (`applications.full_name` / `candidate_profiles`)");
  }
  if (!jobTitle) {
    missingFields.push("Job Title (`jobs.title` / `applications`)");
  }
  if (
    (emailType.startsWith("interview_") || emailType === "interview_invitation") &&
    !interviewDate
  ) {
    missingFields.push("Interview Date (`interviews.interview_date`)");
  }
  if (
    (emailType.startsWith("interview_") || emailType === "interview_invitation") &&
    !interviewTime
  ) {
    missingFields.push("Interview Time (`interviews.interview_time`)");
  }
  if (!hrName) {
    missingFields.push("HR Name (`interviews.interviewer_name`)");
  }

  if (!candidateName && !candidateQuery) {
    return {
      tool: "generateAgentEmail",
      count: 0,
      emailType,
      draft: null,
      context: {
        candidateName: null,
        jobTitle,
        interviewDate,
        interviewTime,
        companyName,
        hrName,
        missingFields,
      },
    };
  }

  const resolvedName = candidateName || candidateQuery;
  const resolvedJob = jobTitle || "Open Role";
  let draft: GeneratedEmail | null = null;

  try {
    draft = await generateHREmail({
      emailType,
      tone,
      candidateName: resolvedName,
      jobTitle: resolvedJob,
      companyName,
      interviewDate,
      interviewTime,
      hrNotes: [
        hrName ? `HR / interviewer name: ${hrName}` : null,
        emailType === "general"
          ? "General HR communication — keep professional and actionable."
          : null,
        missingFields.length
          ? `Do not invent these missing fields: ${missingFields.join("; ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    });
  } catch (error) {
    console.error("[agent] generateAgentEmail Groq draft failed:", error);
    draft = null;
  }

  return {
    tool: "generateAgentEmail",
    count: draft || resolvedName ? 1 : 0,
    emailType,
    draft,
    context: {
      candidateName: resolvedName,
      jobTitle: resolvedJob,
      interviewDate,
      interviewTime,
      companyName,
      hrName,
      missingFields,
    },
  };
}

/** Structured management/hiring reports from live aggregates + AI tables. */
export async function generateAgentReport(
  params: { reportType?: string; jobQuery?: string } = {},
  client?: AnySupabase
): Promise<AgentReportResult> {
  const reportType = (params.reportType ?? "recruitment_summary").toLowerCase();
  const analytics = await getHRAnalytics({}, client);
  const alerts = await getSmartAlerts({}, client);
  const predictions = await getPredictions(
    { jobQuery: params.jobQuery, topN: 5 },
    client
  );

  const a = analytics.analytics;
  const sections: Array<{ heading: string; bullets: string[] }> = [];

  if (reportType.includes("interview")) {
    sections.push({
      heading: "Interview Report",
      bullets: [
        `Total interviews on record: ${a.totalInterviews}`,
        `Interview alerts today: ${alerts.alerts.filter((x) => x.type === "interview_today").length}`,
        `Candidates waiting review: ${alerts.alerts.filter((x) => x.type === "waiting_review").length}`,
      ],
    });
  } else if (reportType.includes("candidate")) {
    sections.push({
      heading: "Candidate Report",
      bullets: [
        `Total candidates: ${a.totalCandidates}`,
        `Average AI score: ${a.averageAIScore ?? "N/A"}`,
        `Applications without AI score alerts: ${alerts.alerts.filter((x) => x.type === "application_without_ai_score").length}`,
        `Missing resume alerts: ${alerts.alerts.filter((x) => x.type === "missing_resume").length}`,
      ],
    });
  } else if (reportType.includes("management") || reportType.includes("hiring")) {
    sections.push({
      heading: reportType.includes("management") ? "Management Report" : "Hiring Report",
      bullets: [
        `Open positions: ${a.openPositions}`,
        `Closed positions: ${a.closedPositions}`,
        `Applications this week: ${a.applicationsThisWeek}`,
        `Applications this month: ${a.applicationsThisMonth}`,
        `Most applied job: ${a.mostAppliedJob ? `${a.mostAppliedJob.title} (${a.mostAppliedJob.count})` : "N/A"}`,
        `Average hiring time (days): ${a.averageHiringTimeDays ?? "N/A"}`,
      ],
    });
    sections.push({
      heading: "Predictions",
      bullets: predictions.predictions.slice(0, 5).map(
        (p) =>
          `${p.jobTitle}: difficulty ${p.hiringDifficulty}, ~${p.estimatedDaysToFill} days, hire probability ${p.probabilityOfHiringPercent}%`
      ),
    });
  } else {
    sections.push({
      heading: "Recruitment Summary",
      bullets: [
        `Candidates: ${a.totalCandidates}`,
        `Applications: ${a.totalApplications}`,
        `Open / Closed jobs: ${a.openPositions} / ${a.closedPositions}`,
        `Average AI score: ${a.averageAIScore ?? "N/A"}`,
        `Top department: ${a.topDepartments[0]?.department ?? "N/A"}`,
      ],
    });
    const alertBullets = alerts.alerts
      .slice(0, 8)
      .map((x) => `[${x.severity}] ${x.message}`);
    sections.push({
      heading: "Active Alerts",
      bullets: alertBullets.length > 0 ? alertBullets : ["No alerts"],
    });
  }

  return {
    tool: "generateAgentReport",
    count: sections.length,
    reportType,
    report: {
      title: reportType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      sections,
      generatedAt: new Date().toISOString(),
    },
  };
}

export type AgentToolResult =
  | HRAnalyticsResult
  | PredictionsResult
  | SmartAlertsResult
  | AgentEmailResult
  | AgentReportResult;
