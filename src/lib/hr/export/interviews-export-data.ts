import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  isInterviewStatus,
  isInterviewType,
} from "@/lib/hr/interviews";
import { fetchAllPages } from "@/lib/hr/export/paginate";
import { formatExportDate, formatExportTime } from "@/lib/hr/export/format";

type InterviewExportRow = {
  interviewer_name: string;
  interview_type: string;
  interview_date: string;
  interview_time: string;
  status: string;
  applications: { full_name: string } | null;
  jobs: { title: string } | null;
};

export type InterviewExportRecord = {
  candidate: string;
  job: string;
  interviewer: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string;
  status: string;
};

export async function getInterviewsExportRecords(): Promise<InterviewExportRecord[]> {
  const supabase = await createClient();

  const rows = await fetchAllPages<InterviewExportRow>(async (from, to) => {
    const { data, error } = await supabase
      .from("interviews")
      .select(
        `
        interviewer_name,
        interview_type,
        interview_date,
        interview_time,
        status,
        applications ( full_name ),
        jobs ( title )
      `
      )
      .order("interview_date", { ascending: false })
      .order("interview_time", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[hr/export] Failed to load interviews for export:", error.message);
      return [];
    }

    return (data ?? []) as unknown as InterviewExportRow[];
  });

  return rows.map((row) => {
    const interviewType = isInterviewType(row.interview_type) ? row.interview_type : "online";
    const status = isInterviewStatus(row.status) ? row.status : "scheduled";

    return {
      candidate: row.applications?.full_name ?? "Unknown candidate",
      job: row.jobs?.title ?? "Unknown role",
      interviewer: row.interviewer_name,
      interviewDate: formatExportDate(row.interview_date),
      interviewTime: formatExportTime(row.interview_time),
      interviewType: INTERVIEW_TYPE_LABELS[interviewType],
      status: INTERVIEW_STATUS_LABELS[status],
    };
  });
}
