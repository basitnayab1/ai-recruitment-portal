"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Loader2, RefreshCw, Send } from "lucide-react";
import {
  generateHREmailAction,
  sendHREmailDraftAction,
  type GenerateHREmailState,
  type SendHREmailDraftState,
} from "@/lib/hr/email-actions";
import {
  EMAIL_TONE_LABELS,
  EMAIL_TYPE_LABELS,
} from "@/lib/ai/email-labels";
import {
  EMAIL_TONES,
  EMAIL_TYPES,
  type EmailTone,
  type EmailType,
  type GeneratedEmail,
} from "@/lib/ai/types";
import type { AIEmailContext } from "@/components/hr/email/ai-email-context";
import { BTN_OUTLINE, BTN_PRIMARY, BTN_SECONDARY, FIELD_INPUT } from "@/lib/ui/classes";

const generateInitialState: GenerateHREmailState = undefined;
const sendInitialState: SendHREmailDraftState = undefined;

type AIEmailDraftModalProps = {
  open: boolean;
  onClose: () => void;
  context: AIEmailContext;
  defaultEmailType?: EmailType;
  defaultTone?: EmailTone;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
      {children}
    </span>
  );
}

export function AIEmailDraftModal({
  open,
  onClose,
  context,
  defaultEmailType = "general",
  defaultTone = "professional",
}: AIEmailDraftModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const sendFormId = useId();
  const [mounted, setMounted] = useState(false);

  const [emailType, setEmailType] = useState<EmailType>(defaultEmailType);
  const [tone, setTone] = useState<EmailTone>(defaultTone);
  const [hrNotes, setHrNotes] = useState(context.hrNotes ?? "");
  const [draft, setDraft] = useState<GeneratedEmail | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);

  const [generateState, generateAction, generatePending] = useActionState(
    generateHREmailAction,
    generateInitialState
  );
  const [sendState, sendAction, sendPending] = useActionState(
    sendHREmailDraftAction,
    sendInitialState
  );

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

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setEmailType(defaultEmailType);
      setTone(defaultTone);
      setHrNotes(context.hrNotes ?? "");
      setDraft(null);
      setSubject("");
      setBody("");
      setCopyMessage(null);
      setConfirmSend(false);
    });
  }, [open, defaultEmailType, defaultTone, context.hrNotes]);

  useEffect(() => {
    if (generateState?.status !== "success") return;
    queueMicrotask(() => {
      setDraft(generateState.draft);
      setSubject(generateState.draft.subject);
      setBody(generateState.draft.body);
    });
  }, [generateState]);

  const awaitingSendConfirm = confirmSend && sendState?.status !== "success";

  async function handleCopy() {
    const text = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Copied to clipboard");
      window.setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("Copy failed");
    }
  }

  if (!open || !mounted) return null;

  // Portal to <body> so this modal is NEVER a DOM descendant of a parent <form>
  // (e.g. Interview Scheduler / Status Update). Nested forms cause hydration errors
  // and accidental parent form submissions.
  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-[min(640px,calc(100vw-2rem))] max-h-[min(90vh,820px)] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12]/95 p-0 text-zinc-100 shadow-2xl backdrop-blur-2xl backdrop:bg-black/40"
      aria-labelledby={`${formId}-title`}
    >
      <div className="flex max-h-[min(90vh,820px)] flex-col">
        <div className="border-b border-white/10 bg-gradient-to-r from-violet-500/10 via-transparent to-indigo-500/10 px-6 py-5">
          <h2 id={`${formId}-title`} className="text-lg font-bold text-white">
            ✨ AI Email Assistant
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Generate a draft for {context.candidateName} — review and edit before sending.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <form
            id={formId}
            action={generateAction}
            className="space-y-4"
            onSubmit={(event) => {
              // Never let this submit bubble into a parent page form.
              event.stopPropagation();
            }}
          >
            <input type="hidden" name="candidateName" value={context.candidateName} readOnly />
            <input type="hidden" name="jobTitle" value={context.jobTitle} readOnly />
            <input type="hidden" name="companyName" value={context.companyName} readOnly />
            <input type="hidden" name="interviewDate" value={context.interviewDate ?? ""} readOnly />
            <input type="hidden" name="interviewTime" value={context.interviewTime ?? ""} readOnly />
            <input
              type="hidden"
              name="interviewLocation"
              value={context.interviewLocation ?? ""}
              readOnly
            />
            <input type="hidden" name="emailType" value={emailType} readOnly />
            <input type="hidden" name="tone" value={tone} readOnly />
            <input type="hidden" name="hrNotes" value={hrNotes} readOnly />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <FieldLabel>Email type</FieldLabel>
                <select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value as EmailType)}
                  className={FIELD_INPUT}
                >
                  {EMAIL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {EMAIL_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <FieldLabel>Tone</FieldLabel>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as EmailTone)}
                  className={FIELD_INPUT}
                >
                  {EMAIL_TONES.map((value) => (
                    <option key={value} value={value}>
                      {EMAIL_TONE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-200">
              <p className="font-medium text-white">{context.candidateName}</p>
              <p className="text-zinc-400">{context.candidateEmail}</p>
              <p className="mt-1 text-zinc-200">{context.jobTitle}</p>
              {(context.interviewDate || context.interviewTime) && (
                <p className="mt-1 text-xs text-zinc-400">
                  {[context.interviewDate, context.interviewTime].filter(Boolean).join(" · ")}
                  {context.interviewLocation ? ` · ${context.interviewLocation}` : ""}
                </p>
              )}
            </div>

            <label className="block space-y-1.5">
              <FieldLabel>HR notes (optional)</FieldLabel>
              <textarea
                rows={3}
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                placeholder="Additional context for the AI (offer details, reason for rejection, etc.)"
                className={`${FIELD_INPUT} min-h-[80px] resize-y py-3`}
              />
            </label>

            <button type="submit" disabled={generatePending} className={BTN_PRIMARY}>
              {generatePending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating…
                </>
              ) : draft ? (
                <>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Regenerate
                </>
              ) : (
                "Generate Email"
              )}
            </button>

            {generateState?.status === "error" && (
              <p role="alert" className="text-sm text-red-300">
                {generateState.message}
              </p>
            )}
          </form>

          {draft && (
            <div className="space-y-4 border-t border-white/10 pt-5">
              {draft.shortSummary && (
                <p className="rounded-lg border border-violet-400/30 bg-violet-500/15 px-3 py-2 text-xs text-violet-200">
                  {draft.shortSummary}
                </p>
              )}

              <label className="block space-y-1.5">
                <FieldLabel>Subject</FieldLabel>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={FIELD_INPUT}
                />
              </label>

              <label className="block space-y-1.5">
                <FieldLabel>Body</FieldLabel>
                <textarea
                  rows={12}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className={`${FIELD_INPUT} min-h-[200px] resize-y py-3 font-mono text-[13px] leading-relaxed`}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleCopy} className={BTN_SECONDARY}>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy
                </button>
                {copyMessage && (
                  <span className="self-center text-xs text-emerald-300">
                    {copyMessage}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onClose} className={BTN_OUTLINE}>
            Close
          </button>

          {draft && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {!awaitingSendConfirm ? (
                <button
                  type="button"
                  onClick={() => setConfirmSend(true)}
                  disabled={!subject.trim() || !body.trim()}
                  className={BTN_PRIMARY}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send to Candidate
                </button>
              ) : (
                <form
                  id={sendFormId}
                  action={sendAction}
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <input type="hidden" name="applicationId" value={context.applicationId} readOnly />
                  <input type="hidden" name="subject" value={subject} readOnly />
                  <input type="hidden" name="body" value={body} readOnly />
                  <span className="text-xs text-zinc-400">
                    Send to {context.candidateEmail}?
                  </span>
                  <button type="submit" disabled={sendPending} className={BTN_PRIMARY}>
                    {sendPending ? "Sending…" : "Confirm Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmSend(false)}
                    className={BTN_OUTLINE}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {sendState?.status === "success" && (
          <p className="px-6 pb-4 text-sm text-emerald-300">{sendState.message}</p>
        )}
        {sendState?.status === "error" && (
          <p role="alert" className="px-6 pb-4 text-sm text-red-300">
            {sendState.message}
          </p>
        )}
      </div>
    </dialog>,
    document.body
  );
}
