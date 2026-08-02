import Link from "next/link";
import { FileText } from "lucide-react";
import type { CandidateResume } from "@/lib/candidate/resume-data";
import { CARD_HEADER_LINK, CHART_CARD } from "@/lib/ui/classes";

const fileSizeFormatter = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function ResumeCard({ resume }: { resume: CandidateResume | null }) {
  return (
    <div className={`flex h-full flex-col ${CHART_CARD}`}>
      <h2 className="text-sm font-semibold text-white">Resume</h2>

      {resume ? (
        <div className="mt-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{resume.fileName}</p>
            <p className="text-xs text-zinc-400">
              {fileSizeFormatter(resume.fileSize)} · Uploaded {dateFormatter.format(new Date(resume.uploadedAt))}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">No resume uploaded yet.</p>
      )}

      <Link href="/candidate/resume" className={`mt-auto pt-4 ${CARD_HEADER_LINK} text-sm`}>
        {resume ? "Manage Resume" : "Upload Resume"}
      </Link>
    </div>
  );
}
