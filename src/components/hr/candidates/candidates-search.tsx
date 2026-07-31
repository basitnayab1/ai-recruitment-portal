import Link from "next/link";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  FIELD_INPUT,
  FILTER_LABEL,
  FILTER_PANEL,
} from "@/lib/ui/classes";

/**
 * Search bar for `/hr/candidates`. A plain server-rendered
 * `<form method="get">` — submitting it navigates to
 * `/hr/candidates?q=…`, so the page's Server Component re-fetches. No
 * client-side JavaScript required. Always resets to page 1 on a new
 * search (no `page` field in the form).
 */
export function CandidatesSearch({ q, hasActiveFilters }: { q?: string; hasActiveFilters: boolean }) {
  return (
    <form
      method="get"
      action="/hr/candidates"
      className={`${FILTER_PANEL} flex flex-col gap-3 sm:flex-row sm:items-end`}
    >
      <div className="flex-1 space-y-1.5">
        <label htmlFor="q" className={FILTER_LABEL}>
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Name or email…"
          className={FIELD_INPUT}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className={BTN_PRIMARY}>
          Search
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
