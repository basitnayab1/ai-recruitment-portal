import Link from "next/link";
import type { CandidateApplicationSummary } from "@/lib/candidate/dashboard-data";
import { formatDate } from "@/lib/hr/format";
import { StatusBadge } from "@/components/hr/status-badge";
import { EmptyState } from "@/components/hr/empty-state";
import { ApplicationsIcon } from "@/components/hr/icons";
import { BTN_PRIMARY, CARD_HEADER_LINK, CHART_CARD } from "@/lib/ui/classes";

export function ApplicationsCard({
  applications,
}: {
  applications: CandidateApplicationSummary[];
}) {
  return (
    <div className={CHART_CARD}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Applications</h2>
        {applications.length > 0 ? (
          <Link href="/candidate/applications" className={`${CARD_HEADER_LINK} text-sm`}>
            View All
          </Link>
        ) : null}
      </div>

      {applications.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ApplicationsIcon}
            title="No applications submitted yet."
            description="When you apply for a job, it will show up here so you can track its status."
          />
          <div className="mt-4 flex justify-center">
            <Link href="/jobs" className={BTN_PRIMARY}>
              Browse Jobs
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-900">
          {applications.map((application) => (
            <li
              key={application.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {application.jobTitle}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Applied {formatDate(application.submittedAt)}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
