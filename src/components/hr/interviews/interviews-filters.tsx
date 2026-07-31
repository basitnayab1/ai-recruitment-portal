import Link from "next/link";
import { DebouncedSearchInput } from "@/components/hr/search/debounced-search-input";
import { AutoSubmitSelect } from "@/components/hr/search/auto-submit-field";
import { BTN_PRIMARY, BTN_SECONDARY, FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";
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
    <form
      method="get"
      action="/hr/interviews"
      className={`${FILTER_PANEL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`}
    >
      <div className="space-y-2 sm:col-span-2">
        <label htmlFor="q" className={FILTER_LABEL}>
          Search
        </label>
        <DebouncedSearchInput
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
        <AutoSubmitSelect id="timeFilter" name="timeFilter" defaultValue={filters.timeFilter ?? ""}>
          <option value="">All interviews</option>
          {TIME_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AutoSubmitSelect>
      </div>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-3 lg:justify-end">
        <button type="submit" className={BTN_PRIMARY}>
          Apply filters
        </button>
        {hasActiveFilters ? (
          <Link href="/hr/interviews" className={BTN_SECONDARY}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
