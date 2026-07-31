import Link from "next/link";
import { DebouncedSearchInput } from "@/components/hr/search/debounced-search-input";
import { AutoSubmitSelect } from "@/components/hr/search/auto-submit-field";
import { BTN_PRIMARY, BTN_SECONDARY, FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";
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
    <form
      method="get"
      action="/hr/jobs"
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
          placeholder="Job title…"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className={FILTER_LABEL}>
          Status
        </label>
        <AutoSubmitSelect id="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">All statuses</option>
          {JOB_STATUS_FILTER_OPTIONS.map((option) => (
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
          <Link href="/hr/jobs" className={BTN_SECONDARY}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
