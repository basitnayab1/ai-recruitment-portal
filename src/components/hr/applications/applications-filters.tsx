import { FilterForm } from "@/components/hr/search/filter-form";
import {
  FilterDateInput,
  FilterSearchInput,
  FilterSelect,
} from "@/components/hr/search/filter-fields";
import { STATUS_CHANGE_OPTIONS } from "@/lib/hr/status";
import { FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";
import type { HRApplicationsFilters } from "@/lib/hr/applications-data";

/**
 * Search/filter/sort bar for `/hr/applications`.
 * Submits only when the user clicks Search (or presses Enter in the search box).
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
    <FilterForm
      action="/hr/applications"
      clearHref="/hr/applications"
      hasActiveFilters={hasActiveFilters}
      submitLabel="Search"
      className={`${FILTER_PANEL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`}
    >
      <div className="space-y-2 sm:col-span-2 xl:col-span-2">
        <label htmlFor="q" className={FILTER_LABEL}>
          Search
        </label>
        <FilterSearchInput
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
        <FilterSelect id="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">All statuses</option>
          {STATUS_CHANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="space-y-2">
        <label htmlFor="department" className={FILTER_LABEL}>
          Department
        </label>
        <FilterSelect
          id="department"
          name="department"
          defaultValue={filters.department ?? ""}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="space-y-2">
        <label htmlFor="dateFrom" className={FILTER_LABEL}>
          Submitted from
        </label>
        <FilterDateInput
          id="dateFrom"
          name="dateFrom"
          defaultValue={filters.dateFrom ?? ""}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dateTo" className={FILTER_LABEL}>
          Submitted to
        </label>
        <FilterDateInput id="dateTo" name="dateTo" defaultValue={filters.dateTo ?? ""} />
      </div>

      <div className="space-y-2">
        <label htmlFor="sort" className={FILTER_LABEL}>
          Sort by
        </label>
        <FilterSelect id="sort" name="sort" defaultValue={filters.sort}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </FilterSelect>
      </div>
    </FilterForm>
  );
}
