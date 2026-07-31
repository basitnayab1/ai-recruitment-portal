import "server-only";

import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/hr/export/paginate";
import {
  formatExportDate,
  formatExportExperience,
  formatExportYesNo,
} from "@/lib/hr/export/format";

type CandidateExportRow = {
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  candidate_profile_details: { years_of_experience: number | null } | null;
  candidate_resumes: { candidate_id: string } | { candidate_id: string }[] | null;
};

export type CandidateExportRecord = {
  name: string;
  email: string;
  phone: string;
  experience: string;
  resumeUploaded: string;
  createdDate: string;
};

function hasResume(
  resumes: CandidateExportRow["candidate_resumes"]
): boolean {
  if (!resumes) {
    return false;
  }
  return Array.isArray(resumes) ? resumes.length > 0 : Boolean(resumes.candidate_id);
}

export async function getCandidatesExportRecords(): Promise<CandidateExportRecord[]> {
  const supabase = await createClient();

  const rows = await fetchAllPages<CandidateExportRow>(async (from, to) => {
    const { data, error } = await supabase
      .from("candidate_profiles")
      .select(
        `
        full_name,
        email,
        phone,
        created_at,
        candidate_profile_details ( years_of_experience ),
        candidate_resumes ( candidate_id )
      `
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[hr/export] Failed to load candidates for export:", error.message);
      return [];
    }

    return (data ?? []) as unknown as CandidateExportRow[];
  });

  return rows.map((row) => ({
    name: row.full_name,
    email: row.email,
    phone: row.phone ?? "",
    experience: formatExportExperience(row.candidate_profile_details?.years_of_experience ?? null),
    resumeUploaded: formatExportYesNo(hasResume(row.candidate_resumes)),
    createdDate: formatExportDate(row.created_at),
  }));
}
