"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, MapPin, Clock } from "lucide-react";
import { formatDate } from "@/lib/hr/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { Badge } from "@/components/ui/badge";
import type { FeaturedJob } from "@/lib/public/landing-data";
import { SURFACE_CARD, SURFACE_CARD_INTERACTIVE } from "@/lib/ui/classes";

type FeaturedJobsProps = {
  jobs: FeaturedJob[];
};

function JobCard({ job, index }: { job: FeaturedJob; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group flex flex-col p-6 ${SURFACE_CARD_INTERACTIVE}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          <Briefcase className="h-5 w-5" aria-hidden="true" />
        </span>
        {job.department ? <Badge variant="secondary">{job.department}</Badge> : null}
      </div>

      <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">{job.title}</h3>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {job.isRemote ? "Remote" : (job.location ?? "Location not specified")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="text-xs text-zinc-400">
          Posted {job.publishedAt ? formatDate(job.publishedAt) : "recently"}
        </span>
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors group-hover:gap-1.5 dark:text-indigo-400"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </motion.div>
  );
}

export function FeaturedJobs({ jobs }: FeaturedJobsProps) {
  return (
    <section id="jobs" className="scroll-mt-16 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Featured Opportunities
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Real, currently open roles — updated the moment our hiring team publishes them.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className={`mx-auto mt-12 flex max-w-md flex-col items-center border-dashed px-6 py-16 text-center ${SURFACE_CARD}`}>
            <Briefcase className="h-10 w-10 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
            <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              No open positions right now
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              New roles are published regularly — check back soon or create an account to get
              notified.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            View All Jobs
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
