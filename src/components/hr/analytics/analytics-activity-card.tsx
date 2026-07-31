import Link from "next/link";
import type { AnalyticsActivityItem } from "@/lib/hr/analytics/types";
import { DashboardCardShell } from "@/components/shared/dashboard-card-shell";
import { formatRelativeTime } from "@/lib/hr/format";

const ACTIVITY_COPY: Record<
  AnalyticsActivityItem["type"],
  (item: AnalyticsActivityItem) => string
> = {
  candidate_registered: (item) => `${item.candidateName} registered as a new candidate`,
  application_submitted: (item) =>
    `${item.candidateName} submitted an application for ${item.jobTitle ?? "a role"}`,
  interview_scheduled: (item) =>
    `Interview scheduled for ${item.candidateName} · ${item.jobTitle ?? "Unknown role"}`,
  interview_rescheduled: (item) =>
    `Interview rescheduled for ${item.candidateName} · ${item.jobTitle ?? "Unknown role"}`,
  candidate_hired: (item) =>
    `${item.candidateName} was hired for ${item.jobTitle ?? "a role"}`,
  candidate_rejected: (item) =>
    `${item.candidateName} was rejected for ${item.jobTitle ?? "a role"}`,
};

const ACTIVITY_BADGE: Record<AnalyticsActivityItem["type"], string> = {
  candidate_registered:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  application_submitted: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  interview_scheduled: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  interview_rescheduled: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  candidate_hired: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  candidate_rejected: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const ACTIVITY_LABEL: Record<AnalyticsActivityItem["type"], string> = {
  candidate_registered: "New Candidate",
  application_submitted: "Application",
  interview_scheduled: "Interview",
  interview_rescheduled: "Rescheduled",
  candidate_hired: "Hired",
  candidate_rejected: "Rejected",
};

export function AnalyticsActivityCard({ activity }: { activity: AnalyticsActivityItem[] }) {
  return (
    <DashboardCardShell title="Recent Activity" href="/hr/applications" linkLabel="View applications">
      {activity.length === 0 ? (
        <div className="px-6 py-10">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Activity from candidates, applications, interviews, and hiring decisions will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {activity.map((item) => (
            <li key={item.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm text-zinc-900 dark:text-zinc-50">
                  {ACTIVITY_COPY[item.type](item)}
                </p>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${ACTIVITY_BADGE[item.type]}`}
                >
                  {ACTIVITY_LABEL[item.type]}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {formatRelativeTime(item.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCardShell>
  );
}
