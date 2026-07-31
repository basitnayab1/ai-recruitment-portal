import { AUDIT_ACTION_LABELS, type AuditLogItem } from "@/lib/audit/types";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";
import {
  TABLE_BASE,
  TABLE_BODY,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_ROW,
} from "@/lib/ui/classes";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function ActivityLogTable({
  logs,
  pictureCandidateUrls,
}: {
  logs: AuditLogItem[];
  pictureCandidateUrls: Map<string, string>;
}) {
  return (
    <table className={TABLE_BASE}>
      <thead className={TABLE_HEAD}>
        <tr>
          <th scope="col" className={TABLE_HEAD_CELL}>
            Date & Time
          </th>
          <th scope="col" className={TABLE_HEAD_CELL}>
            HR / Actor
          </th>
          <th scope="col" className={TABLE_HEAD_CELL}>
            Action
          </th>
          <th scope="col" className={TABLE_HEAD_CELL}>
            Candidate
          </th>
          <th scope="col" className={TABLE_HEAD_CELL}>
            Job
          </th>
          <th scope="col" className={TABLE_HEAD_CELL}>
            Details
          </th>
        </tr>
      </thead>
      <tbody className={TABLE_BODY}>
        {logs.map((log) => {
          const candidateId = log.metadata.candidateId ?? null;
          const candidateName = log.metadata.candidateName ?? "—";

          return (
            <tr key={log.id} className={TABLE_ROW}>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                <time dateTime={log.createdAt}>{formatDateTime(log.createdAt)}</time>
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-900 dark:text-zinc-50`}>
                {log.metadata.actorName ??
                  (log.actorRole === "candidate" ? "Candidate" : "HR User")}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap`}>
                <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {AUDIT_ACTION_LABELS[log.action]}
                </span>
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {candidateId && candidateName !== "—" ? (
                  <div className="flex items-center gap-2">
                    <CandidateAvatar
                      name={candidateName}
                      pictureSrc={pictureCandidateUrls.get(candidateId) ?? null}
                      size="sm"
                    />
                    <span>{candidateName}</span>
                  </div>
                ) : (
                  candidateName
                )}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {log.metadata.jobTitle ?? "—"}
              </td>
              <td className={`${TABLE_CELL} max-w-sm text-zinc-600 dark:text-zinc-400`}>
                <p className="line-clamp-2">{log.metadata.details ?? log.description}</p>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
