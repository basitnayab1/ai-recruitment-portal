import { Skeleton } from "@/components/ui/skeleton";
import { FILTER_PANEL, SURFACE_CARD, TABLE_WRAPPER } from "@/lib/ui/classes";

export default function HRApplicationsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading applications">
      <Skeleton className="h-10 w-64" />
      <Skeleton className={`h-36 ${FILTER_PANEL}`} />
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
