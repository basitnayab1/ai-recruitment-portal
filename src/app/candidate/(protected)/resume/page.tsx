import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowRight, Download } from "lucide-react";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { sanitizeNextPath } from "@/lib/candidate-auth/next-path";
import { getCandidateResume, getResumeDownloadUrl } from "@/lib/candidate/resume-data";
import { ResumeUploadForm } from "@/components/candidate/resume-upload-form";
import { ResumeDeleteButton } from "@/components/candidate/resume-delete-button";
import { PageHeader } from "@/components/shared/page-header";
import { MotionFadeIn } from "@/components/candidate/ui/motion-wrapper";
import { ALERT_WARNING, BTN_SECONDARY, DETAIL_SECTION, PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "My Resume | AI Recruitment Portal",
};

const fileSizeFormatter = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function CandidateResumePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; next?: string }>;
}) {
  const profile = await requireCandidateUser();
  const { notice, next } = await searchParams;

  const resume = await getCandidateResume(profile.id);
  const downloadUrl = resume ? await getResumeDownloadUrl(resume.storagePath, resume.fileName) : null;
  const safeNext = next ? sanitizeNextPath(next, "") : "";

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="My Resume"
        description="Keep an up-to-date resume on file so you can apply to jobs in one click."
      />

      {notice === "apply_resume" ? (
        <p role="alert" className={ALERT_WARNING}>
          Please upload your resume before applying.
        </p>
      ) : null}

      <MotionFadeIn>
        <div className={DETAIL_SECTION}>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Current Resume
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {resume
              ? "This file will be submitted with your job applications."
              : "You haven't uploaded a resume yet."}
          </p>

          <div className="mt-6 space-y-6">
            {resume ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-violet-50/50 to-white p-5 sm:flex-row sm:items-center dark:border-zinc-800/60 dark:from-violet-950/20 dark:to-zinc-900/80">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                  <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {resume.fileName}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {fileSizeFormatter(resume.fileSize)} · Uploaded{" "}
                    {dateFormatter.format(new Date(resume.uploadedAt))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {downloadUrl ? (
                    <a href={downloadUrl} className={BTN_SECONDARY}>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download
                    </a>
                  ) : null}
                  <ResumeDeleteButton />
                </div>
              </div>
            ) : null}

            {safeNext && resume ? (
              <Link
                href={safeNext}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400"
              >
                Continue to job application
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}

            <ResumeUploadForm hasExistingResume={Boolean(resume)} />
          </div>
        </div>
      </MotionFadeIn>
    </div>
  );
}
