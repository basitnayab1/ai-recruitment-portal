import { APPLICATION_STATUS_META, type ApplicationStatus } from "@/lib/hr/status";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = APPLICATION_STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClassName}`}
    >
      {meta.label}
    </span>
  );
}
