import { FilterForm } from "@/components/hr/search/filter-form";
import { FilterSearchInput, FilterSelect } from "@/components/hr/search/filter-fields";
import { FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";
import type { HRJobsFilters } from "@/lib/hr/jobs-data";

const JOB_STATUS_FILTER_OPTIONS = [
  { value: "published", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
] as const;

export function JobsFilters({
  filters,
  hasActiveFilters,
}: {
  filters: HRJobsFilters;
  hasActiveFilters: boolean;
}) {
  return (
    <FilterForm
      action="/hr/jobs"
      clearHref="/hr/jobs"
      hasActiveFilters={hasActiveFilters}
      submitLabel="Search"
      className={`${FILTER_PANEL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`}
    >
      <div className="space-y-2 sm:col-span-2">
        <label htmlFor="q" className={FILTER_LABEL}>
          Search
        </label>
        <FilterSearchInput
          id="q"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Job title…"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className={FILTER_LABEL}>
          Status
        </label>
        <FilterSelect id="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">All statuses</option>
          {JOB_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </div>
    </FilterForm>
  );
}
