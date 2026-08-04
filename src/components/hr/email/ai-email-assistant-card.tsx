"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Mail } from "lucide-react";
import { EMAIL_TYPE_LABELS } from "@/lib/ai/email-labels";
import { EMAIL_TYPES, type EmailType } from "@/lib/ai/types";
import type { AIEmailContext } from "@/components/hr/email/ai-email-context";

const AIEmailDraftModal = dynamic(
  () =>
    import("@/components/hr/email/ai-email-draft-modal").then((mod) => mod.AIEmailDraftModal),
  { ssr: false }
);

export function AIEmailAssistantCard({ context }: { context: AIEmailContext }) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EmailType>("general");

  function openWithType(type: EmailType) {
    setSelectedType(type);
    setOpen(true);
  }

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
            <Mail className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white">
              AI Email Assistant
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Generate professional email drafts before sending. Nothing is sent until you confirm.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {EMAIL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => openWithType(type)}
              className="inline-flex h-14 w-full min-w-0 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-transparent px-3 py-2 text-center text-sm font-semibold leading-tight whitespace-normal text-zinc-200 transition-all hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15"
            >
              <span className="shrink-0" aria-hidden="true">
                ✨
              </span>
              <span className="min-w-0 text-center leading-tight">
                {EMAIL_TYPE_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {open ? (
        <AIEmailDraftModal
          open={open}
          onClose={() => setOpen(false)}
          context={context}
          defaultEmailType={selectedType}
        />
      ) : null}
    </>
  );
}
