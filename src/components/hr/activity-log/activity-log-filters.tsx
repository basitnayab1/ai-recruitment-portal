import Link from "next/link";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  type AuditLogFilters,
  type AuditLogFilterOptions,
} from "@/lib/audit/types";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  FIELD_INPUT,
  FILTER_LABEL,
  FILTER_PANEL,
} from "@/lib/ui/classes";

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
    <form
      method="get"
      action="/hr/activity-log"
      className={`${FILTER_PANEL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`}
    >
      <div className="space-y-2">
        <label htmlFor="dateFrom" className={FILTER_LABEL}>
          From date
        </label>
        <input
          id="dateFrom"
          name="dateFrom"
          type="date"
          defaultValue={filters.dateFrom ?? ""}
          className={FIELD_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dateTo" className={FILTER_LABEL}>
          To date
        </label>
        <input
          id="dateTo"
          name="dateTo"
          type="date"
          defaultValue={filters.dateTo ?? ""}
          className={FIELD_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="action" className={FILTER_LABEL}>
          Action
        </label>
        <select id="action" name="action" defaultValue={filters.action ?? ""} className={FIELD_INPUT}>
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((action) => (
            <option key={action} value={action}>
              {AUDIT_ACTION_LABELS[action]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="hrId" className={FILTER_LABEL}>
          HR user
        </label>
        <select id="hrId" name="hrId" defaultValue={filters.hrId ?? ""} className={FIELD_INPUT}>
          <option value="">All HR users</option>
          {options.hrUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="candidateQ" className={FILTER_LABEL}>
          Candidate
        </label>
        <input
          id="candidateQ"
          name="candidateQ"
          type="search"
          defaultValue={filters.candidateQ ?? ""}
          placeholder="Candidate name…"
          className={FIELD_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="jobId" className={FILTER_LABEL}>
          Job
        </label>
        <select id="jobId" name="jobId" defaultValue={filters.jobId ?? ""} className={FIELD_INPUT}>
          <option value="">All jobs</option>
          {options.jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-6 xl:justify-end">
        <button type="submit" className={BTN_PRIMARY}>
          Apply filters
        </button>
        {hasActiveFilters ? (
          <Link href="/hr/activity-log" className={BTN_SECONDARY}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
