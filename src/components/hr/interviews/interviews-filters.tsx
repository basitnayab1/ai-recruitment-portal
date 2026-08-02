import { FilterForm } from "@/components/hr/search/filter-form";
import { FilterSearchInput, FilterSelect } from "@/components/hr/search/filter-fields";
import { FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";
import type { HRInterviewsFilters } from "@/lib/hr/interviews-list-data";

const TIME_FILTER_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function InterviewsFilters({
  filters,
  hasActiveFilters,
}: {
  filters: HRInterviewsFilters;
  hasActiveFilters: boolean;
}) {
  return (
    <FilterForm
      action="/hr/interviews"
      clearHref="/hr/interviews"
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
          placeholder="Candidate, job, or interviewer…"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="timeFilter" className={FILTER_LABEL}>
          Filter
        </label>
        <FilterSelect
          id="timeFilter"
          name="timeFilter"
          defaultValue={filters.timeFilter ?? ""}
        >
          <option value="">All interviews</option>
          {TIME_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </div>
    </FilterForm>
  );
}
