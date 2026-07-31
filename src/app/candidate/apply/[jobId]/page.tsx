import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { sanitizeNextPath } from "@/lib/candidate-auth/next-path";
import { getCandidateProfileDetails } from "@/lib/candidate/profile-data";
import { getProfileCompletion, MIN_PROFILE_COMPLETION_TO_APPLY } from "@/lib/candidate/dashboard-data";
import { getCandidateResume } from "@/lib/candidate/resume-data";
import { hasAppliedToJob } from "@/lib/candidate/application-data";
import { getJobForApplication } from "@/lib/public/jobs-data";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { ApplyForm } from "@/components/candidate/apply-form";
import { DETAIL_SECTION, PAGE_LINK_BACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Apply | AI Recruitment Portal",
};

type Params = { jobId: string };

/**
 * Landing point for a logged-in candidate's "Apply Now" click (requirement
 * 1). `requireCandidateUser` re-checks auth server-side even though the
 * button already gates this (defense in depth against a direct URL visit)
 * and sends anyone not signed in back through `/candidate/login` with
 * `next` pointing right back here.
 *
 * Every validation (requirement 4) is enforced here, before anything
 * renders: a job that doesn't exist/isn't published is a 404; a candidate
 * who already applied or whose job has since closed sees a friendly
 * message instead of the form; an incomplete profile (<70%) or missing
 * résumé redirects to the page that fixes it, with `next` pointing back
 * here so they land right back after fixing it.
 */
export default async function CandidateApplyPage({ params }: { params: Promise<Params> }) {
  const { jobId } = await params;

  const job = await getJobForApplication(jobId);
  if (!job) {
    notFound();
  }

  const profile = await requireCandidateUser(`/candidate/apply/${jobId}`);

  const applicationCheck = await hasAppliedToJob(profile.id, jobId);
  const alreadyApplied = applicationCheck.status === "checked" && applicationCheck.applied;

  const [details, resume] = await Promise.all([
    getCandidateProfileDetails(profile.id),
    getCandidateResume(profile.id),
  ]);
  const completion = getProfileCompletion(profile, details);

  if (applicationCheck.status !== "error" && !alreadyApplied && job.isOpen) {
    if (completion.percentage < MIN_PROFILE_COMPLETION_TO_APPLY) {
      redirect(
        `/candidate/profile?notice=apply_profile&next=${encodeURIComponent(sanitizeNextPath(`/candidate/apply/${jobId}`))}`
      );
    }
    if (!resume) {
      redirect(
        `/candidate/resume?notice=apply_resume&next=${encodeURIComponent(sanitizeNextPath(`/candidate/apply/${jobId}`))}`
      );
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <Link href={`/jobs/${jobId}`} className={`inline-flex items-center gap-1.5 ${PAGE_LINK_BACK}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to job details
          </Link>

          <div className={`mt-6 ${DETAIL_SECTION}`}>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Apply for {job.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {job.department ? `${job.department} · ` : ""}
              {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
            </p>

            {applicationCheck.status === "error" ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-500" aria-hidden="true" />
                <div>
                  <p className="font-medium">We couldn&apos;t check your application status.</p>
                  <p className="mt-1">{applicationCheck.message}</p>
                </div>
              </div>
            ) : alreadyApplied ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-500" aria-hidden="true" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    You have already applied for this job.
                  </p>
                  <Link
                    href="/candidate/applications"
                    className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    View your applications →
                  </Link>
                </div>
              </div>
            ) : !job.isOpen ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-500" aria-hidden="true" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    This job is now closed and no longer accepting applications.
                  </p>
                  <Link
                    href="/jobs"
                    className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Browse open jobs →
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Your details
                  </h2>
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-50">{profile.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-50">{profile.email}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Phone</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                        {details?.phone ?? profile.phone ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Resume</dt>
                      <dd className="flex items-center gap-1.5 font-medium text-green-700 dark:text-green-500">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {resume?.fileName ?? "Uploaded"}
                      </dd>
                    </div>
                  </dl>
                  <Link
                    href="/candidate/profile"
                    className="inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Edit your profile →
                  </Link>
                </div>

                <div className="mt-6">
                  <ApplyForm
                    jobId={job.id}
                    defaultExpectedSalary={details?.expectedSalary}
                    defaultNoticePeriod={details?.noticePeriod}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
