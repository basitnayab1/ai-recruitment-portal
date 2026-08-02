import Link from "next/link";
import { InterviewStatusBadge, INTERVIEW_TYPE_LABELS } from "@/components/hr/interview-status-badge";
import { Pagination } from "@/components/hr/pagination";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  TABLE_BASE,
  TABLE_BODY,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_ROW,
} from "@/lib/ui/classes";
import { formatDate } from "@/lib/hr/format";
import type { HRInterviewsPage } from "@/lib/hr/interviews-list-data";

export function InterviewsTable({
  interviewsPage,
  extraParams,
}: {
  interviewsPage: HRInterviewsPage;
  extraParams?: Record<string, string | undefined>;
}) {
  const { interviews, page, pageSize, total } = interviewsPage;

  return (
    <DataTableShell
      footer={
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/hr/interviews"
          extraParams={extraParams}
        />
      }
    >
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
              Interviewer
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Type
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Date
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Time
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Status
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className={TABLE_BODY}>
          {interviews.map((interview) => (
            <tr key={interview.id} className={TABLE_ROW}>
              <td className={`${TABLE_CELL} whitespace-nowrap`}>
                <div className="flex items-center gap-3">
                  <CandidateAvatar
                    name={interview.candidateName}
                    pictureSrc={interview.pictureUrl}
                    size="md"
                  />
                  <span className="font-medium text-white">
                    {interview.candidateName}
                  </span>
                </div>
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                {interview.jobTitle}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                {interview.interviewerName}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                {INTERVIEW_TYPE_LABELS[interview.interviewType]}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                {formatDate(interview.interviewDate)}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-200`}>
                {interview.interviewTime}
              </td>
              <td className={TABLE_CELL}>
                <InterviewStatusBadge status={interview.status} />
              </td>
              <td className={`${TABLE_CELL} text-right whitespace-nowrap`}>
                <Link
                  href={`/hr/applications/${interview.applicationId}`}
                  className="font-medium text-white underline underline-offset-2 hover:no-underline"
                >
                  View application
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
