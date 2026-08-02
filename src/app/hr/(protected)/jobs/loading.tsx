import { Skeleton } from "@/components/ui/skeleton";
import { FILTER_PANEL, SURFACE_CARD, TABLE_WRAPPER } from "@/lib/ui/classes";

export default function HRJobsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading jobs">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
      <Skeleton className={`h-28 ${FILTER_PANEL}`} />
      <div className={SURFACE_CARD}>
        <div className={`${TABLE_WRAPPER} p-2`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
