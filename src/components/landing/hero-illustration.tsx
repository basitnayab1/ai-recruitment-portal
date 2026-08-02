"use client";

import { Briefcase, Building2, Calendar, Users } from "lucide-react";
import type { FeaturedJob, LandingStats } from "@/lib/public/landing-data";
import { RB_GLASS_STRONG } from "@/lib/ui/premium";

type HeroIllustrationProps = {
  stats: LandingStats;
  featuredJobs: FeaturedJob[];
};

export function HeroIllustration({ stats, featuredJobs }: HeroIllustrationProps) {
  const previewJobs = featuredJobs.slice(0, 3);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
      <div
        aria-hidden="true"
        className="absolute inset-8 rounded-full bg-gradient-to-br from-violet-500/25 via-fuchsia-500/10 to-cyan-400/20 blur-3xl"
      />

      <div className={`hero-float-a absolute inset-4 ${RB_GLASS_STRONG} p-6`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.45)]">
            <Briefcase className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-3 w-2/3 rounded-full bg-white/15" />
            <div className="mt-2 h-3 w-1/2 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <Calendar className="h-5 w-5 text-violet-300" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold text-white">{stats.totalInterviews}</p>
            <p className="text-xs text-zinc-400">Interviews</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <Users className="h-5 w-5 text-fuchsia-300" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold text-white">{stats.totalCandidates}</p>
            <p className="text-xs text-zinc-400">Candidates</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {previewJobs.length > 0 ? (
            previewJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                  <Briefcase className="h-4 w-4 text-violet-300" aria-hidden="true" />
                </span>
                <p className="truncate text-xs font-medium text-zinc-200">{job.title}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-xs text-zinc-500">
              Live roles appear here
            </div>
          )}
        </div>
      </div>

      <div
        className={`hero-float-b absolute -right-4 top-8 flex items-center gap-3 px-4 py-3 ${RB_GLASS_STRONG}`}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
          <Users className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{stats.totalApplications}</p>
          <p className="text-[11px] text-zinc-400">Applications</p>
        </div>
      </div>

      <div className={`hero-float-c absolute -bottom-2 -left-4 px-4 py-3 ${RB_GLASS_STRONG}`}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-violet-300" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold text-violet-200">{stats.totalJobs}</p>
            <p className="text-[11px] text-zinc-400">Open roles</p>
          </div>
        </div>
      </div>
    </div>
  );
}
