import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isInterviewStatus,
  isInterviewType,
} from "@/lib/hr/interviews";
import { isApplicationStatus } from "@/lib/hr/status";
import {
  RECENT_ACTIVITY_LIMIT,
  UPCOMING_INTERVIEWS_LIMIT,
  todayDateInputValue,
  unwrap,
} from "@/lib/hr/analytics/helpers";
import type { AnalyticsActivityItem, UpcomingInterview } from "@/lib/hr/analytics/types";

type CandidateRow = {
  id: string;
  full_name: string;
  created_at: string;
};

type ApplicationActivityRow = {
  id: string;
  full_name: string;
  submitted_at: string;
  jobs: { title: string } | null;
};

type InterviewActivityRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  applications: { full_name: string; jobs: { title: string } | null } | null;
};

type StatusHistoryActivityRow = {
  id: string;
  new_status: string;
  created_at: string;
  applications: { full_name: string; jobs: { title: string } | null } | null;
};

type UpcomingInterviewRow = {
  id: string;
  application_id: string;
  interview_date: string;
  interview_time: string;
  interview_type: string;
  status: string;
  applications: { full_name: string } | null;
  jobs: { title: string } | null;
};

type ReviewTimeRow = {
  created_at: string;
  applications: { submitted_at: string } | null;
};

const RESCHEDULE_THRESHOLD_MS = 60_000;

export async function fetchRecentActivity(): Promise<AnalyticsActivityItem[]> {
  const supabase = await createClient();
  const perSourceLimit = Math.ceil(RECENT_ACTIVITY_LIMIT / 2);

  const [candidatesResult, applicationsResult, interviewsResult, statusHistoryResult] =
    await Promise.all([
      supabase
        .from("candidate_profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(perSourceLimit),
      supabase
        .from("applications")
        .select("id, full_name, submitted_at, jobs ( title )")
        .order("submitted_at", { ascending: false })
        .limit(perSourceLimit),
      supabase
        .from("interviews")
        .select(
          "id, created_at, updated_at, status, applications ( full_name, jobs ( title ) )"
        )
        .order("updated_at", { ascending: false })
        .limit(perSourceLimit),
      supabase
        .from("application_status_history")
        .select(
          "id, new_status, created_at, applications ( full_name, jobs ( title ) )"
        )
        .in("new_status", ["hired", "rejected"])
        .order("created_at", { ascending: false })
        .limit(perSourceLimit),
    ]);

  const activity: AnalyticsActivityItem[] = [];

  for (const row of (unwrap(candidatesResult, "recent candidates") ?? []) as CandidateRow[]) {
    activity.push({
      id: `candidate-${row.id}`,
      type: "candidate_registered",
      candidateName: row.full_name,
      jobTitle: null,
      createdAt: row.created_at,
    });
  }

  for (const row of (unwrap(applicationsResult, "recent application activity") ??
    []) as unknown as ApplicationActivityRow[]) {
    activity.push({
      id: `application-${row.id}`,
      type: "application_submitted",
      candidateName: row.full_name,
      jobTitle: row.jobs?.title ?? "Unknown role",
      createdAt: row.submitted_at,
    });
  }

  for (const row of (unwrap(interviewsResult, "recent interview activity") ??
    []) as unknown as InterviewActivityRow[]) {
    if (!row.applications) {
      continue;
    }

    const createdAt = new Date(row.created_at).getTime();
    const updatedAt = new Date(row.updated_at).getTime();
    const isRescheduled =
      updatedAt - createdAt > RESCHEDULE_THRESHOLD_MS && row.status === "scheduled";

    activity.push({
      id: `interview-${row.id}-${isRescheduled ? "rescheduled" : "scheduled"}`,
      type: isRescheduled ? "interview_rescheduled" : "interview_scheduled",
      candidateName: row.applications.full_name,
      jobTitle: row.applications.jobs?.title ?? "Unknown role",
      createdAt: isRescheduled ? row.updated_at : row.created_at,
    });
  }

  for (const row of (unwrap(statusHistoryResult, "recent hire/reject activity") ??
    []) as unknown as StatusHistoryActivityRow[]) {
    if (!row.applications || !isApplicationStatus(row.new_status)) {
      continue;
    }

    if (row.new_status === "hired") {
      activity.push({
        id: `status-${row.id}-hired`,
        type: "candidate_hired",
        candidateName: row.applications.full_name,
        jobTitle: row.applications.jobs?.title ?? "Unknown role",
        createdAt: row.created_at,
      });
    }

    if (row.new_status === "rejected") {
      activity.push({
        id: `status-${row.id}-rejected`,
        type: "candidate_rejected",
        candidateName: row.applications.full_name,
        jobTitle: row.applications.jobs?.title ?? "Unknown role",
        createdAt: row.created_at,
      });
    }
  }

  return activity
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);
}

export async function fetchUpcomingInterviews(): Promise<UpcomingInterview[]> {
  const supabase = await createClient();
  const today = todayDateInputValue();

  const { data, error } = await supabase
    .from("interviews")
    .select(
      `
      id,
      application_id,
      interview_date,
      interview_time,
      interview_type,
      status,
      applications ( full_name ),
      jobs ( title )
    `
    )
    .eq("status", "scheduled")
    .gte("interview_date", today)
    .order("interview_date", { ascending: true })
    .order("interview_time", { ascending: true })
    .limit(UPCOMING_INTERVIEWS_LIMIT);

  if (error) {
    console.error("[analytics] Failed to load upcoming interviews:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as UpcomingInterviewRow[]).map((row) => ({
    id: row.id,
    applicationId: row.application_id,
    candidateName: row.applications?.full_name ?? "Unknown candidate",
    jobTitle: row.jobs?.title ?? "Unknown role",
    interviewDate: row.interview_date,
    interviewTime: row.interview_time.length >= 5 ? row.interview_time.slice(0, 5) : row.interview_time,
    interviewType: isInterviewType(row.interview_type) ? row.interview_type : "online",
    status: isInterviewStatus(row.status) ? row.status : "scheduled",
  }));
}

export async function fetchReviewTimeDeltasDays(): Promise<number[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("application_status_history")
    .select("created_at, applications ( submitted_at )")
    .eq("previous_status", "new")
    .neq("new_status", "new")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[analytics] Failed to load review time data:", error.message);
    return [];
  }

  const deltas: number[] = [];

  for (const row of (data ?? []) as unknown as ReviewTimeRow[]) {
    const submittedAt = row.applications?.submitted_at;
    if (!submittedAt) {
      continue;
    }

    const submittedMs = new Date(submittedAt).getTime();
    const reviewedMs = new Date(row.created_at).getTime();
    if (Number.isNaN(submittedMs) || Number.isNaN(reviewedMs) || reviewedMs < submittedMs) {
      continue;
    }

    deltas.push((reviewedMs - submittedMs) / (1000 * 60 * 60 * 24));
  }

  return deltas;
}
