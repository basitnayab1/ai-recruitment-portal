import { APPLICATION_STATUSES, APPLICATION_STATUS_META } from "@/lib/hr/status";
import { CHART_CARD } from "@/lib/ui/classes";
import type { StatusDistribution } from "@/lib/hr/dashboard-data";

export function StatusDistributionCard({
  distribution,
  total,
}: {
  distribution: StatusDistribution;
  total: number;
}) {
  return (
    <div className={CHART_CARD}>
      <h2 className="text-base font-semibold text-white">Application Status</h2>

      {total === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">
          No applications have been submitted yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {APPLICATION_STATUSES.map((status) => {
            const count = distribution[status];
            const meta = APPLICATION_STATUS_META[status];
            const percent = Math.round((count / total) * 100);

            return (
              <li key={status}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-200">{meta.label}</span>
                  <span className="font-medium text-white">{count}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${meta.barClassName}`}
                    style={{ width: `${percent}%` }}
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${meta.label}: ${percent}%`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
