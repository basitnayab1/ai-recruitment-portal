"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { sanitizeNextPath } from "@/lib/candidate-auth/next-path";
import { createClient } from "@/lib/supabase/server";
import { getCandidateProfileDetails } from "@/lib/candidate/profile-data";
import { isNoticePeriod } from "@/lib/candidate/profile-details";
import { getProfileCompletion, MIN_PROFILE_COMPLETION_TO_APPLY } from "@/lib/candidate/dashboard-data";
import { getCandidateResume } from "@/lib/candidate/resume-data";
import { hasAppliedToJob } from "@/lib/candidate/application-data";
import { getJobForApplication } from "@/lib/public/jobs-data";
import { notifyApplicationSubmitted } from "@/lib/email/notifications";
import {
  notifyCandidateApplicationSubmitted,
  notifyHRNewApplication,
} from "@/lib/notifications/events";
import { auditCandidateApplied, candidateActor } from "@/lib/audit/events";
import { evaluateApplicationResumeSafe } from "@/lib/ai/resume-evaluation-pipeline";

export type ApplyToJobState = { status: "error"; message: string } | undefined;

const UNIQUE_VIOLATION = "23505";

/**
 * Server Action backing the "Submit Application" form on
 * /candidate/apply/[jobId]. Re-runs every gate the page already checked
 * before rendering the form (job open, not already applied, profile ≥70%
 * complete, resume uploaded) so nothing here depends on the client having
 * gone through the page — all validation is server-side (requirement 10),
 * and `candidate_id` always comes from the authenticated session, never a
 * hidden form field.
 *
 * On success, inserts exactly one row into the existing `applications`
 * table (requirement 5), linked via `candidate_id` (added in 004, extended
 * in 008_applications_candidate_schema.sql). The proactive `hasAppliedToJob`
 * check above is a UX nicety only — the real, race-condition-proof
 * duplicate guard is the `applications_candidate_job_unique` constraint on
 * `(candidate_id, job_id)` (008), caught generically below via its
 * Postgres error code rather than its name, so this keeps working even if
 * the constraint is ever renamed.
 *
 * Note: the application's initial status is stored as the existing
 * `'new'` enum value (001_initial_schema.sql), not the literal string
 * `'Pending'` — `public.application_status` has no `'Pending'` member,
 * and widening it would touch the HR dashboard's status handling. `'new'`
 * is the same "just submitted, awaiting review" state HR already renders
 * as "New".
 */
export async function applyToJob(
  _prevState: ApplyToJobState,
  formData: FormData
): Promise<ApplyToJobState> {
  const profile = await requireCandidateUser();

  const jobId = String(formData.get("jobId") ?? "").trim();
  if (!jobId) {
    return { status: "error", message: "Missing job reference. Please go back and try again." };
  }

  const job = await getJobForApplication(jobId);
  if (!job) {
    return { status: "error", message: "This job could not be found." };
  }
  if (!job.isOpen) {
    return { status: "error", message: "This job is now closed and no longer accepting applications." };
  }

  const existingApplicationCheck = await hasAppliedToJob(profile.id, jobId);
  if (existingApplicationCheck.status === "error") {
    return { status: "error", message: existingApplicationCheck.message };
  }
  if (existingApplicationCheck.applied) {
    return { status: "error", message: "You have already applied for this job." };
  }

  const details = await getCandidateProfileDetails(profile.id);
  const completion = getProfileCompletion(profile, details);
  if (completion.percentage < MIN_PROFILE_COMPLETION_TO_APPLY) {
    redirect(
      `/candidate/profile?notice=apply_profile&next=${encodeURIComponent(sanitizeNextPath(`/candidate/apply/${jobId}`))}`
    );
  }

  const resume = await getCandidateResume(profile.id);
  if (!resume) {
    redirect(
      `/candidate/resume?notice=apply_resume&next=${encodeURIComponent(sanitizeNextPath(`/candidate/apply/${jobId}`))}`
    );
  }

  const coverLetterRaw = String(formData.get("coverLetter") ?? "").trim();
  const coverLetter = coverLetterRaw.length > 0 ? coverLetterRaw : null;

  const expectedSalaryRaw = String(formData.get("expectedSalary") ?? "").trim();
  let expectedSalary: number | null = null;
  if (expectedSalaryRaw.length > 0) {
    const parsed = Number(expectedSalaryRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { status: "error", message: "Please enter a valid expected salary." };
    }
    expectedSalary = parsed;
  }

  const noticePeriodRaw = String(formData.get("noticePeriod") ?? "").trim();
  const noticePeriod = noticePeriodRaw && isNoticePeriod(noticePeriodRaw) ? noticePeriodRaw : null;

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("applications")
    .insert({
      job_id: jobId,
      candidate_id: profile.id,
      full_name: profile.fullName,
      email: profile.email,
      phone: details?.phone ?? profile.phone,
      current_position: details?.currentJobTitle ?? null,
      current_company: details?.currentCompany ?? null,
      years_of_experience: details?.yearsOfExperience ?? null,
      expected_salary: expectedSalary,
      notice_period: noticePeriod,
      linkedin_url: details?.linkedinUrl ?? null,
      portfolio_url: details?.portfolioUrl ?? null,
      cover_letter: coverLetter,
      cv_storage_path: resume.storagePath,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    if (error?.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "You have already applied for this job." };
    }
    console.error("[application-actions] Failed to insert application:", error?.message);
    return { status: "error", message: error?.message ?? "Failed to submit application." };
  }

  await notifyApplicationSubmitted({
    candidateEmail: profile.email,
    candidateName: profile.fullName,
    jobTitle: job.title,
  });

  await notifyCandidateApplicationSubmitted({
    candidateId: profile.id,
    applicationId: inserted.id,
    jobTitle: job.title,
  });

  await notifyHRNewApplication({
    applicationId: inserted.id,
    candidateName: profile.fullName,
    jobTitle: job.title,
  });

  await auditCandidateApplied(candidateActor(profile), {
    id: inserted.id,
    candidateId: profile.id,
    candidateName: profile.fullName,
    jobId: jobId,
    jobTitle: job.title,
  });

  // AI resume evaluation + job ranking (cached; never blocks the candidate on failure)
  await evaluateApplicationResumeSafe(inserted.id);

  revalidatePath("/", "layout");
  revalidatePath("/candidate");
  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/notifications");
  revalidatePath("/hr/notifications");
  revalidatePath(`/hr/jobs/${jobId}`);
  updateTag("landing-stats");
  redirect("/candidate/applications?applied=1");
}
