import type { Metadata } from "next";
import Link from "next/link";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
import { isEmploymentType } from "@/lib/hr/jobs";
import {
  getPublicJobs,
  isPublicJobsSort,
  type PublicJobsFilters,
} from "@/lib/public/jobs-data";
import { PremiumShell } from "@/components/atmosphere/premium-shell";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { JobFilters } from "@/components/public/job-filters";
import { JobCard } from "@/components/public/job-card";
import { JobsEmptyState } from "@/components/public/jobs-empty-state";
import { RB_BTN_GHOST } from "@/lib/ui/premium";

export const metadata: Metadata = {
  title: "Browse Jobs | AI Recruitment Portal",
  description: "Search and apply to the latest open roles — updated the moment they're published.",
};

type JobsSearchParams = {
  q?: string;
  department?: string;
  location?: string;
  type?: string;
  sort?: string;
  page?: string;
};

function parseFilters(params: JobsSearchParams): PublicJobsFilters {
  const page = Number.parseInt(params.page ?? "1", 10);
  return {
    q: params.q?.trim() || undefined,
    department: params.department?.trim() || undefined,
    location: params.location?.trim() || undefined,
    employmentType: params.type && isEmploymentType(params.type) ? params.type : undefined,
    sort: params.sort && isPublicJobsSort(params.sort) ? params.sort : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

function buildPageHref(params: JobsSearchParams, page: number): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.department) search.set("department", params.department);
  if (params.location) search.set("location", params.location);
  if (params.type) search.set("type", params.type);
  if (params.sort) search.set("sort", params.sort);
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<JobsSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ jobs, facets, total, page, pageSize }, profile] = await Promise.all([
    getPublicJobs(filters),
    getCandidateProfile(),
  ]);

  const hasActiveFilters = Boolean(
    filters.q || filters.department || filters.location || filters.employmentType
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PremiumShell intensity="full" className="rb-page">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-white/10 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-violet-300/90 uppercase">
              Careers
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Browse Open Roles
            </h1>
            <p className="mt-3 text-lg text-zinc-400">
              {total} open position{total === 1 ? "" : "s"} waiting for you.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <JobFilters filters={filters} facets={facets} hasActiveFilters={hasActiveFilters} />

          {jobs.length === 0 ? (
            <JobsEmptyState hasActiveFilters={hasActiveFilters} />
          ) : (
            <>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} isLoggedIn={Boolean(profile)} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav
                  className="mt-10 flex items-center justify-between gap-4 border-t border-white/10 pt-6"
                  aria-label="Jobs pagination"
                >
                  {page > 1 ? (
                    <Link href={buildPageHref(params, page - 1)} className={RB_BTN_GHOST}>
                      Previous
                    </Link>
                  ) : (
                    <span />
                  )}
                  <p className="text-sm text-zinc-400">
                    Page {page} of {totalPages}
                  </p>
                  {page < totalPages ? (
                    <Link href={buildPageHref(params, page + 1)} className={RB_BTN_GHOST}>
                      Next
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              ) : null}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </PremiumShell>
  );
}
