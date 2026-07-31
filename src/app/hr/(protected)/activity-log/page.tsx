import type { Metadata } from "next";
import { requireHRUser } from "@/lib/auth/dal";
import { getAuditLogFilterOptions, getAuditLogsPage } from "@/lib/audit/data";
import { getHRProfilePictureSignedUrlsByCandidateIds } from "@/lib/candidate/profile-picture-urls";
import { isAuditAction, type AuditLogFilters } from "@/lib/audit/types";
import { ActivityLogFilters } from "@/components/hr/activity-log/activity-log-filters";
import { ActivityLogTable } from "@/components/hr/activity-log/activity-log-table";
import { Pagination } from "@/components/hr/pagination";
import { EmptyState } from "@/components/hr/empty-state";
import { ReportsIcon } from "@/components/hr/icons";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { PageHeader } from "@/components/shared/page-header";
import { PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Activity Log | AI Recruitment Portal",
};

type SearchParams = {
  page?: string;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
  hrId?: string;
  candidateQ?: string;
  jobId?: string;
};

export default async function HRActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireHRUser();
  const params = await searchParams;

  const filters: AuditLogFilters = {
    page: params.page ? Math.max(1, Number.parseInt(params.page, 10) || 1) : 1,
    dateFrom: params.dateFrom?.trim() || undefined,
    dateTo: params.dateTo?.trim() || undefined,
    action: params.action && isAuditAction(params.action) ? params.action : undefined,
    hrId: params.hrId?.trim() || undefined,
    candidateQ: params.candidateQ?.trim() || undefined,
    jobId: params.jobId?.trim() || undefined,
  };

  const [{ logs, total, pageSize }, filterOptions] = await Promise.all([
    getAuditLogsPage(filters),
    getAuditLogFilterOptions(),
  ]);

  const candidateIds = [
    ...new Set(
      logs.map((log) => log.metadata.candidateId).filter((id): id is string => Boolean(id))
    ),
  ];
  const pictureCandidateUrls = await getHRProfilePictureSignedUrlsByCandidateIds(candidateIds);

  const hasActiveFilters = Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      filters.action ||
      filters.hrId ||
      filters.candidateQ ||
      filters.jobId
  );

  const paginationParams = {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    action: filters.action,
    hrId: filters.hrId,
    candidateQ: filters.candidateQ,
    jobId: filters.jobId,
  };

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Activity Log"
        description="Audit trail of recruitment actions — jobs, applications, interviews, and HR notes."
      />

      <ActivityLogFilters
        filters={filters}
        options={filterOptions}
        hasActiveFilters={hasActiveFilters}
      />

      <DataTableShell
        footer={
          logs.length > 0 ? (
            <Pagination
              page={filters.page}
              pageSize={pageSize}
              total={total}
              basePath="/hr/activity-log"
              extraParams={paginationParams}
            />
          ) : undefined
        }
      >
        {logs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ReportsIcon}
              title={hasActiveFilters ? "No activity matches your filters." : "No activity recorded yet"}
              description={
                hasActiveFilters
                  ? "Try adjusting your filters or clear them to see all records."
                  : "Actions such as job updates, applications, and interviews will appear here."
              }
            />
          </div>
        ) : (
          <ActivityLogTable logs={logs} pictureCandidateUrls={pictureCandidateUrls} />
        )}
      </DataTableShell>
    </div>
  );
}
