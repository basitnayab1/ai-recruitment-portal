import { Skeleton } from "@/components/ui/skeleton";
import { DETAIL_SECTION } from "@/lib/ui/classes";

export default function HRApplicationDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading application">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-80" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Skeleton className={`h-56 ${DETAIL_SECTION}`} />
          <Skeleton className={`h-72 ${DETAIL_SECTION}`} />
        </div>
        <div className="space-y-6">
          <Skeleton className={`h-40 ${DETAIL_SECTION}`} />
          <Skeleton className={`h-48 ${DETAIL_SECTION}`} />
        </div>
      </div>
    </div>
  );
}
