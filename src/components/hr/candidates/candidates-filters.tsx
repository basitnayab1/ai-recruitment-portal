import { FilterForm } from "@/components/hr/search/filter-form";
import {
  FilterDateInput,
  FilterNumberInput,
  FilterSearchInput,
  FilterSelect,
} from "@/components/hr/search/filter-fields";
import { FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";
import type { HRCandidatesFilters } from "@/lib/hr/candidates-data";

export function CandidatesFilters({
  filters,
  hasActiveFilters,
}: {
  filters: HRCandidatesFilters;
  hasActiveFilters: boolean;
}) {
  return (
    <FilterForm
      action="/hr/candidates"
      clearHref="/hr/candidates"
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
          placeholder="Name, email, phone, skills, location…"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="minExperience" className={FILTER_LABEL}>
          Min. experience (years)
        </label>
        <FilterNumberInput
          id="minExperience"
          name="minExperience"
          min={0}
          defaultValue={filters.minExperience?.toString() ?? ""}
          placeholder="Any"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="resumeUploaded" className={FILTER_LABEL}>
          Resume uploaded
        </label>
        <FilterSelect
          id="resumeUploaded"
          name="resumeUploaded"
          defaultValue={filters.resumeUploaded ?? ""}
        >
          <option value="">Any</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </FilterSelect>
      </div>

      <div className="space-y-2">
        <label htmlFor="createdFrom" className={FILTER_LABEL}>
          Created from
        </label>
        <FilterDateInput
          id="createdFrom"
          name="createdFrom"
          defaultValue={filters.createdFrom ?? ""}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="createdTo" className={FILTER_LABEL}>
          Created to
        </label>
        <FilterDateInput
          id="createdTo"
          name="createdTo"
          defaultValue={filters.createdTo ?? ""}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sort" className={FILTER_LABEL}>
          Sort by
        </label>
        <FilterSelect id="sort" name="sort" defaultValue={filters.sort}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="experience_desc">Experience</option>
        </FilterSelect>
      </div>
    </FilterForm>
  );
}
