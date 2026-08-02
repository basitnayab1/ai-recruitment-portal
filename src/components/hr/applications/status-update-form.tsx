"use client";

import { useActionState, useState } from "react";
import {
  updateApplicationStatusAction,
  type UpdateApplicationStatusState,
} from "@/lib/hr/application-actions";
import {
  STATUS_CHANGE_OPTIONS,
  APPLICATION_STATUS_META,
  type ApplicationStatus,
} from "@/lib/hr/status";
import { InterviewFields } from "@/components/hr/applications/interview-fields";
import { AIEmailGenerateButton } from "@/components/hr/email/ai-email-generate-button";
import { BTN_PRIMARY, SELECT_INPUT } from "@/lib/ui/classes";
import type { AIEmailContext } from "@/components/hr/email/ai-email-context";
import type { EmailType } from "@/lib/ai/types";

const initialState: UpdateApplicationStatusState = undefined;

function emailTypeForStatus(status: ApplicationStatus): EmailType | null {
  if (status === "rejected") return "rejection";
  if (status === "hired" || status === "selected") return "offer_letter";
  if (status === "hr_review" || status === "hold") return "follow_up";
  return null;
}

export function StatusUpdateForm({
  applicationId,
  currentStatus,
  emailContext,
  minInterviewDate,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
  emailContext: AIEmailContext;
  minInterviewDate?: string;
}) {
  const [state, formAction, pending] = useActionState(updateApplicationStatusAction, initialState);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(currentStatus);

  const isCurrentStatusSelectable = STATUS_CHANGE_OPTIONS.some(
    (option) => option.value === currentStatus
  );
  const showInterviewFields = selectedStatus === "interview";
  const draftEmailType = emailTypeForStatus(selectedStatus);

  return (
    <div className="space-y-3">
      {/* Email drafts stay outside the status <form> — never nest modal forms. */}
      <div className="flex flex-wrap items-center gap-2">
        {draftEmailType ? (
          <AIEmailGenerateButton context={emailContext} emailType={draftEmailType} />
        ) : null}
        <AIEmailGenerateButton
          context={emailContext}
          emailType="general"
          label="✨ General Email"
        />
      </div>

      <form
        action={formAction}
        className="space-y-3"
        onSubmit={(event) => event.stopPropagation()}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <select
          name="status"
          defaultValue={currentStatus}
          onChange={(event) => setSelectedStatus(event.target.value as ApplicationStatus)}
          className={SELECT_INPUT}
        >
          {!isCurrentStatusSelectable ? (
            <option value={currentStatus} disabled>
              {APPLICATION_STATUS_META[currentStatus].label} (current)
            </option>
          ) : null}
          {STATUS_CHANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {showInterviewFields ? (
          <InterviewFields minInterviewDate={minInterviewDate} />
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className={BTN_PRIMARY}
        >
          {pending ? "Updating…" : "Update Status"}
        </button>
        {state?.status === "error" ? (
          <p role="alert" className="text-xs text-red-300">
            {state.message}
          </p>
        ) : null}
        {state?.status === "success" ? (
          <p className="text-xs text-emerald-300">Status updated.</p>
        ) : null}
      </form>
    </div>
  );
}
