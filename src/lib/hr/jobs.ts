// Shared job-related types/constants, safe to import from both Server and
// Client Components (no secrets, no server-only APIs).

export const JOB_STATUSES = ["draft", "published", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export function isJobStatus(value: string): value is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value);
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

export const JOB_STATUS_BADGE_CLASSNAME: Record<JobStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  published: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  closed: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export function isEmploymentType(value: string): value is EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(value);
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
};
