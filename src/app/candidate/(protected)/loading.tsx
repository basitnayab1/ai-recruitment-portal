import { Skeleton } from "@/components/ui/skeleton";
import { CHART_CARD, SURFACE_CARD } from "@/lib/ui/classes";

export default function CandidateDashboardLoading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className={`h-44 ${SURFACE_CARD}`} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className={`h-36 ${SURFACE_CARD}`} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={`h-28 ${SURFACE_CARD}`} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Skeleton className={`h-80 ${SURFACE_CARD}`} />
        <Skeleton className={`h-80 ${SURFACE_CARD}`} />
      </div>
      <Skeleton className={`h-72 ${CHART_CARD}`} />
    </div>
  );
}
