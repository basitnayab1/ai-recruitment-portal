// Shared interview types/constants — safe for Server and Client Components.

export const INTERVIEW_TYPES = ["online", "on_site", "phone"] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_STATUSES = ["scheduled", "cancelled", "completed"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

/**
 * Pure helper: builds a human-readable interview location string.
 * Safe for Server and Client Components (no browser APIs).
 */
export function resolveInterviewLocation(
  interviewType: InterviewType | undefined,
  meetingLink: string | null | undefined,
  officeLocation: string | null | undefined
): string {
  if (interviewType === "online") {
    return meetingLink?.trim() || "Online meeting — link to be shared";
  }
  if (interviewType === "on_site") {
    return officeLocation?.trim() || "Office location to be confirmed";
  }
  if (interviewType === "phone") {
    return meetingLink?.trim() || "HR will call at the scheduled time";
  }
  return meetingLink?.trim() || officeLocation?.trim() || "";
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  online: "Online",
  on_site: "On-site",
  phone: "Phone",
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: "Scheduled",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const INTERVIEW_STATUS_BADGE_CLASSNAME: Record<InterviewStatus, string> = {
  scheduled: "border border-blue-400/30 bg-blue-500/15 text-blue-200",
  cancelled: "border border-red-400/30 bg-red-500/15 text-red-300",
  completed: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
};

export const INTERVIEW_DURATIONS = [15, 30, 45, 60, 90, 120] as const;

export const INTERVIEW_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export type InterviewTimezone = (typeof INTERVIEW_TIMEZONES)[number];

export function isInterviewType(value: string): value is InterviewType {
  return (INTERVIEW_TYPES as readonly string[]).includes(value);
}

export function isInterviewStatus(value: string): value is InterviewStatus {
  return (INTERVIEW_STATUSES as readonly string[]).includes(value);
}

export function isInterviewTimezone(value: string): value is InterviewTimezone {
  return (INTERVIEW_TIMEZONES as readonly string[]).includes(value);
}

export function formatInterviewDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours}h ${remainder}m`;
}

export type InterviewFormDefaults = {
  id?: string;
  interviewerName: string;
  interviewType: InterviewType;
  meetingLink: string | null;
  officeLocation: string | null;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  durationMinutes: number;
  notes: string | null;
  status?: InterviewStatus;
};
