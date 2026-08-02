"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  refreshCandidateRankingAction,
  type RefreshCandidateRankingState,
} from "@/lib/hr/candidate-ranking-actions";
import type { StoredCandidateRanking } from "@/lib/hr/candidate-ranking-types";
import { rankMedal } from "@/lib/hr/job-candidates-ranking";
import type { ResumeRecommendation } from "@/lib/ai/types";
import { BTN_OUTLINE, DETAIL_SECTION } from "@/lib/ui/classes";

const initialState: RefreshCandidateRankingState = undefined;

function scoreTone(score: number): string {
  if (score >= 90) return "text-emerald-300";
  if (score >= 75) return "text-blue-300";
  if (score >= 60) return "text-amber-300";
  return "text-red-300";
}

function recommendationStyles(recommendation: ResumeRecommendation | null): string {
  switch (recommendation) {
    case "Highly Recommended":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
    case "Recommended":
      return "border-blue-400/30 bg-blue-500/15 text-blue-300";
    case "Average":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    case "Not Recommended":
      return "border-red-400/30 bg-red-500/15 text-red-300";
    default:
      return "border-white/10 bg-white/[0.04] text-zinc-200";
  }
}

function RankingRow({ entry }: { entry: StoredCandidateRanking }) {
  const medal = entry.rank <= 3 ? rankMedal(entry.rank) : `#${entry.rank}`;
  const reasonLines = entry.reason.split(";").map((part) => part.trim()).filter(Boolean);

  return (
    <motion.li
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (entry.rank - 1) * 0.04 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-base font-bold text-white">
            <span aria-hidden="true">{medal}</span>
            {entry.applicationId ? (
              <Link
                href={`/hr/applications/${entry.applicationId}`}
                className="truncate rounded-lg transition-colors hover:text-violet-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
              >
                {entry.fullName}
              </Link>
            ) : (
              <span className="truncate">{entry.fullName}</span>
            )}
          </p>
          <p className="mt-2 text-sm text-zinc-200">
            Rank <span className="font-semibold text-white">{entry.rank}</span>
            {" · "}
            Score{" "}
            <span className={`font-bold tabular-nums ${scoreTone(entry.score)}`}>{entry.score}%</span>
          </p>
        </div>
        {entry.recommendation ? (
          <span
            className={`inline-flex shrink-0 self-start rounded-xl border px-3 py-1.5 text-xs font-bold ${recommendationStyles(entry.recommendation)}`}
          >
            {entry.recommendation}
          </span>
        ) : null}
      </div>

      {reasonLines.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Reason
          </p>
          <ul className="mt-2 space-y-1" aria-label={`Ranking reasons for ${entry.fullName}`}>
            {reasonLines.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-zinc-200">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </motion.li>
  );
}

export function AICandidateRankingPanel({
  jobId,
  initialRankings,
}: {
  jobId: string;
  initialRankings: StoredCandidateRanking[];
}) {
  const [state, formAction, pending] = useActionState(refreshCandidateRankingAction, initialState);

  const displayedRankings =
    state?.status === "success" ? state.rankings : initialRankings;

  return (
    <section
      aria-labelledby="ai-candidate-ranking-title"
      className={`${DETAIL_SECTION} relative overflow-hidden`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.1),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.14),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="ai-candidate-ranking-title"
              className="flex items-center gap-2 text-base font-semibold text-white"
            >
              <span aria-hidden="true">🏆</span>
              AI Candidate Ranking
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Computed from cached résumé analysis — no additional AI calls per candidate.
            </p>
          </div>
          <form action={formAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <button type="submit" disabled={pending} className={`${BTN_OUTLINE} w-full sm:w-auto`}>
              {pending ? "Refreshing…" : "Refresh Ranking"}
            </button>
          </form>
        </div>

        {state?.status === "success" ? (
          <p className="mt-3 text-xs text-emerald-300" role="status">
            Ranked {state.rankedCount} candidate{state.rankedCount === 1 ? "" : "s"}.
          </p>
        ) : null}

        {state?.status === "error" ? (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {state.message}
          </p>
        ) : null}

        {displayedRankings.length > 0 ? (
          <ul className="mt-5 space-y-4" aria-label="AI candidate ranking list">
            {displayedRankings.map((entry) => (
              <RankingRow key={entry.id} entry={entry} />
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-zinc-400">
            No rankings yet. Run AI résumé analysis on applicants, then click{" "}
            <span className="font-medium text-zinc-200">Refresh Ranking</span>.
          </p>
        )}
      </div>
    </section>
  );
}
