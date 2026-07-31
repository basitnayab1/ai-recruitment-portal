import { Skeleton } from "@/components/ui/skeleton";
import { CHART_CARD, SURFACE_CARD } from "@/lib/ui/classes";

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className={`h-32 ${SURFACE_CARD}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className={`h-24 ${SURFACE_CARD}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className={`h-72 lg:col-span-2 ${SURFACE_CARD}`} />
        <Skeleton className={`h-72 ${SURFACE_CARD}`} />
      </div>

      <Skeleton className={`h-64 ${SURFACE_CARD}`} />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className={`h-48 ${CHART_CARD}`} />
          <Skeleton className={`h-56 ${CHART_CARD}`} />
        </div>
        <div className="space-y-6">
          <Skeleton className={`h-32 ${CHART_CARD}`} />
          <Skeleton className={`h-40 ${CHART_CARD}`} />
        </div>
      </div>
    </div>
  );
}
