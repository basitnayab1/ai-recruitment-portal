import Link from "next/link";
import { DebouncedSearchInput } from "@/components/hr/search/debounced-search-input";
import { AutoSubmitDateInput, AutoSubmitSelect } from "@/components/hr/search/auto-submit-field";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  FIELD_INPUT,
  FILTER_LABEL,
  FILTER_PANEL,
} from "@/lib/ui/classes";
import type { HRCandidatesFilters } from "@/lib/hr/candidates-data";

export function CandidatesFilters({
  filters,
  hasActiveFilters,
}: {
  filters: HRCandidatesFilters;
  hasActiveFilters: boolean;
}) {
  return (
    <form
      method="get"
      action="/hr/candidates"
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
          placeholder="Name, email, phone, skills, location…"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="minExperience" className={FILTER_LABEL}>
          Min. experience (years)
        </label>
        <input
          id="minExperience"
          name="minExperience"
          type="number"
          min={0}
          defaultValue={filters.minExperience ?? ""}
          placeholder="Any"
          className={FIELD_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="resumeUploaded" className={FILTER_LABEL}>
          Resume uploaded
        </label>
        <AutoSubmitSelect id="resumeUploaded" name="resumeUploaded" defaultValue={filters.resumeUploaded ?? ""}>
          <option value="">Any</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </AutoSubmitSelect>
      </div>

      <div className="space-y-2">
        <label htmlFor="createdFrom" className={FILTER_LABEL}>
          Created from
        </label>
        <AutoSubmitDateInput id="createdFrom" name="createdFrom" defaultValue={filters.createdFrom ?? ""} />
      </div>

      <div className="space-y-2">
        <label htmlFor="createdTo" className={FILTER_LABEL}>
          Created to
        </label>
        <AutoSubmitDateInput id="createdTo" name="createdTo" defaultValue={filters.createdTo ?? ""} />
      </div>

      <div className="space-y-2">
        <label htmlFor="sort" className={FILTER_LABEL}>
          Sort by
        </label>
        <AutoSubmitSelect id="sort" name="sort" defaultValue={filters.sort}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="experience_desc">Experience</option>
        </AutoSubmitSelect>
      </div>

      <div className="flex gap-2 sm:col-span-2 xl:col-span-6 xl:justify-end">
        <button type="submit" className={BTN_PRIMARY}>
          Apply filters
        </button>
        {hasActiveFilters ? (
          <Link href="/hr/candidates" className={BTN_SECONDARY}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
