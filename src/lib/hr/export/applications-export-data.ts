import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isApplicationStatus, APPLICATION_STATUS_META } from "@/lib/hr/status";
import { fetchAllPages } from "@/lib/hr/export/paginate";
import { formatExportDate, formatExportExperience } from "@/lib/hr/export/format";

type ApplicationExportRow = {
  full_name: string;
  email: string;
  phone: string | null;
  years_of_experience: number | null;
  status: string;
  submitted_at: string;
  jobs: { title: string } | null;
};

export type ApplicationExportRecord = {
  candidateName: string;
  email: string;
  phone: string;
  jobTitle: string;
  status: string;
  appliedDate: string;
  experience: string;
};

export async function getApplicationsExportRecords(): Promise<ApplicationExportRecord[]> {
  const supabase = await createClient();

  const rows = await fetchAllPages<ApplicationExportRow>(async (from, to) => {
    const { data, error } = await supabase
      .from("applications")
      .select(
        "full_name, email, phone, years_of_experience, status, submitted_at, jobs!inner ( title )"
      )
      .order("submitted_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[hr/export] Failed to load applications for export:", error.message);
      return [];
    }

    return (data ?? []) as unknown as ApplicationExportRow[];
  });

  return rows.map((row) => {
    const status = isApplicationStatus(row.status) ? row.status : "new";
    return {
      candidateName: row.full_name,
      email: row.email,
      phone: row.phone ?? "",
      jobTitle: row.jobs?.title ?? "Unknown role",
      status: APPLICATION_STATUS_META[status].label,
      appliedDate: formatExportDate(row.submitted_at),
      experience: formatExportExperience(row.years_of_experience),
    };
  });
}
