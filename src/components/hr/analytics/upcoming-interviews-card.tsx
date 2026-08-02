import Link from "next/link";
import type { UpcomingInterview } from "@/lib/hr/analytics/types";
import { DashboardCardShell } from "@/components/shared/dashboard-card-shell";
import { InterviewStatusBadge } from "@/components/hr/interview-status-badge";
import { formatDate } from "@/lib/hr/format";
import { INTERVIEW_TYPE_LABELS } from "@/lib/hr/interviews";
import {
  TABLE_BASE,
  TABLE_BODY,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_ROW,
  TABLE_WRAPPER,
} from "@/lib/ui/classes";

function formatInterviewTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date(1970, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function UpcomingInterviewsCard({
  interviews,
}: {
  interviews: UpcomingInterview[];
}) {
  return (
    <DashboardCardShell title="Upcoming Interviews" href="/hr/interviews" linkLabel="View all">
      {interviews.length === 0 ? (
        <div className="px-6 py-10">
          <p className="text-sm text-zinc-400">
            Scheduled interviews with upcoming dates will appear here.
          </p>
        </div>
      ) : (
        <div className={TABLE_WRAPPER}>
          <table className={TABLE_BASE}>
            <thead className={TABLE_HEAD}>
              <tr>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Candidate
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Job
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Date
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Time
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Type
                </th>
                <th scope="col" className={TABLE_HEAD_CELL}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={TABLE_BODY}>
              {interviews.map((interview) => (
                <tr key={interview.id} className={TABLE_ROW}>
                  <td className={`${TABLE_CELL} font-medium whitespace-nowrap text-white`}>
                    <Link
                      href={`/hr/applications/${interview.applicationId}`}
                      className="transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm"
                    >
                      {interview.candidateName}
                    </Link>
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                    {interview.jobTitle}
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                    {formatDate(interview.interviewDate)}
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                    {formatInterviewTime(interview.interviewTime)}
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                    {INTERVIEW_TYPE_LABELS[interview.interviewType]}
                  </td>
                  <td className={TABLE_CELL}>
                    <InterviewStatusBadge status={interview.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCardShell>
  );
}
