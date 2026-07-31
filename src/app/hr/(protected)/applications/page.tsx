import type { Metadata } from "next";
import { requireHRUser } from "@/lib/auth/dal";
import {
  getHRApplicationDepartments,
  getHRApplications,
  isHRApplicationSort,
  type HRApplicationsFilters,
} from "@/lib/hr/applications-data";
import { parsePageParam } from "@/lib/hr/search/constants";
import { isApplicationStatus } from "@/lib/hr/status";
import { ApplicationsFilters } from "@/components/hr/applications/applications-filters";
import { ApplicationsTable } from "@/components/hr/applications/applications-table";
import { EmptyState } from "@/components/hr/empty-state";
import { ApplicationsIcon } from "@/components/hr/icons";
import { PageHeader } from "@/components/shared/page-header";
import { PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Applications | AI Recruitment Portal",
};

type SearchParams = {
  q?: string;
  status?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  page?: string;
};

export default async function HRApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireHRUser();
  const params = await searchParams;

  const filters: HRApplicationsFilters = {
    q: params.q?.trim() || undefined,
    status: params.status && isApplicationStatus(params.status) ? params.status : undefined,
    department: params.department?.trim() || undefined,
    dateFrom: params.dateFrom?.trim() || undefined,
    dateTo: params.dateTo?.trim() || undefined,
    sort: params.sort && isHRApplicationSort(params.sort) ? params.sort : "newest",
    page: parsePageParam(params.page),
  };

  const [applicationsPage, departments] = await Promise.all([
    getHRApplications(filters),
    getHRApplicationDepartments(),
  ]);

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.status ||
      filters.department ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.sort !== "newest"
  );

  const paginationParams = {
    q: filters.q,
    status: filters.status,
    department: filters.department,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sort: filters.sort !== "newest" ? filters.sort : undefined,
  };

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Applications"
        description="Review and manage candidate applications across all jobs."
      />

      <ApplicationsFilters filters={filters} departments={departments} hasActiveFilters={hasActiveFilters} />

      {applicationsPage.applications.length === 0 ? (
        <EmptyState
          icon={ApplicationsIcon}
          title={hasActiveFilters ? "No applications match your filters." : "No applications yet"}
          description={
            hasActiveFilters
              ? "Try a different search term, status filter, or clear your filters."
              : "Applications will appear here as candidates apply to your published jobs."
          }
        />
      ) : (
        <ApplicationsTable applicationsPage={applicationsPage} extraParams={paginationParams} />
      )}
    </div>
  );
}
