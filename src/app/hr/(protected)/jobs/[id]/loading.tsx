import { Skeleton } from "@/components/ui/skeleton";
import { DETAIL_SECTION } from "@/lib/ui/classes";

export default function HRJobDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading job">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className={`h-64 ${DETAIL_SECTION}`} />
      <Skeleton className={`h-80 ${DETAIL_SECTION}`} />
    </div>
  );
}