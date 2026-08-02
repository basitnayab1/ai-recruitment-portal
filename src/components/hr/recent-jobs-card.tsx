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
          <p className="text-sm font-medium text-white">No jobs yet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Newly created job postings will appear here.
          </p>
          <Link
            href="/hr/jobs/new"
            className="mt-4 inline-block text-sm font-medium text-violet-300 transition-colors hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 rounded-sm"
          >
            Create your first job →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/hr/jobs/${job.id}`}
                className="block px-6 py-4 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {job.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {job.department ?? "Unassigned"} · Created {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
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
