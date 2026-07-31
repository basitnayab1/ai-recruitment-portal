import type { Metadata } from "next";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
import { isEmploymentType } from "@/lib/hr/jobs";
import { getPublicJobs, isPublicJobsSort, type PublicJobsFilters } from "@/lib/public/jobs-data";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { JobFilters } from "@/components/public/job-filters";
import { JobCard } from "@/components/public/job-card";
import { JobsEmptyState } from "@/components/public/jobs-empty-state";

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
};

function parseFilters(params: JobsSearchParams): PublicJobsFilters {
  return {
    q: params.q?.trim() || undefined,
    department: params.department?.trim() || undefined,
    location: params.location?.trim() || undefined,
    employmentType: params.type && isEmploymentType(params.type) ? params.type : undefined,
    sort: params.sort && isPublicJobsSort(params.sort) ? params.sort : "newest",
  };
}

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<JobsSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ jobs, facets }, profile] = await Promise.all([getPublicJobs(filters), getCandidateProfile()]);

  const hasActiveFilters = Boolean(
    filters.q || filters.department || filters.location || filters.employmentType
  );

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Browse Open Roles
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              {jobs.length} open position{jobs.length === 1 ? "" : "s"} waiting for you.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <JobFilters filters={filters} facets={facets} hasActiveFilters={hasActiveFilters} />

          {jobs.length === 0 ? (
            <JobsEmptyState hasActiveFilters={hasActiveFilters} />
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} isLoggedIn={Boolean(profile)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
