import type { Metadata } from "next";
import { requireHRUser } from "@/lib/auth/dal";
import { getAnalyticsDashboardData } from "@/lib/hr/analytics";
import { DashboardQuickActions } from "@/components/hr/dashboard-quick-actions";
import {
  ApplicationsByStatusChart,
  ApplicationsPerMonthChart,
} from "@/components/hr/dashboard-charts";
import { AnalyticsOverviewCards } from "@/components/hr/analytics/analytics-overview-cards";
import {
  HiringFunnelChart,
  TopJobsByApplicationsChart,
} from "@/components/hr/analytics/analytics-charts";
import { QuickInsightsCard } from "@/components/hr/analytics/quick-insights-card";
import { UpcomingInterviewsCard } from "@/components/hr/analytics/upcoming-interviews-card";
import { AnalyticsActivityCard } from "@/components/hr/analytics/analytics-activity-card";
import { RecentApplicationsCard } from "@/components/hr/recent-applications-card";
import { RecentJobsCard } from "@/components/hr/recent-jobs-card";
import { RecentlyUpdatedApplicationsCard } from "@/components/hr/recently-updated-applications-card";
import { DASHBOARD_SECTION, PAGE_DESCRIPTION, PAGE_TITLE, SURFACE_CARD } from "@/lib/ui/classes";
import { formatLongDisplayDate } from "@/lib/format/display-dates";

export const metadata: Metadata = {
  title: "HR Dashboard | AI Recruitment Portal",
};

export default async function HRDashboardPage() {
  const profile = await requireHRUser();
  const {
    stats,
    statusDistribution,
    applicationsPerMonth,
    topJobsByApplications,
    hiringFunnel,
    recentActivity,
    upcomingInterviews,
    quickInsights,
    recentApplications,
    recentJobs,
    recentlyUpdatedApplications,
  } = await getAnalyticsDashboardData();

  const firstName = profile.fullName.split(" ")[0];
  const today = formatLongDisplayDate();

  return (
    <div className={DASHBOARD_SECTION}>
      {/* Hero header */}
      <div className={`relative ${SURFACE_CARD} overflow-hidden p-8 sm:p-10`}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5" aria-hidden="true" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-300">{today}</p>
            <h1 className={`${PAGE_TITLE} mt-1`}>Welcome back, {firstName}</h1>
            <p className={PAGE_DESCRIPTION}>
              Your recruitment command center — track pipeline health, interviews, and hiring
              velocity at a glance.
            </p>
          </div>
          <DashboardQuickActions />
        </div>
      </div>

      {/* KPI statistics */}
      <AnalyticsOverviewCards stats={stats} applicationsPerMonth={applicationsPerMonth} />

      {/* Charts — large 2-column grid */}
      <div>
        <h2 className="mb-5 text-lg font-bold tracking-tight text-white">
          Analytics
        </h2>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ApplicationsPerMonthChart data={applicationsPerMonth} />
          <ApplicationsByStatusChart distribution={statusDistribution} total={stats.totalApplications} />
          <TopJobsByApplicationsChart data={topJobsByApplications} />
          <HiringFunnelChart stages={hiringFunnel} />
        </div>
      </div>

      {/* Insights row */}
      <QuickInsightsCard insights={quickInsights} />

      {/* Interviews & activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <UpcomingInterviewsCard interviews={upcomingInterviews} />
        <AnalyticsActivityCard activity={recentActivity} />
      </div>

      {/* Recent applications — full width */}
      <RecentApplicationsCard applications={recentApplications} />

      {/* Jobs & updates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentJobsCard jobs={recentJobs} />
        <RecentlyUpdatedApplicationsCard applications={recentlyUpdatedApplications} />
      </div>
    </div>
  );
}
