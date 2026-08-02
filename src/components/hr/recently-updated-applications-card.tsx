import Link from "next/link";
import { StatusBadge } from "@/components/hr/status-badge";
import { DashboardCardShell } from "@/components/shared/dashboard-card-shell";
import { formatRelativeTime } from "@/lib/hr/format";
import type { RecentlyUpdatedApplication } from "@/lib/hr/dashboard-data";

export function RecentlyUpdatedApplicationsCard({
  applications,
}: {
  applications: RecentlyUpdatedApplication[];
}) {
  return (
    <DashboardCardShell title="Recently Updated" href="/hr/applications">
      {applications.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-white">No updates yet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Application changes will show up here as your team reviews candidates.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {applications.map((application) => (
            <li key={application.id}>
              <Link
                href={`/hr/applications/${application.id}`}
                className="block px-6 py-4 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {application.candidateName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {application.jobTitle}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Updated {formatRelativeTime(application.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCardShell>
  );
}
