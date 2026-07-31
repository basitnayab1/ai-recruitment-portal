import "server-only";

import { createAuditLog } from "@/lib/audit/create";
import type { AuditActorRole, AuditLogMetadata } from "@/lib/audit/types";
import { APPLICATION_STATUS_META, type ApplicationStatus } from "@/lib/hr/status";
import type { HRRole } from "@/lib/auth/dal";

type AuditActor = {
  id: string;
  role: AuditActorRole;
  name: string;
};

function hrActor(profile: { id: string; fullName: string; role: HRRole }): AuditActor {
  return {
    id: profile.id,
    role: profile.role,
    name: profile.fullName,
  };
}

function candidateActor(profile: { id: string; fullName: string }): AuditActor {
  return {
    id: profile.id,
    role: "candidate",
    name: profile.fullName,
  };
}

function applicationMetadata({
  candidateId,
  candidateName,
  jobId,
  jobTitle,
  extra,
}: {
  candidateId?: string | null;
  candidateName?: string | null;
  jobId?: string | null;
  jobTitle?: string | null;
  extra?: AuditLogMetadata;
}): AuditLogMetadata {
  return {
    candidateId: candidateId ?? null,
    candidateName: candidateName ?? null,
    jobId: jobId ?? null,
    jobTitle: jobTitle ?? null,
    ...extra,
  };
}

function statusLabel(status: string): string {
  return status in APPLICATION_STATUS_META
    ? APPLICATION_STATUS_META[status as ApplicationStatus].label
    : status;
}

export async function auditJobCreated(
  actor: AuditActor,
  job: { id: string; title: string }
): Promise<void> {
  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "job_created",
    entityType: "job",
    entityId: job.id,
    description: `${actor.name} created job "${job.title}".`,
    metadata: {
      actorName: actor.name,
      jobId: job.id,
      jobTitle: job.title,
    },
  });
}

export async function auditJobUpdated(
  actor: AuditActor,
  job: { id: string; title: string },
  details?: string
): Promise<void> {
  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "job_updated",
    entityType: "job",
    entityId: job.id,
    description: `${actor.name} updated job "${job.title}".`,
    metadata: {
      actorName: actor.name,
      jobId: job.id,
      jobTitle: job.title,
      details: details ?? null,
    },
  });
}

export async function auditCandidateApplied(
  actor: AuditActor,
  application: {
    id: string;
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
  }
): Promise<void> {
  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "candidate_applied",
    entityType: "application",
    entityId: application.id,
    description: `${application.candidateName} applied for "${application.jobTitle}".`,
    metadata: applicationMetadata({
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      jobId: application.jobId,
      jobTitle: application.jobTitle,
      extra: { actorName: actor.name },
    }),
  });
}

export async function auditApplicationStatusChanged(
  actor: AuditActor,
  application: {
    id: string;
    candidateId: string | null;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    previousStatus: string;
    newStatus: string;
  }
): Promise<void> {
  const action =
    application.newStatus === "hired"
      ? "candidate_hired"
      : application.newStatus === "rejected"
        ? "candidate_rejected"
        : "application_status_changed";

  const description =
    action === "candidate_hired"
      ? `${actor.name} marked ${application.candidateName} as hired for "${application.jobTitle}".`
      : action === "candidate_rejected"
        ? `${actor.name} rejected ${application.candidateName} for "${application.jobTitle}".`
        : `${actor.name} changed ${application.candidateName}'s application for "${application.jobTitle}" from ${statusLabel(application.previousStatus)} to ${statusLabel(application.newStatus)}.`;

  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action,
    entityType: "application",
    entityId: application.id,
    description,
    metadata: applicationMetadata({
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      jobId: application.jobId,
      jobTitle: application.jobTitle,
      extra: {
        actorName: actor.name,
        previousStatus: application.previousStatus,
        newStatus: application.newStatus,
      },
    }),
  });
}

export async function auditInterviewScheduled(
  actor: AuditActor,
  context: {
    interviewId: string;
    candidateId: string | null;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    interviewDate: string;
    interviewTime: string;
  }
): Promise<void> {
  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "interview_scheduled",
    entityType: "interview",
    entityId: context.interviewId,
    description: `${actor.name} scheduled an interview for ${context.candidateName} — ${context.jobTitle}.`,
    metadata: applicationMetadata({
      candidateId: context.candidateId,
      candidateName: context.candidateName,
      jobId: context.jobId,
      jobTitle: context.jobTitle,
      extra: {
        actorName: actor.name,
        details: `${context.interviewDate} ${context.interviewTime}`,
      },
    }),
  });
}

export async function auditInterviewRescheduled(
  actor: AuditActor,
  context: {
    interviewId: string;
    candidateId: string | null;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    interviewDate: string;
    interviewTime: string;
  }
): Promise<void> {
  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "interview_rescheduled",
    entityType: "interview",
    entityId: context.interviewId,
    description: `${actor.name} rescheduled the interview for ${context.candidateName} — ${context.jobTitle}.`,
    metadata: applicationMetadata({
      candidateId: context.candidateId,
      candidateName: context.candidateName,
      jobId: context.jobId,
      jobTitle: context.jobTitle,
      extra: {
        actorName: actor.name,
        details: `${context.interviewDate} ${context.interviewTime}`,
      },
    }),
  });
}

export async function auditInterviewCancelled(
  actor: AuditActor,
  context: {
    interviewId: string;
    candidateId: string | null;
    candidateName: string;
    jobId: string;
    jobTitle: string;
  }
): Promise<void> {
  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "interview_cancelled",
    entityType: "interview",
    entityId: context.interviewId,
    description: `${actor.name} cancelled the interview for ${context.candidateName} — ${context.jobTitle}.`,
    metadata: applicationMetadata({
      candidateId: context.candidateId,
      candidateName: context.candidateName,
      jobId: context.jobId,
      jobTitle: context.jobTitle,
      extra: { actorName: actor.name },
    }),
  });
}

export async function auditInterviewUpdated(
  actor: AuditActor,
  context: {
    interviewId: string;
    candidateId: string | null;
    candidateName: string;
    jobId: string;
    jobTitle: string;
  }
): Promise<void> {
  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "interview_updated",
    entityType: "interview",
    entityId: context.interviewId,
    description: `${actor.name} updated interview details for ${context.candidateName} — ${context.jobTitle}.`,
    metadata: applicationMetadata({
      candidateId: context.candidateId,
      candidateName: context.candidateName,
      jobId: context.jobId,
      jobTitle: context.jobTitle,
      extra: { actorName: actor.name },
    }),
  });
}

export async function auditHRNoteAdded(
  actor: AuditActor,
  context: {
    applicationId: string;
    candidateId: string | null;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    notePreview: string;
  }
): Promise<void> {
  await createAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "hr_note_added",
    entityType: "application_note",
    entityId: context.applicationId,
    description: `${actor.name} added an HR note on ${context.candidateName}'s application for "${context.jobTitle}".`,
    metadata: applicationMetadata({
      candidateId: context.candidateId,
      candidateName: context.candidateName,
      jobId: context.jobId,
      jobTitle: context.jobTitle,
      extra: {
        actorName: actor.name,
        details: context.notePreview.slice(0, 200),
      },
    }),
  });
}

export { hrActor, candidateActor };
