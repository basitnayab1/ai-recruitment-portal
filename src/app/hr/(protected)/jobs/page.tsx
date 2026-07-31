import type { Metadata } from "next";
import Link from "next/link";
import { requireHRUser } from "@/lib/auth/dal";
import { getJobsPage, type HRJobsFilters } from "@/lib/hr/jobs-data";
import { isJobStatus } from "@/lib/hr/jobs";
import { parsePageParam } from "@/lib/hr/search/constants";
import { JobsFilters } from "@/components/hr/jobs/jobs-filters";
import { JobsTable } from "@/components/hr/jobs/jobs-table";
import { EmptyState } from "@/components/hr/empty-state";
import { JobsIcon } from "@/components/hr/icons";
import { PageHeader } from "@/components/shared/page-header";
import { BTN_PRIMARY, PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Jobs | AI Recruitment Portal",
};

type SearchParams = { q?: string; status?: string; page?: string };

export default async function HRJobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireHRUser();
  const params = await searchParams;

  const filters: HRJobsFilters = {
    q: params.q?.trim() || undefined,
    status: params.status && isJobStatus(params.status) ? params.status : undefined,
    page: parsePageParam(params.page),
  };

  const jobsPage = await getJobsPage(filters);
  const hasActiveFilters = Boolean(filters.q || filters.status);

  const paginationParams = {
    q: filters.q,
    status: filters.status,
  };

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Jobs"
        description="Manage job postings for your organization."
        actions={
          <Link href="/hr/jobs/new" className={BTN_PRIMARY}>
            Create Job
          </Link>
        }
      />

      <JobsFilters filters={filters} hasActiveFilters={hasActiveFilters} />

      {jobsPage.jobs.length === 0 ? (
        <EmptyState
          icon={JobsIcon}
          title={hasActiveFilters ? "No jobs match your filters." : "No jobs yet"}
          description={
            hasActiveFilters
              ? "Try a different search term or status filter, or clear your filters."
              : "Create your first job posting to start receiving applications."
          }
        />
      ) : (
        <JobsTable jobsPage={jobsPage} extraParams={paginationParams} />
      )}
    </div>
  );
}
