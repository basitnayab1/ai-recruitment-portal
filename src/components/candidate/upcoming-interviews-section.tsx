"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck, ExternalLink, Video } from "lucide-react";
import type { CandidateInterview } from "@/lib/candidate/interview-data";
import { InterviewStatusBadge } from "@/components/hr/interview-status-badge";
import { BTN_ACCENT, CARD_HEADER, CARD_HEADER_LINK, DASHBOARD_CARD } from "@/lib/ui/classes";

export function UpcomingInterviewsSection({
  interviews,
}: {
  interviews: CandidateInterview[];
}) {
  const upcoming = interviews.filter((i) => i.status === "scheduled").slice(0, 3);

  return (
    <div className={DASHBOARD_CARD}>
      <div className={CARD_HEADER}>
        <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Upcoming Interviews
        </h2>
        <Link href="/candidate/interviews" className={CARD_HEADER_LINK}>
          View all →
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/40">
            <CalendarCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            No interviews scheduled
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            When HR schedules an interview, it will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4 p-6 pt-2">
          {upcoming.map((interview, index) => (
            <motion.li
              key={interview.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.35 }}
              whileHover={{ scale: 1.01 }}
              className="rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-white to-violet-50/30 p-5 shadow-sm dark:border-zinc-800/60 dark:from-zinc-900/80 dark:to-violet-950/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-50">{interview.jobTitle}</p>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{interview.company}</p>
                </div>
                <InterviewStatusBadge status={interview.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase">Date</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">
                    {interview.interviewDateLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase">Time</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">
                    {interview.interviewTimeLabel}
                  </dd>
                </div>
              </dl>
              {interview.meetingLink && interview.interviewType === "online" ? (
                <a
                  href={interview.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BTN_ACCENT} mt-4 inline-flex h-10 w-auto px-4`}
                >
                  <Video className="h-4 w-4" aria-hidden="true" />
                  Join Meeting
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                </a>
              ) : null}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
