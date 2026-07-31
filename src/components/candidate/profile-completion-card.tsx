import Link from "next/link";
import type { ProfileCompletion } from "@/lib/candidate/dashboard-data";
import { CARD_HEADER_LINK, CHART_CARD } from "@/lib/ui/classes";

export function ProfileCompletionCard({ completion }: { completion: ProfileCompletion }) {
  return (
    <div className={`flex h-full flex-col ${CHART_CARD}`}>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Profile Completion</h2>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {completion.percentage}%
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {completion.completedFields}/{completion.totalFields} fields complete
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={completion.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
          style={{ width: `${completion.percentage}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        A complete profile helps recruiters get to know you faster.
      </p>

      <Link href="/candidate/profile" className={`mt-auto pt-4 ${CARD_HEADER_LINK} text-sm`}>
        Complete Profile
      </Link>
    </div>
  );
}
