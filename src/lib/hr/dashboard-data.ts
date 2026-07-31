import "server-only";

export {
  getAnalyticsDashboardData,
  getAnalyticsDashboardData as getDashboardData,
  type AnalyticsDashboardData,
  type AnalyticsDashboardData as DashboardData,
  type AnalyticsStats,
  type AnalyticsStats as DashboardStats,
  type AnalyticsActivityItem,
  type MonthlyApplicationCount,
  type StatusDistribution,
  type TopJobByApplications,
  type HiringFunnelStage,
  type UpcomingInterview,
  type QuickInsights,
  type RecentApplication,
  type RecentJob,
  type RecentlyUpdatedApplication,
} from "@/lib/hr/analytics";
