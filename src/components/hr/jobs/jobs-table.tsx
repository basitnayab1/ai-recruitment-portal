import Link from "next/link";
import { JobStatusBadge } from "@/components/hr/jobs/job-status-badge";
import { JobRowActions } from "@/components/hr/jobs/job-row-actions";
import { Pagination } from "@/components/hr/pagination";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  TABLE_BASE,
  TABLE_BODY,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_ROW,
} from "@/lib/ui/classes";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { formatDate } from "@/lib/hr/format";
import type { HRJobsPage } from "@/lib/hr/jobs-data";

export function JobsTable({
  jobsPage,
  extraParams = {},
}: {
  jobsPage: HRJobsPage;
  extraParams?: Record<string, string | undefined>;
}) {
  const { jobs, page, pageSize, total } = jobsPage;

  return (
    <DataTableShell
      footer={
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/hr/jobs"
          extraParams={extraParams}
        />
      }
    >
      <table className={TABLE_BASE}>
        <thead className={TABLE_HEAD}>
          <tr>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Job
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Department
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Location
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Type
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Status
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Applications
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Created
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className={TABLE_BODY}>
          {jobs.map((job) => (
            <tr key={job.id} className={TABLE_ROW}>
              <td className={`${TABLE_CELL} whitespace-nowrap`}>
                <Link
                  href={`/hr/jobs/${job.id}`}
                  className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                >
                  {job.title}
                </Link>
                {job.isRemote ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                    Remote
                  </span>
                ) : null}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {job.department ?? "—"}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {job.location ?? "—"}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
              </td>
              <td className={TABLE_CELL}>
                <JobStatusBadge status={job.status} />
              </td>
              <td className={`${TABLE_CELL} text-zinc-600 dark:text-zinc-400`}>
                {job.applicationCount}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {formatDate(job.createdAt)}
              </td>
              <td className={TABLE_CELL}>
                <JobRowActions jobId={job.id} status={job.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
