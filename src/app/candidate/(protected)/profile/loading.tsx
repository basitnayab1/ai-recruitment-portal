import { Skeleton } from "@/components/ui/skeleton";
import { DETAIL_SECTION, SURFACE_CARD } from "@/lib/ui/classes";

export default function CandidateProfileLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading profile">
      <Skeleton className={`h-56 ${SURFACE_CARD}`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className={`h-96 ${DETAIL_SECTION}`} />
          <Skeleton className={`h-[480px] ${DETAIL_SECTION}`} />
        </div>
        <Skeleton className={`h-96 ${DETAIL_SECTION}`} />
      </div>
    </div>
  );
}
