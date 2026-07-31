import Link from "next/link";
import { DashboardCardShell } from "@/components/shared/dashboard-card-shell";
import { JOB_STATUS_LABELS } from "@/lib/hr/jobs";
import { formatDate, formatRelativeTime } from "@/lib/hr/format";
import type { RecentJob } from "@/lib/hr/dashboard-data";

export function RecentJobsCard({ jobs }: { jobs: RecentJob[] }) {
  return (
    <DashboardCardShell title="Recent Jobs" href="/hr/jobs">
      {jobs.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">No jobs yet</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Newly created job postings will appear here.
          </p>
          <Link
            href="/hr/jobs/new"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 rounded-sm dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Create your first job →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/hr/jobs/${job.id}`}
                className="block px-6 py-4 transition-colors hover:bg-zinc-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 dark:hover:bg-zinc-900/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {job.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {job.department ?? "Unassigned"} · Created {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  {formatRelativeTime(job.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCardShell>
  );
}
