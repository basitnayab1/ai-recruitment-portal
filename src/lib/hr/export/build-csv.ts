import "server-only";

import { buildCsv, exportFilename } from "@/lib/hr/export/csv";
import { getApplicationsExportRecords } from "@/lib/hr/export/applications-export-data";
import { getCandidatesExportRecords } from "@/lib/hr/export/candidates-export-data";
import { getInterviewsExportRecords } from "@/lib/hr/export/interviews-export-data";

export async function buildApplicationsCsv(): Promise<{ csv: string; filename: string }> {
  const records = await getApplicationsExportRecords();

  const csv = buildCsv(
    ["Candidate Name", "Email", "Phone", "Job Title", "Status", "Applied Date", "Experience"],
    records.map((record) => [
      record.candidateName,
      record.email,
      record.phone,
      record.jobTitle,
      record.status,
      record.appliedDate,
      record.experience,
    ])
  );

  return { csv, filename: exportFilename("applications") };
}

export async function buildCandidatesCsv(): Promise<{ csv: string; filename: string }> {
  const records = await getCandidatesExportRecords();

  const csv = buildCsv(
    ["Name", "Email", "Phone", "Experience", "Resume Uploaded", "Created Date"],
    records.map((record) => [
      record.name,
      record.email,
      record.phone,
      record.experience,
      record.resumeUploaded,
      record.createdDate,
    ])
  );

  return { csv, filename: exportFilename("candidates") };
}

export async function buildInterviewsCsv(): Promise<{ csv: string; filename: string }> {
  const records = await getInterviewsExportRecords();

  const csv = buildCsv(
    [
      "Candidate",
      "Job",
      "Interviewer",
      "Interview Date",
      "Interview Time",
      "Interview Type",
      "Status",
    ],
    records.map((record) => [
      record.candidate,
      record.job,
      record.interviewer,
      record.interviewDate,
      record.interviewTime,
      record.interviewType,
      record.status,
    ])
  );

  return { csv, filename: exportFilename("interviews") };
}
