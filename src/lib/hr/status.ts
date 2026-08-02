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

/** Dark-glass badge surfaces — readable on purple void backgrounds. */
export const APPLICATION_STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  new: {
    label: "New",
    badgeClassName: "border border-white/15 bg-white/10 text-zinc-200",
    barClassName: "bg-zinc-400",
  },
  ai_shortlisted: {
    label: "AI Shortlisted",
    badgeClassName: "border border-violet-400/30 bg-violet-500/15 text-violet-200",
    barClassName: "bg-violet-500",
  },
  hr_review: {
    label: "HR Review",
    badgeClassName: "border border-amber-400/30 bg-amber-500/15 text-amber-200",
    barClassName: "bg-amber-500",
  },
  interview: {
    label: "Interview",
    badgeClassName: "border border-blue-400/30 bg-blue-500/15 text-blue-200",
    barClassName: "bg-blue-500",
  },
  hold: {
    label: "Hold",
    badgeClassName: "border border-orange-400/30 bg-orange-500/15 text-orange-200",
    barClassName: "bg-orange-500",
  },
  rejected: {
    label: "Rejected",
    badgeClassName: "border border-red-400/30 bg-red-500/15 text-red-300",
    barClassName: "bg-red-500",
  },
  selected: {
    label: "Selected",
    badgeClassName: "border border-teal-400/30 bg-teal-500/15 text-teal-200",
    barClassName: "bg-teal-500",
  },
  hired: {
    label: "Hired",
    badgeClassName: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    barClassName: "bg-emerald-500",
  },
};
