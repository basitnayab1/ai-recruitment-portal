import { FilterForm } from "@/components/hr/search/filter-form";
import { FilterSearchInput } from "@/components/hr/search/filter-fields";
import { FILTER_LABEL, FILTER_PANEL } from "@/lib/ui/classes";

/**
 * Standalone search bar for `/hr/candidates` (unused by the main filters panel,
 * kept for reuse). Submits only on Search click.
 */
export function CandidatesSearch({
  q,
  hasActiveFilters,
}: {
  q?: string;
  hasActiveFilters: boolean;
}) {
  return (
    <FilterForm
      action="/hr/candidates"
      clearHref="/hr/candidates"
      hasActiveFilters={hasActiveFilters}
      submitLabel="Search"
      className={`${FILTER_PANEL} flex flex-col gap-3 sm:flex-row sm:items-end`}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <label htmlFor="q" className={FILTER_LABEL}>
          Search
        </label>
        <FilterSearchInput
          id="q"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Name or email…"
        />
      </div>
    </FilterForm>
  );
}
