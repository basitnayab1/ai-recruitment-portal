import { Skeleton } from "@/components/ui/skeleton";
import { DETAIL_SECTION } from "@/lib/ui/classes";

export default function HRCandidateDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading candidate">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Skeleton className={`h-48 ${DETAIL_SECTION}`} />
          <Skeleton className={`h-64 ${DETAIL_SECTION}`} />
        </div>
        <Skeleton className={`h-56 ${DETAIL_SECTION}`} />
      </div>
    </div>
  );
}
