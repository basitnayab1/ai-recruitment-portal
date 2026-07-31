import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, CalendarDays, CalendarX, Wallet } from "lucide-react";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
import { getPublicJobById } from "@/lib/public/jobs-data";
import { formatDate } from "@/lib/hr/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { ApplyLink } from "@/components/public/apply-link";
import { DETAIL_SECTION, INSIGHT_TILE, PAGE_LINK_BACK } from "@/lib/ui/classes";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJobById(id);

  return {
    title: job ? `${job.title} | AI Recruitment Portal` : "Job Not Found | AI Recruitment Portal",
    description: job?.shortDescription,
  };
}

const salaryFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatSalaryRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) return `${salaryFormatter.format(min)} – ${salaryFormatter.format(max)}`;
  if (min !== null) return `From ${salaryFormatter.format(min)}`;
  return `Up to ${salaryFormatter.format(max as number)}`;
}

export default async function PublicJobDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [job, profile] = await Promise.all([getPublicJobById(id), getCandidateProfile()]);

  if (!job) {
    notFound();
  }

  const salaryRange = formatSalaryRange(job.salaryMin, job.salaryMax);
  const isLoggedIn = Boolean(profile);

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/jobs" className={`inline-flex items-center gap-1.5 ${PAGE_LINK_BACK}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all jobs
          </Link>

          <div className={`mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between ${DETAIL_SECTION}`}>
            <div>
              {job.department ? (
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  {job.department}
                </span>
              ) : null}
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                {job.title}
              </h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {job.isRemote ? "Remote" : (job.location ?? "Location not specified")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Posted {job.publishedAt ? formatDate(job.publishedAt) : "recently"}
                </span>
                {job.closesAt ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarX className="h-4 w-4" aria-hidden="true" />
                    Closes {formatDate(job.closesAt)}
                  </span>
                ) : null}
                {salaryRange ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    {salaryRange}
                  </span>
                ) : null}
              </div>
            </div>

            <ApplyLink jobId={job.id} isLoggedIn={isLoggedIn} size="lg" className="w-full lg:w-auto" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <section>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Job Description</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {job.description}
                </p>
              </section>

              {job.responsibilities ? (
                <section>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Responsibilities</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {job.responsibilities}
                  </p>
                </section>
              ) : null}

              {job.requirements ? (
                <section>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Requirements</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {job.requirements}
                  </p>
                </section>
              ) : null}
            </div>

            <aside className={`space-y-5 lg:h-fit ${INSIGHT_TILE}`}>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Job Overview</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Department</dt>
                  <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {job.department ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Location</dt>
                  <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {job.isRemote ? "Remote" : (job.location ?? "—")}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Employment Type</dt>
                  <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Salary</dt>
                  <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {salaryRange ?? "Not disclosed"}
                  </dd>
                </div>
              </dl>
              <ApplyLink jobId={job.id} isLoggedIn={isLoggedIn} className="w-full" />
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
