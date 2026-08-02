import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { KPI_HERO_CARD, KPI_ICON_GRADIENTS, TREND_DOWN, TREND_UP } from "@/lib/ui/classes";

type StatCardProps = {
  label: string;
  value: number;
  icon?: LucideIcon;
  variant?: "hero" | "compact";
  colorIndex?: number;
  trend?: { value: number; positive: boolean; label?: string };
};

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = "compact",
  colorIndex = 0,
  trend,
}: StatCardProps) {
  const gradient = KPI_ICON_GRADIENTS[colorIndex % KPI_ICON_GRADIENTS.length];

  if (variant === "hero") {
    return (
      <div className={KPI_HERO_CARD}>
        <div
          className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/5 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              {label}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white tabular-nums sm:text-5xl">
              {value.toLocaleString()}
            </p>
            {trend ? (
              <div className="mt-3 flex items-center gap-2">
                <span className={trend.positive ? TREND_UP : TREND_DOWN}>
                  {trend.positive ? (
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  )}
                  {trend.positive ? "+" : "-"}
                  {trend.value}%
                </span>
                {trend.label ? (
                  <span className="text-xs text-zinc-400">{trend.label}</span>
                ) : null}
              </div>
            ) : null}
          </div>
          {Icon ? (
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${gradient}`}
            >
              <Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/35">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          {label}
        </p>
        {Icon ? (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}
          >
            <Icon className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
