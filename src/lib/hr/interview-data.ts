import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  formatInterviewDuration,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  isInterviewStatus,
  isInterviewType,
  type InterviewStatus,
  type InterviewType,
} from "@/lib/hr/interviews";
import { formatEmailDate, formatEmailTime } from "@/lib/email/format";

type InterviewRow = {
  id: string;
  application_id: string;
  candidate_id: string | null;
  job_id: string;
  interviewer_name: string;
  interview_type: string;
  meeting_link: string | null;
  office_location: string | null;
  interview_date: string;
  interview_time: string;
  timezone: string;
  duration_minutes: number;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type HRInterview = {
  id: string;
  applicationId: string;
  candidateId: string | null;
  jobId: string;
  interviewerName: string;
  interviewType: InterviewType;
  meetingLink: string | null;
  officeLocation: string | null;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  durationMinutes: number;
  notes: string | null;
  status: InterviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type HRInterviewEmailPayload = {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  interviewType: InterviewType;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  durationLabel: string;
  meetingLink: string | null;
  officeLocation: string | null;
};

function mapInterviewRow(row: InterviewRow): HRInterview {
  return {
    id: row.id,
    applicationId: row.application_id,
    candidateId: row.candidate_id,
    jobId: row.job_id,
    interviewerName: row.interviewer_name,
    interviewType: isInterviewType(row.interview_type) ? row.interview_type : "online",
    meetingLink: row.meeting_link,
    officeLocation: row.office_location,
    interviewDate: row.interview_date,
    interviewTime: row.interview_time.length >= 5 ? row.interview_time.slice(0, 5) : row.interview_time,
    timezone: row.timezone,
    durationMinutes: row.duration_minutes,
    notes: row.notes,
    status: isInterviewStatus(row.status) ? row.status : "scheduled",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildInterviewEmailPayload({
  interview,
  candidateEmail,
  candidateName,
  jobTitle,
}: {
  interview: HRInterview;
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
}): HRInterviewEmailPayload {
  return {
    candidateEmail,
    candidateName,
    jobTitle,
    interviewerName: interview.interviewerName,
    interviewType: interview.interviewType,
    interviewDate: formatEmailDate(interview.interviewDate),
    interviewTime: formatEmailTime(interview.interviewTime),
    timezone: interview.timezone,
    durationLabel: formatInterviewDuration(interview.durationMinutes),
    meetingLink: interview.meetingLink,
    officeLocation: interview.officeLocation,
  };
}

export async function getInterviewByApplicationId(applicationId: string): Promise<HRInterview | null> {
  const supabase = await createClient();

  const { data: scheduled, error: scheduledError } = await supabase
    .from("interviews")
    .select("*")
    .eq("application_id", applicationId)
    .eq("status", "scheduled")
    .maybeSingle();

  if (scheduledError) {
    console.error("[interview-data] Failed to load scheduled interview:", scheduledError.message);
    return null;
  }

  if (scheduled) {
    return mapInterviewRow(scheduled as InterviewRow);
  }

  const { data: latest, error: latestError } = await supabase
    .from("interviews")
    .select("*")
    .eq("application_id", applicationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    console.error("[interview-data] Failed to load latest interview:", latestError.message);
    return null;
  }

  if (!latest) {
    return null;
  }

  return mapInterviewRow(latest as InterviewRow);
}

export async function getInterviewById(interviewId: string): Promise<HRInterview | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", interviewId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[interview-data] Failed to load interview by id:", error.message);
    }
    return null;
  }

  return mapInterviewRow(data as InterviewRow);
}

export function formatInterviewLocation(interview: HRInterview): string {
  if (interview.interviewType === "online") {
    return interview.meetingLink ?? "Link to be shared";
  }
  if (interview.interviewType === "on_site") {
    return interview.officeLocation ?? "Location to be confirmed";
  }
  return interview.meetingLink ?? "HR will call you at the scheduled time";
}

export { INTERVIEW_STATUS_LABELS, INTERVIEW_TYPE_LABELS };
