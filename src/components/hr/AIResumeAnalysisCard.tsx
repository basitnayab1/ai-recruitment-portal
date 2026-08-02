"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  analyzeCandidateResumeAction,
  reanalyzeCandidateResumeAction,
  type ResumeAnalysisActionState,
} from "@/lib/hr/resume-analysis-actions";
import type { ResumeAnalysis, ResumeRecommendation } from "@/lib/ai/types";
import { BTN_OUTLINE, BTN_PRIMARY, SELECT_INPUT } from "@/lib/ui/classes";

const initialState: ResumeAnalysisActionState = undefined;

const SCORE_RING_SIZE = 128;
const SCORE_RING_STROKE = 10;
const SCORE_RING_RADIUS = (SCORE_RING_SIZE - SCORE_RING_STROKE) / 2;
const SCORE_RING_CIRCUMFERENCE = 2 * Math.PI * SCORE_RING_RADIUS;

type ApplicationOption = {
  id: string;
  jobTitle: string;
};

export type AIResumeAnalysisCardProps = {
  candidateId: string;
  hasResume: boolean;
  applications: ApplicationOption[];
  defaultApplicationId: string | null;
  initialAnalysis: ResumeAnalysis | null;
  initialJobTitle: string | null;
  resumeUploadedAt: string | null;
  analysisUpdatedAt: string | null;
};

function scoreTone(score: number): {
  ring: string;
  text: string;
  glow: string;
} {
  if (score >= 90) {
    return {
      ring: "stroke-emerald-500",
      text: "text-emerald-300",
      glow: "shadow-emerald-500/30",
    };
  }
  if (score >= 75) {
    return {
      ring: "stroke-blue-500",
      text: "text-blue-300",
      glow: "shadow-blue-500/30",
    };
  }
  if (score >= 60) {
    return {
      ring: "stroke-amber-500",
      text: "text-amber-300",
      glow: "shadow-amber-500/30",
    };
  }
  return {
    ring: "stroke-red-500",
    text: "text-red-300",
    glow: "shadow-red-500/30",
  };
}

function recommendationStyles(recommendation: ResumeRecommendation): string {
  switch (recommendation) {
    case "Highly Recommended":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
    case "Recommended":
      return "border-blue-400/30 bg-blue-500/15 text-blue-300";
    case "Average":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    default:
      return "border-red-400/30 bg-red-500/15 text-red-300";
  }
}

function confidenceBarTone(confidence: number): string {
  if (confidence >= 90) return "from-emerald-500 to-teal-500";
  if (confidence >= 75) return "from-blue-500 to-cyan-500";
  if (confidence >= 60) return "from-amber-500 to-orange-500";
  return "from-red-500 to-rose-500";
}

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
      <span aria-hidden="true">{icon}</span>
      {title}
    </h3>
  );
}

function ScoreRing({ score }: { score: number }) {
  const tone = scoreTone(score);
  const offset = SCORE_RING_CIRCUMFERENCE - (score / 100) * SCORE_RING_CIRCUMFERENCE;

  return (
    <div
      className={`relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] shadow-lg backdrop-blur-sm ${tone.glow}`}
      role="img"
      aria-label={`Match score ${score} percent`}
    >
      <svg
        width={SCORE_RING_SIZE}
        height={SCORE_RING_SIZE}
        viewBox={`0 0 ${SCORE_RING_SIZE} ${SCORE_RING_SIZE}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SCORE_RING_SIZE / 2}
          cy={SCORE_RING_SIZE / 2}
          r={SCORE_RING_RADIUS}
          fill="none"
          className="stroke-zinc-200/80 dark:stroke-zinc-700/80"
          strokeWidth={SCORE_RING_STROKE}
        />
        <motion.circle
          cx={SCORE_RING_SIZE / 2}
          cy={SCORE_RING_SIZE / 2}
          r={SCORE_RING_RADIUS}
          fill="none"
          className={tone.ring}
          strokeWidth={SCORE_RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={SCORE_RING_CIRCUMFERENCE}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className={`text-3xl font-bold tabular-nums ${tone.text}`}
        >
          {score}
          <span className="text-lg font-semibold">%</span>
        </motion.span>
      </div>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading AI résumé analysis"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="h-32 w-32 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80" />
        <div className="w-full flex-1 space-y-3">
          <div className="h-4 w-2/3 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80" />
          <div className="h-3 w-full rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60" />
          <div className="h-3 w-5/6 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-32 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80" />
        <div className="h-16 w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-24 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"
          />
        ))}
      </div>
      <div className="h-3 w-full rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
    </div>
  );
}

function EmptyState({
  candidateId,
  applications,
  defaultApplicationId,
  analyzeAction,
  pending,
}: {
  candidateId: string;
  applications: ApplicationOption[];
  defaultApplicationId: string | null;
  analyzeAction: (payload: FormData) => void;
  pending: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col items-center px-4 py-10 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-3xl ring-1 ring-violet-200/60 dark:ring-violet-500/30">
        <span aria-hidden="true">🤖</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">
        No AI Analysis Yet
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
        Run an AI-powered evaluation to score this candidate&apos;s résumé against the job
        requirements.
      </p>
      <form action={analyzeAction} className="mt-6 w-full max-w-sm space-y-3">
        <input type="hidden" name="candidateId" value={candidateId} />
        {applications.length > 0 ? (
          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Evaluate against job
            </span>
            <select
              name="applicationId"
              defaultValue={defaultApplicationId ?? applications[0]?.id ?? ""}
              className={SELECT_INPUT}
              aria-label="Select job for résumé analysis"
            >
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.jobTitle}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button type="submit" disabled={pending} className={`${BTN_PRIMARY} w-full`}>
          {pending ? "Analyzing…" : "Analyze Resume"}
        </button>
      </form>
    </motion.div>
  );
}

function ReanalyzeConfirmDialog({
  open,
  onClose,
  onConfirm,
  pending,
  candidateId,
  applications,
  defaultApplicationId,
  reanalyzeAction,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
  candidateId: string;
  applications: ApplicationOption[];
  defaultApplicationId: string | null;
  reanalyzeAction: (payload: FormData) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, mounted]);

  if (!open || !mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-[#0a0a12]/95 p-0 text-zinc-100 shadow-2xl backdrop-blur-2xl open:flex open:flex-col"
      onClose={onClose}
    >
      <form
        action={reanalyzeAction}
        onSubmit={(event) => {
          event.stopPropagation();
          onConfirm();
        }}
        className="flex flex-col p-6"
      >
        <h2 id={titleId} className="text-lg font-semibold text-white">
          Re-analyze résumé?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-200">
          This will consume one AI request.
        </p>
        <input type="hidden" name="candidateId" value={candidateId} />
        {applications.length > 0 ? (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Job context
            </span>
            <select
              name="applicationId"
              defaultValue={defaultApplicationId ?? applications[0]?.id ?? ""}
              className={SELECT_INPUT}
              aria-label="Select job for re-analysis"
            >
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.jobTitle}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className={`${BTN_OUTLINE} w-full sm:w-auto`}
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
            {pending ? "Re-analyzing…" : "🔄 Re-analyze Resume"}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}

function AnalysisContent({
  analysis,
  jobTitle,
}: {
  analysis: ResumeAnalysis;
  jobTitle: string | null;
}) {
  const experienceLines = analysis.experience
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      <div className="flex flex-col items-center gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start">
        <ScoreRing score={analysis.score} />
        <div className="flex-1 text-center sm:text-left">
          {jobTitle ? (
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Evaluated against
            </p>
          ) : null}
          {jobTitle ? (
            <p className="mt-1 text-base font-semibold text-white">{jobTitle}</p>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed text-zinc-200">
            AI match score based on skills, experience, education, and job fit.
          </p>
        </div>
      </div>

      <section aria-labelledby="ai-summary-heading">
        <SectionHeading icon="📄" title="AI Summary" />
        <p
          id="ai-summary-heading"
          className="mt-3 text-sm leading-relaxed text-zinc-200"
        >
          {analysis.summary}
        </p>
      </section>

      {analysis.strengths.length > 0 ? (
        <section aria-labelledby="ai-strengths-heading">
          <SectionHeading icon="💪" title="Strengths" />
          <ul
            id="ai-strengths-heading"
            className="mt-3 flex flex-wrap gap-2"
            aria-label="Candidate strengths"
          >
            {analysis.strengths.map((item, index) => (
              <motion.li
                key={item}
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.04 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300"
              >
                <span aria-hidden="true" className="text-emerald-300">
                  ✓
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </section>
      ) : null}

      {analysis.weaknesses.length > 0 ? (
        <section aria-labelledby="ai-weaknesses-heading">
          <SectionHeading icon="⚠️" title="Weaknesses" />
          <ul
            id="ai-weaknesses-heading"
            className="mt-3 flex flex-wrap gap-2"
            aria-label="Candidate weaknesses"
          >
            {analysis.weaknesses.map((item, index) => (
              <motion.li
                key={item}
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.04 }}
                className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200"
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </section>
      ) : null}

      {analysis.skills.length > 0 ? (
        <section aria-labelledby="ai-skills-heading">
          <SectionHeading icon="🛠" title="Technical Skills" />
          <ul
            id="ai-skills-heading"
            className="mt-3 flex flex-wrap gap-2"
            aria-label="Technical skills"
          >
            {analysis.skills.map((skill, index) => (
              <motion.li
                key={skill}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -2 }}
                className="rounded-lg border border-violet-400/30 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200"
              >
                {skill}
              </motion.li>
            ))}
          </ul>
        </section>
      ) : null}

      {(analysis.matchedSkills?.length ?? 0) > 0 ? (
        <section aria-labelledby="ai-matched-skills-heading">
          <SectionHeading icon="✅" title="Matched Skills" />
          <ul
            id="ai-matched-skills-heading"
            className="mt-3 flex flex-wrap gap-2"
            aria-label="Matched skills"
          >
            {analysis.matchedSkills.map((skill, index) => (
              <motion.li
                key={skill}
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300"
              >
                {skill}
              </motion.li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-400">
            Skill match: {analysis.skillMatch}%
          </p>
        </section>
      ) : null}

      {analysis.missingSkills.length > 0 ? (
        <section aria-labelledby="ai-missing-skills-heading">
          <SectionHeading icon="❌" title="Missing Skills" />
          <ul
            id="ai-missing-skills-heading"
            className="mt-3 flex flex-wrap gap-2"
            aria-label="Missing skills"
          >
            {analysis.missingSkills.map((skill, index) => (
              <motion.li
                key={skill}
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-full border border-red-400/30 bg-transparent px-3 py-1 text-xs font-semibold text-red-300"
              >
                {skill}
              </motion.li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="ai-education-heading">
          <SectionHeading icon="🎓" title="Education" />
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4"
          >
            <p
              id="ai-education-heading"
              className="text-sm leading-relaxed text-zinc-200"
            >
              {analysis.education}
            </p>
          </motion.div>
        </section>

        <section aria-labelledby="ai-experience-heading">
          <SectionHeading icon="💼" title="Experience" />
          <ol
            id="ai-experience-heading"
            className="relative mt-3 space-y-4 border-l-2 border-violet-200/80 pl-5 dark:border-violet-800/50"
            aria-label="Experience timeline"
          >
            {(experienceLines.length > 0 ? experienceLines : [analysis.experience]).map(
              (line, index) => (
                <motion.li
                  key={`${index}-${line.slice(0, 24)}`}
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * index }}
                  className="relative text-sm leading-relaxed text-zinc-200"
                >
                  <span
                    className="absolute top-1.5 -left-[1.625rem] h-2.5 w-2.5 rounded-full bg-violet-500 ring-4 ring-violet-500/20"
                    aria-hidden="true"
                  />
                  {line}
                </motion.li>
              )
            )}
          </ol>
        </section>
      </div>

      <section aria-labelledby="ai-recommendation-heading" className="flex flex-col items-center gap-3">
        <SectionHeading icon="⭐" title="Recommendation" />
        <motion.span
          id="ai-recommendation-heading"
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ scale: 1.03 }}
          className={`inline-flex rounded-2xl border px-6 py-3 text-base font-bold tracking-tight ${recommendationStyles(analysis.recommendation)}`}
        >
          {analysis.recommendation}
        </motion.span>
      </section>

      <section aria-labelledby="ai-confidence-heading">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading icon="🎯" title="Confidence" />
          <span
            id="ai-confidence-heading"
            className="text-sm font-bold tabular-nums text-white"
          >
            {analysis.confidence}%
          </span>
        </div>
        <div
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={analysis.confidence}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Analysis confidence ${analysis.confidence} percent`}
        >
          <motion.div
            initial={false}
            animate={{ width: `${analysis.confidence}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className={`h-full rounded-full bg-gradient-to-r ${confidenceBarTone(analysis.confidence)}`}
          />
        </div>
      </section>
    </motion.div>
  );
}

export function AIResumeAnalysisCard({
  candidateId,
  hasResume,
  applications,
  defaultApplicationId,
  initialAnalysis,
  initialJobTitle,
  resumeUploadedAt,
  analysisUpdatedAt,
}: AIResumeAnalysisCardProps) {
  const [analyzeState, analyzeAction, analyzePending] = useActionState(
    analyzeCandidateResumeAction,
    initialState
  );
  const [reanalyzeState, reanalyzeAction, reanalyzePending] = useActionState(
    reanalyzeCandidateResumeAction,
    initialState
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pending = analyzePending || reanalyzePending;
  const actionState = reanalyzeState ?? analyzeState;

  const resumeIsNewerThanAnalysis =
    resumeUploadedAt &&
    analysisUpdatedAt &&
    new Date(resumeUploadedAt).getTime() > new Date(analysisUpdatedAt).getTime();

  const displayedAnalysis =
    actionState?.status === "success"
      ? actionState.analysis
      : initialAnalysis && !resumeIsNewerThanAnalysis
        ? initialAnalysis
        : null;

  const displayedJobTitle =
    actionState?.status === "success" ? actionState.stored.jobTitle : initialJobTitle;

  if (!hasResume) {
    return null;
  }

  return (
    <motion.section
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-labelledby="ai-resume-analysis-title"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_8px_32px_rgba(124,58,237,0.08)] backdrop-blur-xl sm:p-8"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.18),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="ai-resume-analysis-title"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-white sm:text-xl"
            >
              <span aria-hidden="true">🤖</span>
              AI Resume Analysis
            </h2>
            {applications.length > 1 ? (
              <p className="mt-1 text-xs text-zinc-400">
                Select a job when analyzing to compare against that role.
              </p>
            ) : null}
          </div>
          {displayedAnalysis && !pending ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={`${BTN_OUTLINE} w-full sm:w-auto`}
              aria-haspopup="dialog"
            >
              🔄 Re-analyze Resume
            </button>
          ) : null}
        </header>

        <div className="relative mt-6">
          <AnimatePresence mode="wait">
            {pending ? (
              <motion.div
                key="loading"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnalysisSkeleton />
              </motion.div>
            ) : displayedAnalysis ? (
              <motion.div
                key="results"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnalysisContent analysis={displayedAnalysis} jobTitle={displayedJobTitle} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  candidateId={candidateId}
                  applications={applications}
                  defaultApplicationId={defaultApplicationId}
                  analyzeAction={analyzeAction}
                  pending={pending}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {actionState?.status === "error" ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {actionState.message}
          </p>
        ) : null}
      </div>

      <ReanalyzeConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        pending={reanalyzePending}
        candidateId={candidateId}
        applications={applications}
        defaultApplicationId={defaultApplicationId}
        reanalyzeAction={reanalyzeAction}
      />
    </motion.section>
  );
}
