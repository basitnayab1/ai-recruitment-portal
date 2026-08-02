import Link from "next/link";
import { Briefcase } from "lucide-react";
import { SURFACE_CARD } from "@/lib/ui/classes";

export function JobsEmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className={`mt-8 flex flex-col items-center border-dashed px-6 py-16 text-center ${SURFACE_CARD}`}>
      <Briefcase className="h-10 w-10 text-zinc-500" aria-hidden="true" />
      <h3 className="mt-4 text-sm font-semibold text-white">
        {hasActiveFilters ? "No jobs match your search" : "No open positions right now"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-400">
        {hasActiveFilters
          ? "Try adjusting your search or filters to see more results."
          : "New roles are published regularly — check back soon."}
      </p>
      {hasActiveFilters ? (
        <Link
          href="/jobs"
          className="mt-4 text-sm font-medium text-violet-300 hover:text-violet-200 hover:underline"
        >
          Clear all filters
        </Link>
      ) : null}
    </div>
  );
}
