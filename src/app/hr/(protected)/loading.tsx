import { Skeleton } from "@/components/ui/skeleton";
import { CHART_CARD, SURFACE_CARD } from "@/lib/ui/classes";

export default function HRDashboardLoading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className={`h-44 ${SURFACE_CARD}`} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className={`h-36 ${SURFACE_CARD}`} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className={`h-24 ${SURFACE_CARD}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className={`h-80 ${CHART_CARD}`} />
        ))}
      </div>

      <Skeleton className={`h-48 ${SURFACE_CARD}`} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Skeleton className={`h-72 ${SURFACE_CARD}`} />
        <Skeleton className={`h-72 ${SURFACE_CARD}`} />
      </div>

      <Skeleton className={`h-96 ${SURFACE_CARD}`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className={`h-80 ${SURFACE_CARD}`} />
        ))}
      </div>
    </div>
  );
}
