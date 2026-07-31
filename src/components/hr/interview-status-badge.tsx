import {
  INTERVIEW_STATUS_BADGE_CLASSNAME,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  type InterviewStatus,
} from "@/lib/hr/interviews";

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INTERVIEW_STATUS_BADGE_CLASSNAME[status]}`}
    >
      {INTERVIEW_STATUS_LABELS[status]}
    </span>
  );
}

export { INTERVIEW_TYPE_LABELS };
