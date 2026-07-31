import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CalendarCheck,
  ClipboardList,
  FileText,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/hr/stat-card";
import type { AnalyticsStats, MonthlyApplicationCount } from "@/lib/hr/analytics/types";

const HERO_CARDS: {
  key: keyof AnalyticsStats;
  label: string;
  icon: LucideIcon;
  colorIndex: number;
  trendKey?: "applications" | "hired";
}[] = [
  { key: "totalApplications", label: "Total Applications", icon: FileText, colorIndex: 0, trendKey: "applications" },
  { key: "activeJobs", label: "Active Jobs", icon: Briefcase, colorIndex: 1 },
  { key: "totalCandidates", label: "Total Candidates", icon: Users, colorIndex: 2 },
  { key: "interviewsScheduled", label: "Interviews Scheduled", icon: CalendarCheck, colorIndex: 3 },
];

const SECONDARY_CARDS: {
  key: keyof AnalyticsStats;
  label: string;
  icon: LucideIcon;
  colorIndex: number;
  showHiredTrend?: boolean;
}[] = [
  { key: "totalJobs", label: "Total Jobs", icon: Briefcase, colorIndex: 4 },
  { key: "closedJobs", label: "Closed Jobs", icon: XCircle, colorIndex: 5 },
  { key: "pendingApplications", label: "Pending", icon: ClipboardList, colorIndex: 0 },
  { key: "underReview", label: "Under Review", icon: UserPlus, colorIndex: 1 },
  { key: "shortlisted", label: "Shortlisted", icon: Star, colorIndex: 2 },
  { key: "hiredCandidates", label: "Hired", icon: UserCheck, colorIndex: 3, showHiredTrend: true },
  { key: "rejectedCandidates", label: "Rejected", icon: UserMinus, colorIndex: 4 },
];

function computeMonthTrend(
  months: MonthlyApplicationCount[]
): { value: number; positive: boolean; label: string } | undefined {
  if (months.length < 2) return undefined;
  const last = months[months.length - 1].count;
  const prev = months[months.length - 2].count;
  if (prev === 0 && last === 0) return undefined;
  if (prev === 0) return { value: 100, positive: true, label: "vs last month" };
  const change = Math.round(((last - prev) / prev) * 100);
  return { value: Math.abs(change), positive: change >= 0, label: "vs last month" };
}

function computeHiredTrend(
  stats: AnalyticsStats
): { value: number; positive: boolean; label: string } | undefined {
  if (stats.totalApplications === 0) return undefined;
  const rate = Math.round((stats.hiredCandidates / stats.totalApplications) * 100);
  return { value: rate, positive: true, label: "hire rate" };
}

export function AnalyticsOverviewCards({
  stats,
  applicationsPerMonth = [],
}: {
  stats: AnalyticsStats;
  applicationsPerMonth?: MonthlyApplicationCount[];
}) {
  const appTrend = computeMonthTrend(applicationsPerMonth);
  const hiredTrend = computeHiredTrend(stats);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {HERO_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={stats[card.key]}
            icon={card.icon}
            variant="hero"
            colorIndex={card.colorIndex}
            trend={
              card.trendKey === "applications"
                ? appTrend
                : card.trendKey === "hired"
                  ? hiredTrend
                  : undefined
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {SECONDARY_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={stats[card.key]}
            icon={card.icon}
            variant="compact"
            colorIndex={card.colorIndex}
            trend={card.showHiredTrend ? hiredTrend : undefined}
          />
        ))}
      </div>
    </div>
  );
}
