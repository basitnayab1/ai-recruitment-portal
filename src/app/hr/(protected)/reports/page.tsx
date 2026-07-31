import type { Metadata } from "next";
import { requireHRUser } from "@/lib/auth/dal";
import { ExportCard } from "@/components/hr/export/export-card";
import { ExportCsvButton } from "@/components/hr/export/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { PAGE_STACK } from "@/lib/ui/classes";
import {
  exportApplicationsCsvAction,
  exportCandidatesCsvAction,
  exportInterviewsCsvAction,
} from "@/lib/hr/export-actions";

export const metadata: Metadata = {
  title: "Reports & Export | AI Recruitment Portal",
};

export default async function HRReportsPage() {
  await requireHRUser();

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Reports & Export"
        description="Download CSV reports for applications, candidates, and interviews. Files are generated on the server when you export."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ExportCard
          title="Applications"
          description="Candidate name, contact details, job title, status, applied date, and experience."
        >
          <ExportCsvButton label="Export applications CSV" action={exportApplicationsCsvAction} />
        </ExportCard>

        <ExportCard
          title="Candidates"
          description="Registered candidates with experience, resume upload status, and account creation date."
        >
          <ExportCsvButton label="Export candidates CSV" action={exportCandidatesCsvAction} />
        </ExportCard>

        <ExportCard
          title="Interviews"
          description="Scheduled and past interviews with candidate, job, interviewer, date, time, type, and status."
        >
          <ExportCsvButton label="Export interviews CSV" action={exportInterviewsCsvAction} />
        </ExportCard>
      </div>
    </div>
  );
}
