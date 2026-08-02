"use client";

import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight, DollarSign } from "lucide-react";
import type { LatestJobSummary } from "@/lib/candidate/dashboard-data";
import { formatDate } from "@/lib/hr/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { CARD_HEADER, CARD_HEADER_LINK, DASHBOARD_CARD, SURFACE_CARD_INTERACTIVE } from "@/lib/ui/classes";
import { MotionStagger, MotionStaggerItem } from "@/components/candidate/ui/motion-wrapper";

function JobListingCard({ job }: { job: LatestJobSummary }) {
  return (
    <MotionStaggerItem>
      <div className={`flex h-full flex-col p-5 ${SURFACE_CARD_INTERACTIVE}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/20">
            <Briefcase className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 uppercase dark:bg-violet-950/50">
            {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </span>
        </div>

        <h3 className="mt-4 text-base font-bold text-white">{job.title}</h3>
        <p className="mt-1 text-xs font-medium text-zinc-400">RecruitAI</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-200 dark:bg-zinc-800">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {job.isRemote ? "Remote" : (job.location ?? "TBD")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-200 dark:bg-zinc-800">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {job.postedAt ? formatDate(job.postedAt) : "New"}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700"
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            href={`/candidate/apply/${job.id}`}
            className="rounded-lg bg-gradient-to-b from-violet-600 to-violet-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:from-violet-500 hover:to-violet-600"
          >
            Apply
          </Link>
        </div>
      </div>
    </MotionStaggerItem>
  );
}

export function LatestJobsCard({ jobs }: { jobs: LatestJobSummary[] }) {
  return (
    <div className={DASHBOARD_CARD}>
      <div className={CARD_HEADER}>
        <h2 className="text-base font-bold tracking-tight text-white">
          Recommended Jobs
        </h2>
        <Link href="/jobs" className={CARD_HEADER_LINK}>
          Browse all →
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
            <DollarSign className="h-6 w-6 text-emerald-300" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-semibold text-white">No open positions</p>
          <p className="mt-1 text-sm text-zinc-400">Check back soon for new opportunities.</p>
        </div>
      ) : (
        <MotionStagger className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobListingCard key={job.id} job={job} />
          ))}
        </MotionStagger>
      )}
    </div>
  );
}
