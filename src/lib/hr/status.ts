// Shared application-status metadata used across the HR dashboard (badges,
// status distribution bars, recent activity copy). Kept dependency-free so
// it can be safely imported from both Server and Client Components.

export const APPLICATION_STATUSES = [
  "new",
  "ai_shortlisted",
  "hr_review",
  "interview",
  "hold",
  "rejected",
  "selected",
  "hired",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

type StatusMeta = {
  label: string;
  badgeClassName: string;
  barClassName: string;
};

// The curated set of statuses HR can move an application to from the
// review UI (Application Details → Status Management). Deliberately a
// subset of `APPLICATION_STATUSES` with review-workflow-friendly labels —
// "hold" and "selected" remain valid enum values (still rendered correctly
// by `StatusBadge` for any application already in one of those states,
// e.g. from before this feature existed) but are not offered as a new
// target here, since they weren't part of the requested workflow.
export const STATUS_CHANGE_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "Pending" },
  { value: "hr_review", label: "Under Review" },
  { value: "ai_shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview Scheduled" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

export function isStatusChangeOption(value: string): value is ApplicationStatus {
  return STATUS_CHANGE_OPTIONS.some((option) => option.value === value);
}

export const APPLICATION_STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  new: {
    label: "New",
    badgeClassName:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    barClassName: "bg-zinc-400 dark:bg-zinc-500",
  },
  ai_shortlisted: {
    label: "AI Shortlisted",
    badgeClassName:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    barClassName: "bg-violet-500",
  },
  hr_review: {
    label: "HR Review",
    badgeClassName:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    barClassName: "bg-amber-500",
  },
  interview: {
    label: "Interview",
    badgeClassName:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    barClassName: "bg-blue-500",
  },
  hold: {
    label: "Hold",
    badgeClassName:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    barClassName: "bg-orange-500",
  },
  rejected: {
    label: "Rejected",
    badgeClassName: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    barClassName: "bg-red-500",
  },
  selected: {
    label: "Selected",
    badgeClassName:
      "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    barClassName: "bg-teal-500",
  },
  hired: {
    label: "Hired",
    badgeClassName:
      "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    barClassName: "bg-green-500",
  },
};
