import { FilterForm } from "@/components/hr/search/filter-form";
import {
  FilterDateInput,
  FilterSearchInput,
  FilterSelect,
} from "@/components/hr/search/filter-fields";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  type AuditLogFilters,
  type AuditLogFilterOptions,
} from "@/lib/audit/types";
import { FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";

export function ActivityLogFilters({
  filters,
  options,
  hasActiveFilters,
}: {
  filters: AuditLogFilters;
  options: AuditLogFilterOptions;
  hasActiveFilters: boolean;
}) {
  return (
    <FilterForm
      action="/hr/activity-log"
      clearHref="/hr/activity-log"
      hasActiveFilters={hasActiveFilters}
      submitLabel="Search"
      className={`${FILTER_PANEL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`}
    >
      <div className="space-y-2">
        <label htmlFor="dateFrom" className={FILTER_LABEL}>
          From date
        </label>
        <FilterDateInput
          id="dateFrom"
          name="dateFrom"
          defaultValue={filters.dateFrom ?? ""}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dateTo" className={FILTER_LABEL}>
          To date
        </label>
        <FilterDateInput id="dateTo" name="dateTo" defaultValue={filters.dateTo ?? ""} />
      </div>

      <div className="space-y-2">
        <label htmlFor="action" className={FILTER_LABEL}>
          Action
        </label>
        <FilterSelect id="action" name="action" defaultValue={filters.action ?? ""}>
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((action) => (
            <option key={action} value={action}>
              {AUDIT_ACTION_LABELS[action]}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="space-y-2">
        <label htmlFor="hrId" className={FILTER_LABEL}>
          HR user
        </label>
        <FilterSelect id="hrId" name="hrId" defaultValue={filters.hrId ?? ""}>
          <option value="">All HR users</option>
          {options.hrUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="space-y-2">
        <label htmlFor="candidateQ" className={FILTER_LABEL}>
          Candidate
        </label>
        <FilterSearchInput
          id="candidateQ"
          name="candidateQ"
          defaultValue={filters.candidateQ ?? ""}
          placeholder="Candidate name…"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="jobId" className={FILTER_LABEL}>
          Job
        </label>
        <FilterSelect id="jobId" name="jobId" defaultValue={filters.jobId ?? ""}>
          <option value="">All jobs</option>
          {options.jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </FilterSelect>
      </div>
    </FilterForm>
  );
}
