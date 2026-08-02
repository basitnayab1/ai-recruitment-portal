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
  candidate_registered: "border border-violet-400/30 bg-violet-500/15 text-violet-200",
  application_submitted: "border border-blue-400/30 bg-blue-500/15 text-blue-200",
  interview_scheduled: "border border-amber-400/30 bg-amber-500/15 text-amber-200",
  interview_rescheduled: "border border-orange-400/30 bg-orange-500/15 text-orange-200",
  candidate_hired: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  candidate_rejected: "border border-red-400/30 bg-red-500/15 text-red-300",
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
          <p className="text-sm text-zinc-400">
            Activity from candidates, applications, interviews, and hiring decisions will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {activity.map((item) => (
            <li key={item.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm text-white">
                  {ACTIVITY_COPY[item.type](item)}
                </p>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${ACTIVITY_BADGE[item.type]}`}
                >
                  {ACTIVITY_LABEL[item.type]}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {formatRelativeTime(item.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCardShell>
  );
}
