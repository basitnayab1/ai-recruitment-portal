import type { Metadata } from "next";
import { requireHRUser } from "@/lib/auth/dal";
import {
  getHRCandidates,
  isHRCandidateSort,
  type HRCandidatesFilters,
} from "@/lib/hr/candidates-data";
import { parseOptionalNumber, parsePageParam } from "@/lib/hr/search/constants";
import { CandidatesFilters } from "@/components/hr/candidates/candidates-filters";
import { CandidatesTable } from "@/components/hr/candidates/candidates-table";
import { EmptyState } from "@/components/hr/empty-state";
import { CandidatesIcon } from "@/components/hr/icons";
import { PageHeader } from "@/components/shared/page-header";
import { PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Candidates | AI Recruitment Portal",
};

type SearchParams = {
  q?: string;
  page?: string;
  minExperience?: string;
  resumeUploaded?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: string;
};

export default async function HRCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireHRUser();
  const params = await searchParams;

  const filters: HRCandidatesFilters = {
    q: params.q?.trim() || undefined,
    minExperience: parseOptionalNumber(params.minExperience),
    resumeUploaded:
      params.resumeUploaded === "yes" || params.resumeUploaded === "no"
        ? params.resumeUploaded
        : undefined,
    createdFrom: params.createdFrom?.trim() || undefined,
    createdTo: params.createdTo?.trim() || undefined,
    sort: params.sort && isHRCandidateSort(params.sort) ? params.sort : "newest",
    page: parsePageParam(params.page),
  };

  const candidatesPage = await getHRCandidates(filters);
  const hasActiveFilters = Boolean(
    filters.q ||
      filters.minExperience !== undefined ||
      filters.resumeUploaded ||
      filters.createdFrom ||
      filters.createdTo ||
      filters.sort !== "newest"
  );

  const paginationParams = {
    q: filters.q,
    minExperience: filters.minExperience?.toString(),
    resumeUploaded: filters.resumeUploaded,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    sort: filters.sort !== "newest" ? filters.sort : undefined,
  };

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Candidates"
        description="A unified view of every registered candidate."
      />

      <CandidatesFilters filters={filters} hasActiveFilters={hasActiveFilters} />

      {candidatesPage.candidates.length === 0 ? (
        <EmptyState
          icon={CandidatesIcon}
          title={hasActiveFilters ? "No candidates match your search." : "No candidates yet"}
          description={
            hasActiveFilters
              ? "Try different search terms or filters, or clear your filters."
              : "Candidates will appear here once they create an account."
          }
        />
      ) : (
        <CandidatesTable candidatesPage={candidatesPage} extraParams={paginationParams} />
      )}
    </div>
  );
}
