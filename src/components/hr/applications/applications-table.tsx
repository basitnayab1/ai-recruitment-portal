import Link from "next/link";
import { StatusBadge } from "@/components/hr/status-badge";
import { Pagination } from "@/components/hr/pagination";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  TABLE_BASE,
  TABLE_BODY,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_ROW,
} from "@/lib/ui/classes";
import { formatDate } from "@/lib/hr/format";
import type { HRApplicationsPage } from "@/lib/hr/applications-data";

export function ApplicationsTable({
  applicationsPage,
  extraParams = {},
}: {
  applicationsPage: HRApplicationsPage;
  extraParams?: Record<string, string | undefined>;
}) {
  const { applications, page, pageSize, total } = applicationsPage;

  return (
    <DataTableShell
      footer={
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/hr/applications"
          extraParams={extraParams}
        />
      }
    >
      <table className={TABLE_BASE}>
        <thead className={TABLE_HEAD}>
          <tr>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Candidate
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Job Title
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Department
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Status
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Submitted
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Resume Available
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className={TABLE_BODY}>
          {applications.map((application) => (
            <tr key={application.id} className={TABLE_ROW}>
              <td className={`${TABLE_CELL} whitespace-nowrap`}>
                <div className="flex items-center gap-3">
                  <CandidateAvatar
                    name={application.candidateName}
                    pictureSrc={application.pictureUrl}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {application.candidateName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{application.email}</p>
                  </div>
                </div>
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {application.jobTitle}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {application.department ?? "—"}
              </td>
              <td className={TABLE_CELL}>
                <StatusBadge status={application.status} />
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {formatDate(application.submittedAt)}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap`}>
                <span
                  className={
                    application.hasResume
                      ? "inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300"
                      : "inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }
                >
                  {application.hasResume ? "Yes" : "No"}
                </span>
              </td>
              <td className={`${TABLE_CELL} text-right whitespace-nowrap`}>
                <Link
                  href={`/hr/applications/${application.id}`}
                  className="font-medium text-zinc-900 underline underline-offset-2 hover:no-underline dark:text-zinc-100"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
