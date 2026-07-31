import Link from "next/link";
import { formatDate } from "@/lib/hr/format";
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
import type { HRCandidatesPage } from "@/lib/hr/candidates-data";

export function CandidatesTable({
  candidatesPage,
  extraParams = {},
}: {
  candidatesPage: HRCandidatesPage;
  extraParams?: Record<string, string | undefined>;
}) {
  const { candidates, page, pageSize, total } = candidatesPage;

  return (
    <DataTableShell
      footer={
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/hr/candidates"
          extraParams={extraParams}
        />
      }
    >
      <table className={TABLE_BASE}>
        <thead className={TABLE_HEAD}>
          <tr>
            <th scope="col" className={TABLE_HEAD_CELL}>
              <span className="sr-only">Photo</span>
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Full Name
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Email
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Phone
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Experience
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Location
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Resume
            </th>
            <th scope="col" className={TABLE_HEAD_CELL}>
              Created Date
            </th>
          </tr>
        </thead>
        <tbody className={TABLE_BODY}>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className={TABLE_ROW}>
              <td className={TABLE_CELL}>
                <CandidateAvatar
                  name={candidate.fullName}
                  pictureSrc={candidate.pictureUrl}
                  size="md"
                />
              </td>
              <td className="px-0 py-0">
                <Link
                  href={`/hr/candidates/${candidate.id}`}
                  className="block px-6 py-4 font-medium whitespace-nowrap text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
                >
                  {candidate.fullName}
                </Link>
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {candidate.email}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {candidate.phone ?? "—"}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {candidate.yearsOfExperience != null ? `${candidate.yearsOfExperience} yrs` : "—"}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {candidate.location ?? "—"}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap`}>
                <span
                  className={
                    candidate.hasResume
                      ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }
                >
                  {candidate.hasResume ? "Yes" : "No"}
                </span>
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                {formatDate(candidate.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
