import Link from "next/link";
import { Briefcase, MapPin, CalendarDays, CalendarX, Building2 } from "lucide-react";
import { formatDate } from "@/lib/hr/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { ApplyLink } from "@/components/public/apply-link";
import type { PublicJobListItem } from "@/lib/public/jobs-data";
import { SURFACE_CARD_INTERACTIVE } from "@/lib/ui/classes";

export function JobCard({ job, isLoggedIn }: { job: PublicJobListItem; isLoggedIn: boolean }) {
  return (
    <div className={`group flex flex-col p-6 ${SURFACE_CARD_INTERACTIVE}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_28px_rgba(139,92,246,0.4)] transition-transform group-hover:scale-105">
          <Briefcase className="h-5 w-5 text-white" aria-hidden="true" />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {job.department ? (
            <span className="rounded-full border border-violet-400/25 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold text-violet-200 uppercase">
              {job.department}
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300 uppercase">
            {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </span>
        </div>
      </div>

      <Link
        href={`/jobs/${job.id}`}
        className="mt-4 text-lg font-semibold text-white transition-colors group-hover:text-violet-200"
      >
        {job.title}
      </Link>

      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
        RecruitAI
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {job.isRemote ? "Remote" : (job.location ?? "Location TBD")}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-400">{job.shortDescription}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Posted {job.publishedAt ? formatDate(job.publishedAt) : "recently"}
        </span>
        {job.closesAt ? (
          <span className="inline-flex items-center gap-1">
            <CalendarX className="h-3.5 w-3.5" aria-hidden="true" />
            Closes {formatDate(job.closesAt)}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm font-semibold text-violet-300 transition-colors hover:text-violet-200"
        >
          View Details
        </Link>
        <ApplyLink jobId={job.id} isLoggedIn={isLoggedIn} size="sm" />
      </div>
    </div>
  );
}
