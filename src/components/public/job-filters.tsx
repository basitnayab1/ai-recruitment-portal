import { FilterForm } from "@/components/hr/search/filter-form";
import { FilterSearchInput, FilterSelect } from "@/components/hr/search/filter-fields";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import type { PublicJobsFacets, PublicJobsFilters } from "@/lib/public/jobs-data";
import { FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";

/**
 * Search/filter/sort bar for `/jobs`.
 * Submits only on Search click (or Enter in the search field).
 */
export function JobFilters({
  filters,
  facets,
  hasActiveFilters,
}: {
  filters: PublicJobsFilters;
  facets: PublicJobsFacets;
  hasActiveFilters: boolean;
}) {
  return (
    <FilterForm
      action="/jobs"
      clearHref="/jobs"
      hasActiveFilters={hasActiveFilters}
      submitLabel="Search"
      className={`${FILTER_PANEL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end`}
    >
      <div className="space-y-1.5 lg:col-span-2">
        <label htmlFor="q" className={FILTER_LABEL}>
          Search
        </label>
        <FilterSearchInput
          id="q"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Job title or keywords…"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="department" className={FILTER_LABEL}>
          Department
        </label>
        <FilterSelect
          id="department"
          name="department"
          defaultValue={filters.department ?? ""}
        >
          <option value="">All departments</option>
          {facets.departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="location" className={FILTER_LABEL}>
          Location
        </label>
        <FilterSelect
          id="location"
          name="location"
          defaultValue={filters.location ?? ""}
        >
          <option value="">All locations</option>
          {facets.locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="type" className={FILTER_LABEL}>
          Employment Type
        </label>
        <FilterSelect
          id="type"
          name="type"
          defaultValue={filters.employmentType ?? ""}
        >
          <option value="">All types</option>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {EMPLOYMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sort" className={FILTER_LABEL}>
          Sort by
        </label>
        <FilterSelect id="sort" name="sort" defaultValue={filters.sort}>
          <option value="newest">Newest</option>
          <option value="closing_soon">Closing Soon</option>
        </FilterSelect>
      </div>
    </FilterForm>
  );
}
