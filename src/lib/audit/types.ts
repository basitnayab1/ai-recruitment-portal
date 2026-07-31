// Shared audit log constants — safe for Server and Client Components.

export const AUDIT_ACTIONS = [
  "job_created",
  "job_updated",
  "job_deleted",
  "candidate_applied",
  "application_status_changed",
  "interview_scheduled",
  "interview_rescheduled",
  "interview_cancelled",
  "interview_updated",
  "candidate_hired",
  "candidate_rejected",
  "hr_note_added",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = [
  "job",
  "application",
  "interview",
  "application_note",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_ACTOR_ROLES = ["candidate", "hr", "admin"] as const;
export type AuditActorRole = (typeof AUDIT_ACTOR_ROLES)[number];

export const AUDIT_LOG_PAGE_SIZE = 25;

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  job_created: "Job Created",
  job_updated: "Job Updated",
  job_deleted: "Job Deleted",
  candidate_applied: "Candidate Applied",
  application_status_changed: "Application Status Changed",
  interview_scheduled: "Interview Scheduled",
  interview_rescheduled: "Interview Rescheduled",
  interview_cancelled: "Interview Cancelled",
  interview_updated: "Interview Updated",
  candidate_hired: "Candidate Hired",
  candidate_rejected: "Candidate Rejected",
  hr_note_added: "HR Notes Updated",
};

export function isAuditAction(value: string): value is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export type AuditLogMetadata = {
  actorName?: string;
  candidateId?: string | null;
  candidateName?: string | null;
  jobId?: string | null;
  jobTitle?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  details?: string | null;
};

export type AuditLogItem = {
  id: string;
  actorId: string | null;
  actorRole: AuditActorRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  description: string;
  metadata: AuditLogMetadata;
  createdAt: string;
};

export type AuditLogFilters = {
  dateFrom?: string;
  dateTo?: string;
  action?: AuditAction;
  hrId?: string;
  candidateQ?: string;
  jobId?: string;
  page: number;
};

export type AuditLogsPage = {
  logs: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AuditLogFilterOptions = {
  hrUsers: { id: string; name: string }[];
  jobs: { id: string; title: string }[];
};
