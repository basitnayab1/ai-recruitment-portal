"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Mail } from "lucide-react";
import { EMAIL_TYPE_LABELS } from "@/lib/ai/email-labels";
import { EMAIL_TYPES, type EmailType } from "@/lib/ai/types";
import type { AIEmailContext } from "@/components/hr/email/ai-email-context";
import { BTN_OUTLINE } from "@/lib/ui/classes";

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
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
            <Mail className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              AI Email Assistant
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Generate professional email drafts before sending. Nothing is sent until you confirm.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {EMAIL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => openWithType(type)}
              className={`${BTN_OUTLINE} h-auto min-h-11 justify-start px-4 py-2.5 text-left text-sm`}
            >
              <span className="mr-1.5" aria-hidden="true">
                ✨
              </span>
              {EMAIL_TYPE_LABELS[type]}
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
