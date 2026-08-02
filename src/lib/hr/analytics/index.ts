import "server-only";

import { buildMonthlyApplicationCounts } from "@/lib/hr/analytics/helpers";
import { fetchRecentActivity, fetchReviewTimeDeltasDays, fetchUpcomingInterviews } from "@/lib/hr/analytics/activity";
import { buildHiringFunnel, buildQuickInsights, buildTopJobsByApplications } from "@/lib/hr/analytics/insights";
import { fetchRecentLists } from "@/lib/hr/analytics/recent-lists";
import { fetchAnalyticsCounts, fetchJobTitlesById } from "@/lib/hr/analytics/stats";
import type { AnalyticsDashboardData } from "@/lib/hr/analytics/types";

export type { AnalyticsDashboardData } from "@/lib/hr/analytics/types";
export type {
  AnalyticsStats,
  AnalyticsActivityItem,
  MonthlyApplicationCount,
  StatusDistribution,
  TopJobByApplications,
  HiringFunnelStage,
  UpcomingInterview,
  QuickInsights,
  RecentApplication,
  RecentJob,
  RecentlyUpdatedApplication,
} from "@/lib/hr/analytics/types";

/**
 * Loads every dataset the HR analytics dashboard needs in parallel.
 * All reads use the caller's authenticated Supabase session (RLS-scoped).
 */
export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  const [counts, recentActivity, upcomingInterviews, reviewTimeDeltasDays, recentLists] =
    await Promise.all([
      fetchAnalyticsCounts(),
      fetchRecentActivity(),
      fetchUpcomingInterviews(),
      fetchReviewTimeDeltasDays(),
      fetchRecentLists(),
    ]);

  const { stats, statusDistribution, submittedAts, jobApplicationCounts } = counts;
  const jobTitles = await fetchJobTitlesById([...jobApplicationCounts.keys()]);

  return {
    stats,
    statusDistribution,
    applicationsPerMonth: buildMonthlyApplicationCounts(submittedAts),
    topJobsByApplications: buildTopJobsByApplications(jobApplicationCounts, jobTitles),
    hiringFunnel: buildHiringFunnel(stats, statusDistribution),
    recentActivity,
    upcomingInterviews,
    quickInsights: buildQuickInsights({
      totalJobs: stats.totalJobs,
      totalApplications: stats.totalApplications,
      hiredCandidates: stats.hiredCandidates,
      interviewStageCount: statusDistribution.interview,
      jobApplicationCounts,
      jobTitles,
      reviewTimeDeltasDays,
    }),
    ...recentLists,
  };
}
