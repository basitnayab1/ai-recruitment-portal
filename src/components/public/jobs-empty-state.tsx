import Link from "next/link";
import { Briefcase } from "lucide-react";

export function JobsEmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-950">
      <Briefcase className="h-10 w-10 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
      <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {hasActiveFilters ? "No jobs match your search" : "No open positions right now"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {hasActiveFilters
          ? "Try adjusting your search or filters to see more results."
          : "New roles are published regularly — check back soon."}
      </p>
      {hasActiveFilters ? (
        <Link
          href="/jobs"
          className="mt-4 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Clear all filters
        </Link>
      ) : null}
    </div>
  );
}
