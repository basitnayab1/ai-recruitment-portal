import { Skeleton } from "@/components/ui/skeleton";
import { FILTER_PANEL, SURFACE_CARD } from "@/lib/ui/classes";

export function ListPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:h-9 sm:w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className={FILTER_PANEL}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="col-span-2 h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
      <div className={`${SURFACE_CARD} overflow-hidden`}>
        <div className="space-y-0 border-b border-zinc-200/80 px-6 py-3.5 dark:border-zinc-800">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="hidden h-4 w-20 sm:block" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-zinc-200/80 px-6 py-4 dark:border-zinc-800">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
