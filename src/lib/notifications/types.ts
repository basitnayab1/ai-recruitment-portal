// Shared notification constants — safe for Server and Client Components.

export const NOTIFICATION_ROLES = ["candidate", "hr"] as const;
export type NotificationRole = (typeof NOTIFICATION_ROLES)[number];

export const NOTIFICATION_REFERENCE_TYPES = ["application", "interview"] as const;
export type NotificationReferenceType = (typeof NOTIFICATION_REFERENCE_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "application_submitted",
  "application_status_changed",
  "application_hired",
  "application_rejected",
  "interview_scheduled",
  "interview_rescheduled",
  "interview_cancelled",
  "new_application",
  "interview_updated",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationRole(value: string): value is NotificationRole {
  return (NOTIFICATION_ROLES as readonly string[]).includes(value);
}

export function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export const NOTIFICATIONS_PAGE_SIZE = 20;
export const NOTIFICATION_PREVIEW_LIMIT = 8;
