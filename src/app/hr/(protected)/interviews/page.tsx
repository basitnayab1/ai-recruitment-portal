import type { Metadata } from "next";
import { requireHRUser } from "@/lib/auth/dal";
import {
  getHRInterviews,
  isHRInterviewTimeFilter,
  type HRInterviewsFilters,
} from "@/lib/hr/interviews-list-data";
import { parsePageParam } from "@/lib/hr/search/constants";
import { InterviewsFilters } from "@/components/hr/interviews/interviews-filters";
import { InterviewsTable } from "@/components/hr/interviews/interviews-table";
import { EmptyState } from "@/components/hr/empty-state";
import { InterviewsIcon } from "@/components/hr/icons";
import { PageHeader } from "@/components/shared/page-header";
import { PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Interviews | AI Recruitment Portal",
};

type SearchParams = { q?: string; timeFilter?: string; page?: string };

export default async function HRInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireHRUser();
  const params = await searchParams;

  const filters: HRInterviewsFilters = {
    q: params.q?.trim() || undefined,
    timeFilter:
      params.timeFilter && isHRInterviewTimeFilter(params.timeFilter)
        ? params.timeFilter
        : undefined,
    page: parsePageParam(params.page),
  };

  const interviewsPage = await getHRInterviews(filters);
  const hasActiveFilters = Boolean(filters.q || filters.timeFilter);

  const paginationParams = {
    q: filters.q,
    timeFilter: filters.timeFilter,
  };

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Interviews"
        description="View and filter scheduled interviews across all applications."
      />

      <InterviewsFilters filters={filters} hasActiveFilters={hasActiveFilters} />

      {interviewsPage.interviews.length === 0 ? (
        <EmptyState
          icon={InterviewsIcon}
          title={hasActiveFilters ? "No interviews match your filters." : "No interviews yet"}
          description={
            hasActiveFilters
              ? "Try a different search term or time filter, or clear your filters."
              : "Interviews will appear here once they are scheduled from an application."
          }
        />
      ) : (
        <InterviewsTable interviewsPage={interviewsPage} extraParams={paginationParams} />
      )}
    </div>
  );
}
