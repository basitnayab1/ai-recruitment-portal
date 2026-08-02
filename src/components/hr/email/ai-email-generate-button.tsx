"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { EmailTone, EmailType } from "@/lib/ai/types";
import type { AIEmailContext } from "@/components/hr/email/ai-email-context";
import { BTN_OUTLINE } from "@/lib/ui/classes";

const AIEmailDraftModal = dynamic(
  () =>
    import("@/components/hr/email/ai-email-draft-modal").then((mod) => mod.AIEmailDraftModal),
  { ssr: false }
);

type AIEmailGenerateButtonProps = {
  context: AIEmailContext;
  emailType: EmailType;
  tone?: EmailTone;
  label?: string;
  className?: string;
};

export function AIEmailGenerateButton({
  context,
  emailType,
  tone = "professional",
  label = "✨ Generate with AI",
  className,
}: AIEmailGenerateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? BTN_OUTLINE}
      >
        {label}
      </button>
      {open ? (
        <AIEmailDraftModal
          open={open}
          onClose={() => setOpen(false)}
          context={context}
          defaultEmailType={emailType}
          defaultTone={tone}
        />
      ) : null}
    </>
  );
}
