import type { Metadata } from "next";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { getCandidateDashboardData, getProfileCompletion } from "@/lib/candidate/dashboard-data";
import { getCandidateProfileDetails } from "@/lib/candidate/profile-data";
import { getCandidateResume } from "@/lib/candidate/resume-data";
import { getCandidateUpcomingInterviews } from "@/lib/candidate/interview-data";
import { DashboardHero } from "@/components/candidate/dashboard-hero";
import { DashboardStatCards } from "@/components/candidate/dashboard-stat-cards";
import { DashboardQuickActions } from "@/components/candidate/dashboard-quick-actions";
import { ActivityTimeline } from "@/components/candidate/activity-timeline";
import { UpcomingInterviewsSection } from "@/components/candidate/upcoming-interviews-section";
import { LatestJobsCard } from "@/components/candidate/latest-jobs-card";
import { ProfileUpdatedToast } from "@/components/candidate/profile-updated-toast";
import { MotionFadeIn } from "@/components/candidate/ui/motion-wrapper";
import { formatLongDisplayDate } from "@/lib/format/display-dates";
import { PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "My Dashboard | AI Recruitment Portal",
};

export default async function CandidateDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const profile = await requireCandidateUser();

  const [{ applications, stats, latestJobs }, details, resume, upcomingInterviews, { updated }] =
    await Promise.all([
      getCandidateDashboardData(profile),
      getCandidateProfileDetails(profile.id),
      getCandidateResume(profile.id),
      getCandidateUpcomingInterviews(profile.id),
      searchParams,
    ]);

  const completion = getProfileCompletion(profile, details);
  const interviewsScheduled = upcomingInterviews.length;
  const todayLabel = formatLongDisplayDate();

  return (
    <div className={PAGE_STACK}>
      {updated === "1" ? <ProfileUpdatedToast /> : null}

      <DashboardHero fullName={profile.fullName} todayLabel={todayLabel} />

      <DashboardStatCards
        applicationsCount={stats.total}
        interviewsCount={interviewsScheduled}
        completionPercentage={completion.percentage}
        hasResume={Boolean(resume)}
      />

      <MotionFadeIn delay={0.15}>
        <DashboardQuickActions />
      </MotionFadeIn>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MotionFadeIn delay={0.2}>
          <ActivityTimeline applications={applications} />
        </MotionFadeIn>
        <MotionFadeIn delay={0.25}>
          <UpcomingInterviewsSection interviews={upcomingInterviews} />
        </MotionFadeIn>
      </div>

      <MotionFadeIn delay={0.3}>
        <LatestJobsCard jobs={latestJobs} />
      </MotionFadeIn>
    </div>
  );
}
