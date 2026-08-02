"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  generateInterviewQuestionsAction,
  regenerateInterviewQuestionsAction,
  type InterviewQuestionsActionState,
} from "@/lib/hr/interview-questions-actions";
import type { InterviewDifficulty, InterviewQuestions } from "@/lib/ai/types";
import { BTN_OUTLINE, BTN_PRIMARY } from "@/lib/ui/classes";

const initialState: InterviewQuestionsActionState = undefined;

export type AIInterviewAssistantCardProps = {
  applicationId: string;
  initialQuestions: InterviewQuestions | null;
};

function difficultyStyles(difficulty: InterviewDifficulty): string {
  switch (difficulty) {
    case "Easy":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
    case "Hard":
      return "border-red-400/30 bg-red-500/15 text-red-300";
    default:
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
  }
}

function SectionBlock({
  icon,
  title,
  items,
  emptyLabel,
  listClassName,
  itemClassName,
}: {
  icon: string;
  title: string;
  items: string[];
  emptyLabel?: string;
  listClassName?: string;
  itemClassName?: string;
}) {
  return (
    <section aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}>
      <h3
        id={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}
        className="flex items-center gap-2 text-sm font-semibold text-white"
      >
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {items.length > 0 ? (
        <ol className={`mt-3 space-y-2 ${listClassName ?? ""}`}>
          {items.map((item, index) => (
            <motion.li
              key={`${title}-${index}-${item.slice(0, 24)}`}
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className={
                itemClassName ??
                "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-zinc-200"
              }
            >
              <span className="mr-2 font-semibold text-violet-300">
                {index + 1}.
              </span>
              {item}
            </motion.li>
          ))}
        </ol>
      ) : emptyLabel ? (
        <p className="mt-2 text-sm text-zinc-400">{emptyLabel}</p>
      ) : null}
    </section>
  );
}

function QuestionsSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Generating interview questions"
    >
      <div className="h-8 w-40 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-36 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80" />
          <div className="h-14 w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          <div className="h-14 w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}

function RegenerateConfirmDialog({
  open,
  onClose,
  pending,
  applicationId,
  regenerateAction,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  applicationId: string;
  regenerateAction: (payload: FormData) => void;
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
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
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
        action={regenerateAction}
        onSubmit={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="flex flex-col p-6"
      >
        <h2 id={titleId} className="text-lg font-semibold text-white">
          Regenerate interview questions?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-200">
          This will consume one AI request.
        </p>
        <input type="hidden" name="applicationId" value={applicationId} />
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={pending} className={`${BTN_OUTLINE} w-full sm:w-auto`}>
            Cancel
          </button>
          <button type="submit" disabled={pending} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
            {pending ? "Regenerating…" : "🔄 Regenerate Questions"}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}

function QuestionsContent({ questions }: { questions: InterviewQuestions }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-6">
        <p className="text-sm text-zinc-200">
          Tailored questions based on the job, résumé, and AI analysis.
        </p>
        <motion.span
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          className={`inline-flex rounded-2xl border px-4 py-2 text-sm font-bold ${difficultyStyles(questions.overallDifficulty)}`}
        >
          {questions.overallDifficulty} Difficulty
        </motion.span>
      </div>

      <SectionBlock icon="🛠" title="Technical Questions" items={questions.technicalQuestions} />
      <SectionBlock icon="💬" title="Behavioral Questions" items={questions.behavioralQuestions} />
      <SectionBlock icon="🔍" title="Follow-up Questions" items={questions.followUpQuestions} />

      <SectionBlock
        icon="🚩"
        title="Red Flags"
        items={questions.redFlags}
        emptyLabel="No significant red flags identified."
        itemClassName="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      />

      <section aria-labelledby="focus-areas-heading">
        <h3
          id="focus-areas-heading"
          className="flex items-center gap-2 text-sm font-semibold text-white"
        >
          <span aria-hidden="true">🎯</span>
          Focus Areas
        </h3>
        {questions.focusAreas.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Interview focus areas">
            {questions.focusAreas.map((area, index) => (
              <motion.li
                key={area}
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.04 }}
                className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200"
              >
                {area}
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">No focus areas returned.</p>
        )}
      </section>
    </motion.div>
  );
}

export function AIInterviewAssistantCard({
  applicationId,
  initialQuestions,
}: AIInterviewAssistantCardProps) {
  const [generateState, generateAction, generatePending] = useActionState(
    generateInterviewQuestionsAction,
    initialState
  );
  const [regenerateState, regenerateAction, regeneratePending] = useActionState(
    regenerateInterviewQuestionsAction,
    initialState
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pending = generatePending || regeneratePending;
  const actionState = regenerateState ?? generateState;

  const displayedQuestions =
    actionState?.status === "success" ? actionState.questions : initialQuestions;

  return (
    <motion.section
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-labelledby="ai-interview-assistant-title"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_8px_32px_rgba(99,102,241,0.08)] backdrop-blur-xl sm:p-8"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.18),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="ai-interview-assistant-title"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-white sm:text-xl"
            >
              <span aria-hidden="true">🎤</span>
              AI Interview Assistant
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Role-specific questions powered by Groq and your résumé analysis.
            </p>
          </div>
          {displayedQuestions && !pending ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={`${BTN_OUTLINE} w-full sm:w-auto`}
              aria-haspopup="dialog"
            >
              🔄 Regenerate Questions
            </button>
          ) : null}
        </header>

        <div className="relative mt-6">
          <AnimatePresence mode="wait">
            {pending ? (
              <motion.div key="loading" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <QuestionsSkeleton />
              </motion.div>
            ) : displayedQuestions ? (
              <motion.div key="questions" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <QuestionsContent questions={displayedQuestions} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center px-4 py-10 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-3xl ring-1 ring-indigo-200/60 dark:ring-indigo-500/30">
                  <span aria-hidden="true">🎤</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  No Interview Questions Yet
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                  Generate tailored technical and behavioral questions. Requires an existing AI résumé
                  analysis for this application.
                </p>
                <form action={generateAction} className="mt-6 w-full max-w-sm">
                  <input type="hidden" name="applicationId" value={applicationId} />
                  <button type="submit" disabled={pending} className={`${BTN_PRIMARY} w-full`}>
                    Generate Interview Questions
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {actionState?.status === "error" ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {actionState.message}
          </p>
        ) : null}
      </div>

      <RegenerateConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        pending={regeneratePending}
        applicationId={applicationId}
        regenerateAction={regenerateAction}
      />
    </motion.section>
  );
}
