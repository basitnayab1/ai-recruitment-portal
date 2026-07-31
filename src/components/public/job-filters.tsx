import Link from "next/link";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import type { PublicJobsFacets, PublicJobsFilters } from "@/lib/public/jobs-data";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  FIELD_INPUT,
  FILTER_LABEL,
  FILTER_PANEL,
  SELECT_INPUT,
} from "@/lib/ui/classes";

const selectClassName = SELECT_INPUT;

/**
 * Search/filter/sort bar for `/jobs`. Implemented as a plain server-rendered
 * `<form method="get">` — submitting it just navigates to `/jobs?…`, so the
 * page's Server Component re-fetches with the new filters. No client-side
 * JavaScript is required (satisfies "Use Server Components wherever
 * possible").
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
    <form
      method="get"
      action="/jobs"
      className={`${FILTER_PANEL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end`}
    >
      <div className="space-y-1.5 lg:col-span-2">
        <label htmlFor="q" className={FILTER_LABEL}>
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder="Job title or keywords…"
          className={FIELD_INPUT}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="department" className={FILTER_LABEL}>
          Department
        </label>
        <select
          id="department"
          name="department"
          defaultValue={filters.department ?? ""}
          className={selectClassName}
        >
          <option value="">All departments</option>
          {facets.departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="location" className={FILTER_LABEL}>
          Location
        </label>
        <select id="location" name="location" defaultValue={filters.location ?? ""} className={selectClassName}>
          <option value="">All locations</option>
          {facets.locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="type" className={FILTER_LABEL}>
          Employment Type
        </label>
        <select id="type" name="type" defaultValue={filters.employmentType ?? ""} className={selectClassName}>
          <option value="">All types</option>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {EMPLOYMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sort" className={FILTER_LABEL}>
          Sort by
        </label>
        <select id="sort" name="sort" defaultValue={filters.sort} className={selectClassName}>
          <option value="newest">Newest</option>
          <option value="closing_soon">Closing Soon</option>
        </select>
      </div>

      <div className="flex gap-2 lg:col-span-6 lg:justify-end">
        <button type="submit" className={BTN_PRIMARY}>
          Search
        </button>
        {hasActiveFilters ? (
          <Link href="/jobs" className={BTN_SECONDARY}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
