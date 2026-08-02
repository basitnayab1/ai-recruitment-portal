import { Skeleton } from "@/components/ui/skeleton";
import { DETAIL_SECTION, PAGE_STACK } from "@/lib/ui/classes";

export default function CandidateInterviewsLoading() {
  return (
    <div className={PAGE_STACK} aria-busy="true" aria-label="Loading interviews">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className={`h-64 ${DETAIL_SECTION}`} />
      ))}
    </div>
  );
}
