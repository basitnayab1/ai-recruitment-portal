import Link from "next/link";
import { StatusBadge } from "@/components/hr/status-badge";
import { DashboardCardShell } from "@/components/shared/dashboard-card-shell";
import { formatDate, formatScore } from "@/lib/hr/format";
import {
  TABLE_BASE,
  TABLE_BODY,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_ROW,
  TABLE_WRAPPER,
} from "@/lib/ui/classes";
import type { RecentApplication } from "@/lib/hr/dashboard-data";

export function RecentApplicationsCard({
  applications,
}: {
  applications: RecentApplication[];
}) {
  return (
    <DashboardCardShell title="Recent Applications" href="/hr/applications">
      {applications.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">No applications yet</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            New candidate applications will show up here as soon as they&apos;re submitted.
          </p>
        </div>
      ) : (
        <div className={TABLE_WRAPPER}>
          <table className={TABLE_BASE}>
            <thead className={TABLE_HEAD}>
              <tr>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Candidate
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Job
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Status
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  AI Score
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Applied
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={TABLE_BODY}>
              {applications.map((application) => (
                <tr key={application.id} className={TABLE_ROW}>
                  <td className={`${TABLE_CELL} font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-50`}>
                    {application.candidateName}
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                    {application.jobTitle}
                  </td>
                  <td className={TABLE_CELL}>
                    <StatusBadge status={application.status} />
                  </td>
                  <td className={`${TABLE_CELL} text-zinc-600 dark:text-zinc-400`}>
                    {formatScore(application.aiScore)}
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                    {formatDate(application.submittedAt)}
                  </td>
                  <td className={`${TABLE_CELL} text-right whitespace-nowrap`}>
                    <Link
                      href={`/hr/applications/${application.id}`}
                      className="font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCardShell>
  );
}
