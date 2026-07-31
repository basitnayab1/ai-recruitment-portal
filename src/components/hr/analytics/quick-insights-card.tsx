import type { QuickInsights } from "@/lib/hr/analytics/types";
import { CHART_CARD, FILTER_LABEL, INSIGHT_TILE } from "@/lib/ui/classes";

function InsightItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className={`${INSIGHT_TILE} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
      <p className={FILTER_LABEL}>{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {detail ? (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
      ) : null}
    </div>
  );
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${value}%`;
}

export function QuickInsightsCard({ insights }: { insights: QuickInsights }) {
  return (
    <div className={CHART_CARD}>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Quick Insights
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Key recruitment metrics calculated from your live pipeline data.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <InsightItem
          label="Avg. Applications / Job"
          value={insights.averageApplicationsPerJob.toLocaleString()}
        />
        <InsightItem label="Hiring Rate" value={formatPercent(insights.hiringRatePercent)} />
        <InsightItem
          label="Interview Conversion"
          value={formatPercent(insights.interviewConversionRatePercent)}
          detail="Hired ÷ interview-stage applications"
        />
        <InsightItem
          label="Most Active Job"
          value={insights.mostActiveJobTitle ?? "—"}
          detail={
            insights.mostActiveJobTitle
              ? `${insights.mostActiveJobApplications} application${insights.mostActiveJobApplications === 1 ? "" : "s"}`
              : undefined
          }
        />
        <InsightItem
          label="Avg. Review Time"
          value={
            insights.averageReviewTimeDays === null
              ? "—"
              : `${insights.averageReviewTimeDays} day${insights.averageReviewTimeDays === 1 ? "" : "s"}`
          }
          detail="From application to first review"
        />
      </div>
    </div>
  );
}
