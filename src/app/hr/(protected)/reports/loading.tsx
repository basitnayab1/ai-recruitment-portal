import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_STACK, SURFACE_CARD } from "@/lib/ui/classes";

export default function HRReportsLoading() {
  return (
    <div className={PAGE_STACK} aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 sm:h-9" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`${SURFACE_CARD} space-y-4 p-6`}>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
