"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, MapPin, Clock } from "lucide-react";
import { formatDate } from "@/lib/hr/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { Badge } from "@/components/ui/badge";
import type { FeaturedJob } from "@/lib/public/landing-data";
import { FadeReveal } from "@/components/react-bits/fade-reveal";
import { RB_BTN_GHOST, RB_GLASS, RB_GLASS_HOVER, RB_SECTION, RB_SUBTITLE } from "@/lib/ui/premium";

type FeaturedJobsProps = {
  jobs: FeaturedJob[];
};

function JobCard({ job, index }: { job: FeaturedJob; index: number }) {
  return (
    <FadeReveal delay={index * 0.07}>
      <div className={`group flex h-full flex-col p-6 ${RB_GLASS} ${RB_GLASS_HOVER}`}>
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20">
            <Briefcase className="h-5 w-5" aria-hidden="true" />
          </span>
          {job.department ? (
            <Badge className="border-white/10 bg-white/5 text-zinc-300">{job.department}</Badge>
          ) : null}
        </div>

        <h3 className="mt-4 text-base font-semibold text-white">{job.title}</h3>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {job.isRemote ? "Remote" : (job.location ?? "Location not specified")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-zinc-500">
            Posted {job.publishedAt ? formatDate(job.publishedAt) : "recently"}
          </span>
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-300 transition-all group-hover:gap-1.5 group-hover:text-violet-200"
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </FadeReveal>
  );
}

export function FeaturedJobs({ jobs }: FeaturedJobsProps) {
  return (
    <section id="jobs" className={`scroll-mt-20 ${RB_SECTION}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Featured Opportunities
          </h2>
          <p className={`mt-4 ${RB_SUBTITLE}`}>
            Real, currently open roles — updated the moment our hiring team publishes them.
          </p>
        </FadeReveal>

        {jobs.length === 0 ? (
          <div className={`${RB_GLASS} mx-auto mt-12 max-w-lg p-10 text-center text-sm text-zinc-400`}>
            No published roles right now. Check back soon.
          </div>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/jobs" className={RB_BTN_GHOST}>
            View all jobs
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
