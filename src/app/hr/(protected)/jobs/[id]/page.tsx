import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHRUser } from "@/lib/auth/dal";
import { getJobById } from "@/lib/hr/jobs-data";
import { JobStatusBadge } from "@/components/hr/jobs/job-status-badge";
import { JobRowActions } from "@/components/hr/jobs/job-row-actions";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { formatDate } from "@/lib/hr/format";
import { DETAIL_SECTION, INSIGHT_TILE, PAGE_LINK_BACK, PAGE_TITLE } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Job Details | AI Recruitment Portal",
};

function formatSalaryRange(min: number | null, max: number | null): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  if (min !== null && max !== null) return `${formatter.format(min)} – ${formatter.format(max)}`;
  if (min !== null) return `From ${formatter.format(min)}`;
  if (max !== null) return `Up to ${formatter.format(max)}`;
  return "Not specified";
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  await requireHRUser();
  const { id } = await params;
  const { created, updated } = await searchParams;

  const job = await getJobById(id);
  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/hr/jobs" className={PAGE_LINK_BACK}>
            ← Back to Jobs
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className={PAGE_TITLE}>{job.title}</h1>
            <JobStatusBadge status={job.status} />
            {job.isRemote ? (
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                Remote
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {[job.department, job.location].filter(Boolean).join(" · ") || "No department or location set"}
          </p>
        </div>
        <JobRowActions jobId={job.id} status={job.status} />
      </div>

      {created ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">
          Job created successfully.
        </p>
      ) : null}
      {updated ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">
          Job updated successfully.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className={INSIGHT_TILE}>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Applications</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {job.applicationCount}
          </p>
        </div>
        <div className={INSIGHT_TILE}>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Employment type</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </p>
        </div>
        <div className={INSIGHT_TILE}>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Created</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {formatDate(job.createdAt)}
          </p>
        </div>
        <div className={INSIGHT_TILE}>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {job.status === "draft" ? "Deadline" : "Published"}
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {job.status === "draft"
              ? job.closesAt
                ? formatDate(job.closesAt)
                : "Not set"
              : job.publishedAt
                ? formatDate(job.publishedAt)
                : "—"}
          </p>
        </div>
      </div>

      <div className={DETAIL_SECTION}>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Salary range</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {formatSalaryRange(job.salaryMin, job.salaryMax)}
        </p>
      </div>

      <div className={DETAIL_SECTION}>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
          {job.description}
        </p>
      </div>

      {job.responsibilities ? (
        <div className={DETAIL_SECTION}>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Responsibilities
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
            {job.responsibilities}
          </p>
        </div>
      ) : null}

      {job.requirements ? (
        <div className={DETAIL_SECTION}>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Requirements
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
            {job.requirements}
          </p>
        </div>
      ) : null}
    </div>
  );
}
