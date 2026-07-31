import "server-only";

import type { ApplicationStatus } from "@/lib/hr/status";
import { APPLICATION_STATUS_META, STATUS_CHANGE_OPTIONS } from "@/lib/hr/status";
import { INTERVIEW_TYPE_LABELS, type InterviewType } from "@/lib/hr/interviews";
import { getEmailConfig } from "@/lib/email/config";
import { formatEmailDate } from "@/lib/email/format";
import { getHRNotificationEmails } from "@/lib/email/hr-recipients";
import { sendEmail } from "@/lib/email/send";
import {
  accountCreatedTemplate,
  applicationStatusChangedTemplate,
  applicationSubmittedCandidateTemplate,
  interviewCancelledTemplate,
  interviewRescheduledTemplate,
  interviewScheduledTemplate,
  newApplicationHrTemplate,
} from "@/lib/email/templates";

export type InterviewEmailPayload = {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  interviewType: InterviewType;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  durationLabel: string;
  meetingLink: string | null;
  officeLocation: string | null;
};

function getCandidateStatusLabel(status: ApplicationStatus): string {
  const option = STATUS_CHANGE_OPTIONS.find((entry) => entry.value === status);
  if (option) return option.label;
  return APPLICATION_STATUS_META[status]?.label ?? status;
}

function getInterviewLocationOrLink(payload: InterviewEmailPayload): string {
  if (payload.interviewType === "online") {
    return payload.meetingLink ?? "Link to be shared";
  }
  if (payload.interviewType === "on_site") {
    return payload.officeLocation ?? "Location to be confirmed";
  }
  return payload.meetingLink ?? "HR will call you at the scheduled time";
}

function buildInterviewTemplateArgs(payload: InterviewEmailPayload) {
  const { appName } = getEmailConfig();
  return {
    appName,
    candidateName: payload.candidateName,
    jobTitle: payload.jobTitle,
    interviewerName: payload.interviewerName,
    interviewTypeLabel: INTERVIEW_TYPE_LABELS[payload.interviewType],
    interviewDate: payload.interviewDate,
    interviewTime: payload.interviewTime,
    timezone: payload.timezone,
    durationLabel: payload.durationLabel,
    locationOrLink: getInterviewLocationOrLink(payload),
  };
}

async function runNotification(context: string, send: () => Promise<void>): Promise<void> {
  try {
    await send();
  } catch (error) {
    console.error(`[email] Notification failed (${context}).`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function notifyAccountCreated({
  email,
  candidateName,
}: {
  email: string;
  candidateName: string;
}): Promise<void> {
  await runNotification("account-created", async () => {
    const { appName } = getEmailConfig();
    await sendEmail({
      to: email,
      content: accountCreatedTemplate({ appName, candidateName }),
      context: "account-created",
    });
  });
}

export async function notifyApplicationSubmitted({
  candidateEmail,
  candidateName,
  jobTitle,
  submittedAt,
}: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  submittedAt?: string;
}): Promise<void> {
  await runNotification("application-submitted", async () => {
    const { appName } = getEmailConfig();
    const applicationDate = formatEmailDate(submittedAt ?? new Date());

    await sendEmail({
      to: candidateEmail,
      content: applicationSubmittedCandidateTemplate({
        appName,
        candidateName,
        jobTitle,
        applicationDate,
      }),
      context: "application-submitted-candidate",
    });

    const hrEmails = await getHRNotificationEmails();
    await sendEmail({
      to: hrEmails,
      content: newApplicationHrTemplate({
        appName,
        candidateName,
        jobTitle,
        applicationDate,
      }),
      context: "application-submitted-hr",
    });
  });
}

export async function notifyApplicationStatusChanged({
  candidateEmail,
  candidateName,
  jobTitle,
  newStatus,
}: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  newStatus: ApplicationStatus;
}): Promise<void> {
  await runNotification("application-status-changed", async () => {
    const { appName } = getEmailConfig();

    if (newStatus === "interview") {
      return;
    }

    await sendEmail({
      to: candidateEmail,
      content: applicationStatusChangedTemplate({
        appName,
        candidateName,
        jobTitle,
        statusLabel: getCandidateStatusLabel(newStatus),
      }),
      context: "application-status-changed",
    });
  });
}

export async function notifyInterviewScheduled(payload: InterviewEmailPayload): Promise<void> {
  await runNotification("interview-scheduled", async () => {
    await sendEmail({
      to: payload.candidateEmail,
      content: interviewScheduledTemplate(buildInterviewTemplateArgs(payload)),
      context: "interview-scheduled",
    });
  });
}

export async function notifyInterviewRescheduled(payload: InterviewEmailPayload): Promise<void> {
  await runNotification("interview-rescheduled", async () => {
    await sendEmail({
      to: payload.candidateEmail,
      content: interviewRescheduledTemplate(buildInterviewTemplateArgs(payload)),
      context: "interview-rescheduled",
    });
  });
}

export async function notifyInterviewCancelled(payload: InterviewEmailPayload): Promise<void> {
  await runNotification("interview-cancelled", async () => {
    await sendEmail({
      to: payload.candidateEmail,
      content: interviewCancelledTemplate({
        appName: getEmailConfig().appName,
        candidateName: payload.candidateName,
        jobTitle: payload.jobTitle,
        interviewDate: payload.interviewDate,
        interviewTime: payload.interviewTime,
      }),
      context: "interview-cancelled",
    });
  });
}
