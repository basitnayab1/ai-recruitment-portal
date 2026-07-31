import "server-only";

import { createNotification, createNotifications } from "@/lib/notifications/create";
import { getHRNotificationUserIds } from "@/lib/notifications/hr-recipients";
import { formatEmailDate, formatEmailTime } from "@/lib/email/format";

async function notifyAllHR({
  title,
  message,
  type,
  referenceId,
  referenceType,
}: {
  title: string;
  message: string;
  type: string;
  referenceId?: string | null;
  referenceType?: string | null;
}): Promise<void> {
  const userIds = await getHRNotificationUserIds();
  if (userIds.length === 0) {
    return;
  }

  await createNotifications(
    userIds.map((userId) => ({
      userId,
      role: "hr" as const,
      title,
      message,
      type,
      referenceId,
      referenceType,
    }))
  );
}

export async function notifyCandidateApplicationSubmitted({
  candidateId,
  applicationId,
  jobTitle,
}: {
  candidateId: string;
  applicationId: string;
  jobTitle: string;
}): Promise<void> {
  await createNotification({
    userId: candidateId,
    role: "candidate",
    title: "Application Submitted",
    message: `Your application for ${jobTitle} was submitted successfully.`,
    type: "application_submitted",
    referenceId: applicationId,
    referenceType: "application",
  });
}

export async function notifyHRNewApplication({
  applicationId,
  candidateName,
  jobTitle,
}: {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
}): Promise<void> {
  await notifyAllHR({
    title: "New Application",
    message: `${candidateName} applied for ${jobTitle}.`,
    type: "new_application",
    referenceId: applicationId,
    referenceType: "application",
  });
}

export async function notifyCandidateApplicationStatusChanged({
  candidateId,
  applicationId,
  jobTitle,
  status,
}: {
  candidateId: string;
  applicationId: string;
  jobTitle: string;
  status: string;
}): Promise<void> {
  if (!candidateId) {
    return;
  }

  const statusLabels: Record<string, { title: string; message: string; type: string }> = {
    hired: {
      title: "Congratulations — You're Hired!",
      message: `You have been hired for ${jobTitle}.`,
      type: "application_hired",
    },
    rejected: {
      title: "Application Update",
      message: `Your application for ${jobTitle} was not selected at this time.`,
      type: "application_rejected",
    },
  };

  const mapped = statusLabels[status] ?? {
    title: "Application Status Updated",
    message: `The status of your application for ${jobTitle} has been updated.`,
    type: "application_status_changed",
  };

  await createNotification({
    userId: candidateId,
    role: "candidate",
    title: mapped.title,
    message: mapped.message,
    type: mapped.type,
    referenceId: applicationId,
    referenceType: "application",
  });
}

export async function notifyCandidateInterviewScheduled({
  candidateId,
  interviewId,
  applicationId,
  jobTitle,
  interviewDate,
  interviewTime,
}: {
  candidateId: string | null;
  interviewId: string;
  applicationId: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
}): Promise<void> {
  if (!candidateId) {
    return;
  }

  await createNotification({
    userId: candidateId,
    role: "candidate",
    title: "Interview Scheduled",
    message: `Your interview for ${jobTitle} is scheduled on ${formatEmailDate(interviewDate)} at ${formatEmailTime(interviewTime)}.`,
    type: "interview_scheduled",
    referenceId: interviewId,
    referenceType: "interview",
  });

  await notifyHRInterviewUpdated({
    applicationId,
    interviewId,
    jobTitle,
    actionLabel: "scheduled",
  });
}

export async function notifyCandidateInterviewRescheduled({
  candidateId,
  interviewId,
  applicationId,
  jobTitle,
  interviewDate,
  interviewTime,
}: {
  candidateId: string | null;
  interviewId: string;
  applicationId: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
}): Promise<void> {
  if (!candidateId) {
    return;
  }

  await createNotification({
    userId: candidateId,
    role: "candidate",
    title: "Interview Rescheduled",
    message: `Your interview for ${jobTitle} has been moved to ${formatEmailDate(interviewDate)} at ${formatEmailTime(interviewTime)}.`,
    type: "interview_rescheduled",
    referenceId: interviewId,
    referenceType: "interview",
  });

  await notifyHRInterviewUpdated({
    applicationId,
    interviewId,
    jobTitle,
    actionLabel: "rescheduled",
  });
}

export async function notifyCandidateInterviewCancelled({
  candidateId,
  interviewId,
  applicationId,
  jobTitle,
  interviewDate,
  interviewTime,
}: {
  candidateId: string | null;
  interviewId: string;
  applicationId: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
}): Promise<void> {
  if (!candidateId) {
    return;
  }

  await createNotification({
    userId: candidateId,
    role: "candidate",
    title: "Interview Cancelled",
    message: `Your interview for ${jobTitle} on ${formatEmailDate(interviewDate)} at ${formatEmailTime(interviewTime)} has been cancelled.`,
    type: "interview_cancelled",
    referenceId: interviewId,
    referenceType: "interview",
  });

  await notifyHRInterviewUpdated({
    applicationId,
    interviewId,
    jobTitle,
    actionLabel: "cancelled",
  });
}

export async function notifyHRInterviewUpdated({
  applicationId,
  interviewId,
  jobTitle,
  actionLabel,
}: {
  applicationId: string;
  interviewId: string;
  jobTitle: string;
  actionLabel: "scheduled" | "rescheduled" | "cancelled" | "updated";
}): Promise<void> {
  const actionText =
    actionLabel === "updated"
      ? "updated"
      : actionLabel === "scheduled"
        ? "scheduled"
        : actionLabel === "rescheduled"
          ? "rescheduled"
          : "cancelled";

  await notifyAllHR({
    title: "Interview Updated",
    message: `Interview for ${jobTitle} was ${actionText}.`,
    type: "interview_updated",
    referenceId: applicationId,
    referenceType: "application",
  });
}
