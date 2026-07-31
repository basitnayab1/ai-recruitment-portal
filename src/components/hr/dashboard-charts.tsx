import type { ReactNode } from "react";
import { CHART_CARD } from "@/lib/ui/classes";
import { APPLICATION_STATUSES, APPLICATION_STATUS_META } from "@/lib/hr/status";
import type {
  MonthlyApplicationCount,
  StatusDistribution,
} from "@/lib/hr/analytics/types";

type DepartmentJobCount = {
  department: string;
  count: number;
};

function ChartCard({
  title,
  description,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  description?: string;
  emptyMessage: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <div className={CHART_CARD}>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      {isEmpty ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
      ) : (
        <div className="mt-8">{children}</div>
      )}
    </div>
  );
}

export function ApplicationsPerMonthChart({ data }: { data: MonthlyApplicationCount[] }) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0);
  const max = Math.max(...data.map((entry) => entry.count), 1);

  return (
    <ChartCard
      title="Applications per Month"
      description="Last 6 months of applicant volume"
      emptyMessage="No applications submitted in the last 6 months."
      isEmpty={total === 0}
    >
      <div className="flex h-56 items-end gap-3 sm:gap-4">
        {data.map((entry) => {
          const heightPercent = entry.count === 0 ? 0 : Math.max((entry.count / max) * 100, 6);

          return (
            <div key={entry.monthKey} className="group flex min-w-0 flex-1 flex-col items-center gap-3">
              <span className="text-sm font-bold text-zinc-700 tabular-nums dark:text-zinc-300">
                {entry.count}
              </span>
              <div className="flex h-44 w-full items-end">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-violet-600 to-violet-400 shadow-[0_-4px_20px_rgba(124,58,237,0.3)] transition-all duration-300 group-hover:from-violet-500 group-hover:to-violet-300 dark:from-violet-500 dark:to-violet-300"
                  style={{ height: `${heightPercent}%` }}
                  title={`${entry.month}: ${entry.count}`}
                />
              </div>
              <span className="truncate text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {entry.month}
              </span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

export function ApplicationsByStatusChart({
  distribution,
  total,
}: {
  distribution: StatusDistribution;
  total: number;
}) {
  const activeStatuses = APPLICATION_STATUSES.filter((status) => distribution[status] > 0);

  return (
    <ChartCard
      title="Applications by Status"
      description="Current pipeline breakdown"
      emptyMessage="No applications have been submitted yet."
      isEmpty={total === 0}
    >
      <ul className="space-y-4">
        {activeStatuses.map((status) => {
          const count = distribution[status];
          const meta = APPLICATION_STATUS_META[status];
          const percent = Math.round((count / total) * 100);

          return (
            <li key={status}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">{meta.label}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-50">
                  {count}{" "}
                  <span className="text-xs font-normal text-zinc-400">({percent}%)</span>
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${meta.barClassName}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

export function JobsByDepartmentChart({ data }: { data: DepartmentJobCount[] }) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0);
  const max = Math.max(...data.map((entry) => entry.count), 1);

  return (
    <ChartCard
      title="Jobs by Department"
      description="Openings grouped by department"
      emptyMessage="No jobs have been created yet."
      isEmpty={total === 0}
    >
      <ul className="space-y-4">
        {data.map((entry) => {
          const percent = Math.round((entry.count / max) * 100);

          return (
            <li key={entry.department}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-zinc-600 dark:text-zinc-400">
                  {entry.department}
                </span>
                <span className="shrink-0 font-bold text-zinc-900 dark:text-zinc-50">
                  {entry.count}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
