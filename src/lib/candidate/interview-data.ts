import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmailConfig } from "@/lib/email/config";
import { formatEmailDate, formatEmailTime } from "@/lib/email/format";
import {
  formatInterviewDuration,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  isInterviewStatus,
  isInterviewType,
  type InterviewStatus,
  type InterviewType,
} from "@/lib/hr/interviews";

type CandidateInterviewRow = {
  id: string;
  interviewer_name: string;
  interview_type: string;
  meeting_link: string | null;
  office_location: string | null;
  interview_date: string;
  interview_time: string;
  timezone: string;
  duration_minutes: number;
  status: string;
  jobs: {
    title: string;
    department: string | null;
  } | null;
};

export type CandidateInterview = {
  id: string;
  jobTitle: string;
  company: string;
  department: string | null;
  interviewerName: string;
  interviewType: InterviewType;
  meetingLink: string | null;
  officeLocation: string | null;
  interviewDate: string;
  interviewDateLabel: string;
  interviewTime: string;
  interviewTimeLabel: string;
  timezone: string;
  durationLabel: string;
  status: InterviewStatus;
  statusLabel: string;
  typeLabel: string;
};

export async function getCandidateInterviews(candidateId: string): Promise<CandidateInterview[]> {
  const supabase = await createClient();
  const { appName } = getEmailConfig();

  const { data, error } = await supabase
    .from("interviews")
    .select(
      `id, interviewer_name, interview_type, meeting_link, office_location,
       interview_date, interview_time, timezone, duration_minutes, status,
       jobs ( title, department )`
    )
    .eq("candidate_id", candidateId)
    .order("interview_date", { ascending: true })
    .order("interview_time", { ascending: true });

  if (error) {
    console.error("[candidate/interview-data] Failed to load interviews:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as CandidateInterviewRow[];

  return rows.map((row) => {
    const interviewType = isInterviewType(row.interview_type) ? row.interview_type : "online";
    const status = isInterviewStatus(row.status) ? row.status : "scheduled";
    const timeValue = row.interview_time.length >= 5 ? row.interview_time.slice(0, 5) : row.interview_time;

    return {
      id: row.id,
      jobTitle: row.jobs?.title ?? "Unknown role",
      company: appName,
      department: row.jobs?.department ?? null,
      interviewerName: row.interviewer_name,
      interviewType,
      meetingLink: row.meeting_link,
      officeLocation: row.office_location,
      interviewDate: row.interview_date,
      interviewDateLabel: formatEmailDate(row.interview_date),
      interviewTime: timeValue,
      interviewTimeLabel: formatEmailTime(timeValue),
      timezone: row.timezone,
      durationLabel: formatInterviewDuration(row.duration_minutes),
      status,
      statusLabel: INTERVIEW_STATUS_LABELS[status],
      typeLabel: INTERVIEW_TYPE_LABELS[interviewType],
    };
  });
}

export async function getCandidateUpcomingInterviews(candidateId: string): Promise<CandidateInterview[]> {
  const supabase = await createClient();
  const { appName } = getEmailConfig();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("interviews")
    .select(
      `id, interviewer_name, interview_type, meeting_link, office_location,
       interview_date, interview_time, timezone, duration_minutes, status,
       jobs ( title, department )`
    )
    .eq("candidate_id", candidateId)
    .eq("status", "scheduled")
    .gte("interview_date", today)
    .order("interview_date", { ascending: true })
    .order("interview_time", { ascending: true });

  if (error) {
    console.error("[candidate/interview-data] Failed to load upcoming interviews:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as CandidateInterviewRow[];

  return rows.map((row) => {
    const interviewType = isInterviewType(row.interview_type) ? row.interview_type : "online";
    const status = isInterviewStatus(row.status) ? row.status : "scheduled";
    const timeValue = row.interview_time.length >= 5 ? row.interview_time.slice(0, 5) : row.interview_time;

    return {
      id: row.id,
      jobTitle: row.jobs?.title ?? "Unknown role",
      company: appName,
      department: row.jobs?.department ?? null,
      interviewerName: row.interviewer_name,
      interviewType,
      meetingLink: row.meeting_link,
      officeLocation: row.office_location,
      interviewDate: row.interview_date,
      interviewDateLabel: formatEmailDate(row.interview_date),
      interviewTime: timeValue,
      interviewTimeLabel: formatEmailTime(timeValue),
      timezone: row.timezone,
      durationLabel: formatInterviewDuration(row.duration_minutes),
      status,
      statusLabel: INTERVIEW_STATUS_LABELS[status],
      typeLabel: INTERVIEW_TYPE_LABELS[interviewType],
    };
  });
}
