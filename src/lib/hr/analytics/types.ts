import type { JobStatus } from "@/lib/hr/jobs";
import type { ApplicationStatus } from "@/lib/hr/status";
import type { InterviewStatus, InterviewType } from "@/lib/hr/interviews";

export type AnalyticsStats = {
  totalJobs: number;
  activeJobs: number;
  closedJobs: number;
  totalCandidates: number;
  totalApplications: number;
  pendingApplications: number;
  underReview: number;
  shortlisted: number;
  interviewsScheduled: number;
  hiredCandidates: number;
  rejectedCandidates: number;
};

export type StatusDistribution = Record<ApplicationStatus, number>;

export type MonthlyApplicationCount = {
  month: string;
  monthKey: string;
  count: number;
};

export type TopJobByApplications = {
  jobId: string;
  jobTitle: string;
  count: number;
};

export type HiringFunnelStage = {
  key: string;
  label: string;
  count: number;
};

export type AnalyticsActivityType =
  | "candidate_registered"
  | "application_submitted"
  | "interview_scheduled"
  | "interview_rescheduled"
  | "candidate_hired"
  | "candidate_rejected";

export type AnalyticsActivityItem = {
  id: string;
  type: AnalyticsActivityType;
  candidateName: string;
  jobTitle: string | null;
  createdAt: string;
};

export type UpcomingInterview = {
  id: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: InterviewType;
  status: InterviewStatus;
};

export type QuickInsights = {
  averageApplicationsPerJob: number;
  hiringRatePercent: number | null;
  interviewConversionRatePercent: number | null;
  mostActiveJobTitle: string | null;
  mostActiveJobApplications: number;
  averageReviewTimeDays: number | null;
};

export type RecentApplication = {
  id: string;
  candidateName: string;
  jobTitle: string;
  status: ApplicationStatus;
  aiScore: number | null;
  submittedAt: string;
};

export type RecentJob = {
  id: string;
  title: string;
  department: string | null;
  status: JobStatus;
  createdAt: string;
};

export type RecentlyUpdatedApplication = {
  id: string;
  candidateName: string;
  jobTitle: string;
  status: ApplicationStatus;
  updatedAt: string;
};

export type AnalyticsDashboardData = {
  stats: AnalyticsStats;
  statusDistribution: StatusDistribution;
  applicationsPerMonth: MonthlyApplicationCount[];
  topJobsByApplications: TopJobByApplications[];
  hiringFunnel: HiringFunnelStage[];
  recentActivity: AnalyticsActivityItem[];
  upcomingInterviews: UpcomingInterview[];
  quickInsights: QuickInsights;
  recentApplications: RecentApplication[];
  recentJobs: RecentJob[];
  recentlyUpdatedApplications: RecentlyUpdatedApplication[];
};
