import { Skeleton } from "@/components/ui/skeleton";
import { DETAIL_SECTION } from "@/lib/ui/classes";

export default function CandidateResumeLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading resume">
      <div className="space-y-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className={`h-72 ${DETAIL_SECTION}`} />
    </div>
  );
}
