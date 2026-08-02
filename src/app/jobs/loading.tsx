import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export default function PublicJobsLoading() {
  return (
    <div className="flex flex-1 flex-col bg-[#06060a]">
      <div className="h-16 border-b border-white/10" />
      <div className="border-b border-white/10 bg-white/[0.02] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ListPageSkeleton rows={6} />
        </div>
      </div>
    </div>
  );
}
