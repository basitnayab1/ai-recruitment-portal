import "server-only";

import type { HiringFunnelStage, TopJobByApplications } from "@/lib/hr/analytics/types";
import type { StatusDistribution } from "@/lib/hr/analytics/types";
import { TOP_JOBS_CHART_LIMIT } from "@/lib/hr/analytics/helpers";

export function buildTopJobsByApplications(
  jobApplicationCounts: Map<string, number>,
  jobTitles: Map<string, string>
): TopJobByApplications[] {
  return [...jobApplicationCounts.entries()]
    .map(([jobId, count]) => ({
      jobId,
      jobTitle: jobTitles.get(jobId) ?? "Unknown role",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.jobTitle.localeCompare(b.jobTitle))
    .slice(0, TOP_JOBS_CHART_LIMIT);
}

export function buildHiringFunnel(
  stats: { totalApplications: number },
  distribution: StatusDistribution
): HiringFunnelStage[] {
  return [
    { key: "applied", label: "Applied", count: stats.totalApplications },
    { key: "under_review", label: "Under Review", count: distribution.hr_review },
    { key: "shortlisted", label: "Shortlisted", count: distribution.ai_shortlisted },
    { key: "interview", label: "Interview", count: distribution.interview },
    { key: "hired", label: "Hired", count: distribution.hired },
  ];
}

export function buildQuickInsights({
  totalJobs,
  totalApplications,
  hiredCandidates,
  interviewStageCount,
  jobApplicationCounts,
  jobTitles,
  reviewTimeDeltasDays,
}: {
  totalJobs: number;
  totalApplications: number;
  hiredCandidates: number;
  interviewStageCount: number;
  jobApplicationCounts: Map<string, number>;
  jobTitles: Map<string, string>;
  reviewTimeDeltasDays: number[];
}) {
  let mostActiveJobTitle: string | null = null;
  let mostActiveJobApplications = 0;

  for (const [jobId, count] of jobApplicationCounts.entries()) {
    if (count > mostActiveJobApplications) {
      mostActiveJobApplications = count;
      mostActiveJobTitle = jobTitles.get(jobId) ?? "Unknown role";
    }
  }

  const averageReviewTimeDays =
    reviewTimeDeltasDays.length > 0
      ? Math.round(
          (reviewTimeDeltasDays.reduce((sum, days) => sum + days, 0) / reviewTimeDeltasDays.length) * 10
        ) / 10
      : null;

  return {
    averageApplicationsPerJob:
      totalJobs > 0 ? Math.round((totalApplications / totalJobs) * 10) / 10 : 0,
    hiringRatePercent:
      totalApplications > 0 ? Math.round((hiredCandidates / totalApplications) * 1000) / 10 : null,
    interviewConversionRatePercent:
      interviewStageCount > 0
        ? Math.round((hiredCandidates / interviewStageCount) * 1000) / 10
        : null,
    mostActiveJobTitle,
    mostActiveJobApplications,
    averageReviewTimeDays,
  };
}
