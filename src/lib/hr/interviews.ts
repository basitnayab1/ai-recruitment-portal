// Shared interview types/constants — safe for Server and Client Components.

export const INTERVIEW_TYPES = ["online", "on_site", "phone"] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_STATUSES = ["scheduled", "cancelled", "completed"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

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
  scheduled: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  completed: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
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
