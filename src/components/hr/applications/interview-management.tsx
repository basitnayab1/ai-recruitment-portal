"use client";

import { useActionState } from "react";
import {
  cancelInterviewAction,
  rescheduleInterviewAction,
  scheduleInterviewAction,
  updateInterviewAction,
  type InterviewActionState,
} from "@/lib/hr/interview-actions";
import {
  formatInterviewDuration,
  INTERVIEW_TYPE_LABELS,
  type InterviewFormDefaults,
  type InterviewStatus,
} from "@/lib/hr/interviews";
import { formatDate } from "@/lib/hr/format";
import { InterviewFields } from "@/components/hr/applications/interview-fields";
import { InterviewStatusBadge } from "@/components/hr/interview-status-badge";
import { AIEmailGenerateButton } from "@/components/hr/email/ai-email-generate-button";
import type { AIEmailContext } from "@/components/hr/email/ai-email-context";
import { FormAlert } from "@/components/shared/form-alert";
import { BTN_ACCENT, BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui/classes";

const initialState: InterviewActionState = undefined;

type InterviewRecord = InterviewFormDefaults & {
  id: string;
  status: InterviewStatus;
};

function ActionMessage({ state }: { state: InterviewActionState }) {
  if (state?.status === "error") {
    return <FormAlert variant="error">{state.message}</FormAlert>;
  }
  if (state?.status === "success") {
    return <FormAlert variant="success">{state.message}</FormAlert>;
  }
  return null;
}

function formatInterviewTimeLabel(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function InterviewDetailsView({ interview }: { interview: InterviewRecord }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs font-medium text-zinc-400">Status</dt>
        <dd className="mt-1">
          <InterviewStatusBadge status={interview.status} />
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-zinc-400">Interviewer</dt>
        <dd className="mt-1 text-sm text-white">{interview.interviewerName}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-zinc-400">Type</dt>
        <dd className="mt-1 text-sm text-white">
          {INTERVIEW_TYPE_LABELS[interview.interviewType]}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-zinc-400">Duration</dt>
        <dd className="mt-1 text-sm text-white">
          {formatInterviewDuration(interview.durationMinutes)}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-zinc-400">Date</dt>
        <dd className="mt-1 text-sm text-white">
          {formatDate(interview.interviewDate)}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-zinc-400">Time</dt>
        <dd className="mt-1 text-sm text-white">
          {formatInterviewTimeLabel(interview.interviewTime)} ({interview.timezone})
        </dd>
      </div>
      {interview.meetingLink ? (
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-zinc-400">Meeting Link</dt>
          <dd className="mt-1 break-all text-sm text-white">
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              {interview.meetingLink}
            </a>
          </dd>
        </div>
      ) : null}
      {interview.officeLocation ? (
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-zinc-400">Office Location</dt>
          <dd className="mt-1 text-sm text-white">{interview.officeLocation}</dd>
        </div>
      ) : null}
      {interview.notes ? (
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-zinc-400">Internal Notes</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">
            {interview.notes}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

export function InterviewManagement({
  applicationId,
  interview,
  emailContext,
  minInterviewDate,
}: {
  applicationId: string;
  interview: InterviewRecord | null;
  emailContext: AIEmailContext;
  minInterviewDate?: string;
}) {
  const [scheduleState, scheduleAction, schedulePending] = useActionState(
    scheduleInterviewAction,
    initialState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateInterviewAction,
    initialState
  );
  const [rescheduleState, rescheduleAction, reschedulePending] = useActionState(
    rescheduleInterviewAction,
    initialState
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelInterviewAction,
    initialState
  );

  if (!interview || interview.status === "cancelled") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          {interview?.status === "cancelled"
            ? "The previous interview was cancelled. Schedule a new one below."
            : "No interview scheduled yet for this application."}
        </p>

        {/* Email actions MUST stay outside the schedule <form> to avoid nested forms. */}
        <div className="flex flex-wrap items-center gap-2">
          <AIEmailGenerateButton
            context={emailContext}
            emailType="interview_invitation"
          />
        </div>

        <form
          action={scheduleAction}
          className="space-y-3"
          onSubmit={(event) => event.stopPropagation()}
        >
          <input type="hidden" name="applicationId" value={applicationId} />
          <InterviewFields minInterviewDate={minInterviewDate} />
          <button type="submit" disabled={schedulePending} className={BTN_PRIMARY}>
            {schedulePending ? "Scheduling…" : "Schedule Interview"}
          </button>
          <ActionMessage state={scheduleState} />
        </form>
      </div>
    );
  }

  const scheduledEmailContext: AIEmailContext = {
    ...emailContext,
    interviewDate: interview.interviewDate,
    interviewTime: interview.interviewTime,
    interviewLocation: emailContext.interviewLocation,
  };

  return (
    <div className="space-y-6">
      <InterviewDetailsView interview={interview} />

      {/* All AI email entry points are outside interview forms. */}
      <div className="flex flex-wrap gap-2">
        <AIEmailGenerateButton
          context={scheduledEmailContext}
          emailType="interview_invitation"
        />
        <AIEmailGenerateButton
          context={scheduledEmailContext}
          emailType="interview_reminder"
          label="✨ Reminder Draft"
        />
        <AIEmailGenerateButton
          context={scheduledEmailContext}
          emailType="interview_reschedule"
        />
        <AIEmailGenerateButton
          context={scheduledEmailContext}
          emailType="interview_cancellation"
        />
      </div>

      <form
        action={updateAction}
        className="space-y-3 border-t border-zinc-200/80 pt-6 dark:border-zinc-800"
        onSubmit={(event) => event.stopPropagation()}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="interviewId" value={interview.id} />
        <h3 className="text-sm font-semibold text-white">Edit Interview</h3>
        <InterviewFields interview={interview} minInterviewDate={minInterviewDate} />
        <button type="submit" disabled={updatePending} className={BTN_SECONDARY}>
          {updatePending ? "Saving…" : "Save Changes"}
        </button>
        <ActionMessage state={updateState} />
      </form>

      <form
        action={rescheduleAction}
        className="space-y-3 border-t border-zinc-200/80 pt-6 dark:border-zinc-800"
        onSubmit={(event) => event.stopPropagation()}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="interviewId" value={interview.id} />
        <h3 className="text-sm font-semibold text-white">
          Reschedule Interview
        </h3>
        <p className="text-xs text-zinc-400">
          Update the schedule below and notify the candidate when the date or time changes.
        </p>
        <InterviewFields interview={interview} minInterviewDate={minInterviewDate} />
        <button type="submit" disabled={reschedulePending} className={BTN_ACCENT}>
          {reschedulePending ? "Rescheduling…" : "Reschedule & Notify Candidate"}
        </button>
        <ActionMessage state={rescheduleState} />
      </form>

      <form
        action={cancelAction}
        className="border-t border-zinc-200/80 pt-6 dark:border-zinc-800"
        onSubmit={(event) => event.stopPropagation()}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="interviewId" value={interview.id} />
        <button type="submit" disabled={cancelPending} className={BTN_DANGER}>
          {cancelPending ? "Cancelling…" : "Cancel Interview"}
        </button>
        <div className="mt-2">
          <ActionMessage state={cancelState} />
        </div>
      </form>
    </div>
  );
}
