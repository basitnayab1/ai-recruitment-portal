import { JOB_STATUS_BADGE_CLASSNAME, JOB_STATUS_LABELS, type JobStatus } from "@/lib/hr/jobs";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${JOB_STATUS_BADGE_CLASSNAME[status]}`}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}
