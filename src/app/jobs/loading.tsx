import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export default function PublicJobsLoading() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <div className="h-16 border-b border-zinc-200 dark:border-zinc-800" />
      <div className="border-b border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ListPageSkeleton rows={6} />
        </div>
      </div>
    </div>
  );
}
