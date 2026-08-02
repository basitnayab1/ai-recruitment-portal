import type { Metadata } from "next";
import Link from "next/link";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { getCandidateApplications } from "@/lib/candidate/application-data";
import { formatDate } from "@/lib/hr/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { StatusBadge } from "@/components/hr/status-badge";
import { EmptyState } from "@/components/hr/empty-state";
import { ApplicationsIcon } from "@/components/hr/icons";
import { ApplicationSubmittedToast } from "@/components/candidate/application-submitted-toast";
import { PageHeader } from "@/components/shared/page-header";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  PAGE_STACK,
  TABLE_BASE,
  TABLE_BODY,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_ROW,
} from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "My Applications | AI Recruitment Portal",
};

export default async function CandidateApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const profile = await requireCandidateUser();
  const { applied } = await searchParams;
  const applications = await getCandidateApplications(profile.id);

  return (
    <div className={PAGE_STACK}>
      {applied === "1" ? <ApplicationSubmittedToast /> : null}

      <PageHeader
        title="My Applications"
        description="Track the status of every job you've applied to."
        actions={
          <Link href="/jobs" className={BTN_PRIMARY}>
            Browse Jobs
          </Link>
        }
      />

      {applications.length === 0 ? (
        <>
          <EmptyState
            icon={ApplicationsIcon}
            title="No applications submitted yet."
            description="When you apply for a job, it will show up here so you can track its status."
          />
          <div className="flex justify-center">
            <Link href="/jobs" className={BTN_PRIMARY}>
              Browse Jobs
            </Link>
          </div>
        </>
      ) : (
        <DataTableShell>
          <table className={TABLE_BASE}>
            <thead className={TABLE_HEAD}>
              <tr>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Job
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Location
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Type
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Applied
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Status
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={TABLE_BODY}>
              {applications.map((application) => (
                <tr key={application.id} className={TABLE_ROW}>
                  <td className={`${TABLE_CELL} font-semibold text-white`}>
                    {application.jobTitle}
                    {application.department ? (
                      <p className="mt-0.5 text-xs font-normal text-zinc-500">{application.department}</p>
                    ) : null}
                  </td>
                  <td className={`${TABLE_CELL} text-zinc-200`}>
                    {application.isRemote ? "Remote" : (application.location ?? "—")}
                  </td>
                  <td className={`${TABLE_CELL} text-zinc-200`}>
                    {EMPLOYMENT_TYPE_LABELS[application.employmentType]}
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                    {formatDate(application.submittedAt)}
                  </td>
                  <td className={TABLE_CELL}>
                    <StatusBadge status={application.status} />
                  </td>
                  <td className={TABLE_CELL}>
                    {application.jobId ? (
                      <Link href={`/jobs/${application.jobId}`} className={`${BTN_SECONDARY} h-9 px-3 text-xs`}>
                        View Job
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      )}
    </div>
  );
}
