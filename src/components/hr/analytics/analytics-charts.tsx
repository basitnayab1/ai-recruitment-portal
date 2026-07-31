import type { ReactNode } from "react";
import type { HiringFunnelStage, TopJobByApplications } from "@/lib/hr/analytics/types";
import { CHART_CARD } from "@/lib/ui/classes";

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

export function TopJobsByApplicationsChart({ data }: { data: TopJobByApplications[] }) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0);
  const max = Math.max(...data.map((entry) => entry.count), 1);

  return (
    <ChartCard
      title="Top Jobs by Applications"
      description="Highest volume roles in your pipeline"
      emptyMessage="No applications have been submitted yet."
      isEmpty={total === 0}
    >
      <ul className="space-y-4">
        {data.map((entry) => {
          const percent = Math.round((entry.count / max) * 100);

          return (
            <li key={entry.jobId}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-zinc-600 dark:text-zinc-400">
                  {entry.jobTitle}
                </span>
                <span className="shrink-0 font-bold text-zinc-900 dark:text-zinc-50">
                  {entry.count}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
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

export function HiringFunnelChart({ stages }: { stages: HiringFunnelStage[] }) {
  const max = Math.max(...stages.map((stage) => stage.count), 1);
  const hasData = stages.some((stage) => stage.count > 0);

  const funnelColors = [
    "from-violet-500 to-violet-400",
    "from-indigo-500 to-indigo-400",
    "from-blue-500 to-blue-400",
    "from-cyan-500 to-cyan-400",
    "from-emerald-500 to-emerald-400",
  ];

  return (
    <ChartCard
      title="Hiring Funnel"
      description="Applied → Under Review → Shortlisted → Interview → Hired"
      emptyMessage="No applications in the pipeline yet."
      isEmpty={!hasData}
    >
      <div className="space-y-5">
        {stages.map((stage, index) => {
          const percent = stage.count === 0 ? 0 : Math.max(Math.round((stage.count / max) * 100), 6);
          const color = funnelColors[index % funnelColors.length];

          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                  {index + 1}. {stage.label}
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-50">{stage.count}</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${color}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
