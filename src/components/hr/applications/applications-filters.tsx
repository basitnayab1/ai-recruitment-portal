import Link from "next/link";
import { DebouncedSearchInput } from "@/components/hr/search/debounced-search-input";
import { AutoSubmitDateInput, AutoSubmitSelect } from "@/components/hr/search/auto-submit-field";
import { STATUS_CHANGE_OPTIONS } from "@/lib/hr/status";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  FILTER_LABEL,
  FILTER_PANEL,
} from "@/lib/ui/classes";
import type { HRApplicationsFilters } from "@/lib/hr/applications-data";

/**
 * Search/filter/sort bar for `/hr/applications`. A plain server-rendered
 * GET form with debounced search and auto-submitting filter fields.
 */
export function ApplicationsFilters({
  filters,
  departments,
  hasActiveFilters,
}: {
  filters: HRApplicationsFilters;
  departments: string[];
  hasActiveFilters: boolean;
}) {
  return (
    <form
      method="get"
      action="/hr/applications"
      className={`${FILTER_PANEL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`}
    >
      <div className="space-y-2 sm:col-span-2 xl:col-span-2">
        <label htmlFor="q" className={FILTER_LABEL}>
          Search
        </label>
        <DebouncedSearchInput
          id="q"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Candidate name or job title…"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className={FILTER_LABEL}>
          Status
        </label>
        <AutoSubmitSelect id="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">All statuses</option>
          {STATUS_CHANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AutoSubmitSelect>
      </div>

      <div className="space-y-2">
        <label htmlFor="department" className={FILTER_LABEL}>
          Department
        </label>
        <AutoSubmitSelect id="department" name="department" defaultValue={filters.department ?? ""}>
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </AutoSubmitSelect>
      </div>

      <div className="space-y-2">
        <label htmlFor="dateFrom" className={FILTER_LABEL}>
          Submitted from
        </label>
        <AutoSubmitDateInput id="dateFrom" name="dateFrom" defaultValue={filters.dateFrom ?? ""} />
      </div>

      <div className="space-y-2">
        <label htmlFor="dateTo" className={FILTER_LABEL}>
          Submitted to
        </label>
        <AutoSubmitDateInput id="dateTo" name="dateTo" defaultValue={filters.dateTo ?? ""} />
      </div>

      <div className="space-y-2">
        <label htmlFor="sort" className={FILTER_LABEL}>
          Sort by
        </label>
        <AutoSubmitSelect id="sort" name="sort" defaultValue={filters.sort}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </AutoSubmitSelect>
      </div>

      <div className="flex gap-2 sm:col-span-2 xl:col-span-6 xl:justify-end">
        <button type="submit" className={BTN_PRIMARY}>
          Apply filters
        </button>
        {hasActiveFilters ? (
          <Link href="/hr/applications" className={BTN_SECONDARY}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
