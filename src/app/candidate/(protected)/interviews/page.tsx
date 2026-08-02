import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { getCandidateInterviews } from "@/lib/candidate/interview-data";
import { EmptyState } from "@/components/hr/empty-state";
import { InterviewStatusBadge } from "@/components/hr/interview-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { BTN_ACCENT, DETAIL_SECTION, PAGE_STACK } from "@/lib/ui/classes";
import { MotionFadeIn } from "@/components/candidate/ui/motion-wrapper";

export const metadata: Metadata = {
  title: "My Interviews | AI Recruitment Portal",
};

export default async function CandidateInterviewsPage() {
  const profile = await requireCandidateUser();
  const interviews = await getCandidateInterviews(profile.id);
  const upcoming = interviews.filter((interview) => interview.status === "scheduled");

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="My Interviews"
        description="View your scheduled interviews and join online meetings."
      />

      {upcoming.length > 0 ? (
        <p className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-200">
          You have {upcoming.length} upcoming interview{upcoming.length === 1 ? "" : "s"}.
        </p>
      ) : null}

      {interviews.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No interviews scheduled"
          description="When HR schedules an interview for your application, the details will appear here."
        />
      ) : (
        <ul className="space-y-5">
          {interviews.map((interview, index) => (
            <MotionFadeIn key={interview.id} delay={index * 0.06}>
              <li className={DETAIL_SECTION}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-white">
                        {interview.jobTitle}
                      </h2>
                      <InterviewStatusBadge status={interview.status} />
                    </div>
                    <p className="text-sm text-zinc-200">
                      {interview.company}
                      {interview.department ? ` · ${interview.department}` : ""}
                    </p>
                  </div>

                  {interview.status === "scheduled" &&
                  interview.interviewType === "online" &&
                  interview.meetingLink ? (
                    <a
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${BTN_ACCENT} shrink-0`}
                    >
                      Join Meeting
                    </a>
                  ) : null}
                </div>

                <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Date</dt>
                    <dd className="mt-1 text-sm font-semibold text-white">
                      {interview.interviewDateLabel}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Time</dt>
                    <dd className="mt-1 text-sm font-semibold text-white">
                      {interview.interviewTimeLabel}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Status</dt>
                    <dd className="mt-1">
                      <InterviewStatusBadge status={interview.status} />
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Type</dt>
                    <dd className="mt-1 text-sm font-semibold text-white">
                      {interview.typeLabel}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Duration</dt>
                    <dd className="mt-1 text-sm font-semibold text-white">
                      {interview.durationLabel}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Interviewer</dt>
                    <dd className="mt-1 text-sm font-semibold text-white">
                      {interview.interviewerName}
                    </dd>
                  </div>
                  {interview.meetingLink ? (
                    <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4 sm:col-span-2 lg:col-span-3">
                      <dt className="text-xs font-bold tracking-wider text-violet-300 uppercase">
                        Meeting Link
                      </dt>
                      <dd className="mt-1 break-all text-sm">
                        <Link
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-violet-300 hover:underline"
                        >
                          {interview.meetingLink}
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                  {interview.officeLocation ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2 lg:col-span-3">
                      <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                        Office Location
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-white">
                        {interview.officeLocation}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            </MotionFadeIn>
          ))}
        </ul>
      )}
    </div>
  );
}
