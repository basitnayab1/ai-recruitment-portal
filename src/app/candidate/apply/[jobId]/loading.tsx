import { DetailPageSkeleton } from "@/components/shared/dashboard-page-skeleton";

export default function CandidateApplyLoading() {
  return (
    <div className="flex flex-1 flex-col bg-[#06060a]">
      <div className="h-16 border-b border-white/10" />
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <DetailPageSkeleton />
      </div>
    </div>
  );
}
