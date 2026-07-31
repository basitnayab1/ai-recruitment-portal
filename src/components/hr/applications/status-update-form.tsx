"use client";

import { useActionState, useState } from "react";
import {
  updateApplicationStatusAction,
  type UpdateApplicationStatusState,
} from "@/lib/hr/application-actions";
import { STATUS_CHANGE_OPTIONS, APPLICATION_STATUS_META, type ApplicationStatus } from "@/lib/hr/status";
import { InterviewFields } from "@/components/hr/applications/interview-fields";

const initialState: UpdateApplicationStatusState = undefined;

const fieldClassName =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-700";

export function StatusUpdateForm({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const [state, formAction, pending] = useActionState(updateApplicationStatusAction, initialState);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(currentStatus);

  const isCurrentStatusSelectable = STATUS_CHANGE_OPTIONS.some((option) => option.value === currentStatus);
  const showInterviewFields = selectedStatus === "interview";

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <select
        name="status"
        defaultValue={currentStatus}
        onChange={(event) => setSelectedStatus(event.target.value as ApplicationStatus)}
        className={fieldClassName}
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

      {showInterviewFields ? <InterviewFields /> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Updating…" : "Update Status"}
      </button>
      {state?.status === "error" ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}
      {state?.status === "success" ? (
        <p className="text-xs text-green-600 dark:text-green-400">Status updated.</p>
      ) : null}
    </form>
  );
}
