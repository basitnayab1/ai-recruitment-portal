"use server";

import { revalidatePath } from "next/cache";
import { requireHRUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isApplicationStatus, isStatusChangeOption } from "@/lib/hr/status";
import { notifyApplicationStatusChanged } from "@/lib/email/notifications";
import { parseInterviewFormData } from "@/lib/hr/interview-validation";
import { createInterviewForApplication } from "@/lib/hr/interview-actions";
import { notifyCandidateApplicationStatusChanged } from "@/lib/notifications/events";
import {
  auditApplicationStatusChanged,
  auditHRNoteAdded,
  hrActor,
} from "@/lib/audit/events";

export type UpdateApplicationStatusState =
  | { status: "error"; message: string }
  | { status: "success" }
  | undefined;

/**
 * Changes an application's status. Only reachable by an authenticated,
 * active HR/admin user — `requireHRUser()` re-verifies this from the
 * `profiles` table on every call, and the update itself is additionally
 * gated by the "HR and admin can manage applications" RLS policy (001),
 * which is unchanged. A candidate session could never reach this action
 * (it's only rendered on an `/hr` page behind `requireHRUser()`), and even
 * if it somehow ran with a candidate's session, RLS would reject the
 * update outright.
 *
 * The actual audit trail write into `application_status_history` is not
 * done here — it happens automatically via the `trg_log_application_status_change`
 * trigger (001, fixed in 012_fix_application_status_history_trigger.sql to
 * only fire for HR/admin actors), so every status change made through
 * this action is recorded without any extra code here.
 */
export async function updateApplicationStatusAction(
  _prevState: UpdateApplicationStatusState,
  formData: FormData
): Promise<UpdateApplicationStatusState> {
  const hrProfile = await requireHRUser();

  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const nextStatus = String(formData.get("status") ?? "").trim();

  if (!applicationId) {
    return { status: "error", message: "Missing application reference." };
  }
  if (!isStatusChangeOption(nextStatus)) {
    return { status: "error", message: "Please choose a valid status." };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("applications")
    .select("id, candidate_id, job_id, full_name, email, status, jobs ( id, title )")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { status: "error", message: fetchError?.message ?? "Application not found." };
  }

  const existingRow = existing as unknown as {
    id: string;
    candidate_id: string | null;
    job_id: string;
    full_name: string;
    email: string;
    status: string;
    jobs: { id: string; title: string } | null;
  };
  const previousStatus = isApplicationStatus(existingRow.status) ? existingRow.status : "new";

  if (previousStatus === nextStatus) {
    return { status: "success" };
  }

  if (nextStatus === "interview") {
    const parsedResult = parseInterviewFormData(formData);
    if (!parsedResult.ok) {
      return { status: "error", message: parsedResult.message };
    }

    const interviewResult = await createInterviewForApplication({
      applicationId,
      actor: hrProfile,
      parsed: parsedResult.data,
    });

    if (!interviewResult.ok) {
      return { status: "error", message: interviewResult.message };
    }
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: nextStatus })
    .eq("id", applicationId);

  if (error) {
    console.error("[hr/application-actions] Failed to update application status:", error.message);
    return { status: "error", message: error.message };
  }

  if (nextStatus !== "interview") {
    await notifyApplicationStatusChanged({
      candidateEmail: existingRow.email,
      candidateName: existingRow.full_name,
      jobTitle: existingRow.jobs?.title ?? "Unknown role",
      newStatus: nextStatus,
    });

    await notifyCandidateApplicationStatusChanged({
      candidateId: existingRow.candidate_id ?? "",
      applicationId: existingRow.id,
      jobTitle: existingRow.jobs?.title ?? "Unknown role",
      status: nextStatus,
    });
  }

  await auditApplicationStatusChanged(hrActor(hrProfile), {
    id: existingRow.id,
    candidateId: existingRow.candidate_id,
    candidateName: existingRow.full_name,
    jobId: existingRow.job_id,
    jobTitle: existingRow.jobs?.title ?? "Unknown role",
    previousStatus,
    newStatus: nextStatus,
  });

  revalidatePath(`/hr/applications/${applicationId}`);
  revalidatePath("/hr/applications");
  revalidatePath("/hr");
  revalidatePath("/candidate/interviews");
  revalidatePath("/hr/notifications");
  revalidatePath("/candidate/notifications");
  revalidatePath("/hr/activity-log");
  return { status: "success" };
}

export type AddApplicationNoteState =
  | { status: "error"; message: string }
  | { status: "success" }
  | undefined;

/**
 * Saves an internal HR note on an application. `author_id` always comes
 * from the authenticated HR session (`requireHRUser()`), never a client
 * field. RLS ("HR and admin can manage application notes", 001) means
 * only HR/admin can ever write or read these — there is no candidate
 * policy on `application_notes` at all, so a candidate can never see them
 * regardless of what any other code does.
 */
export async function addApplicationNoteAction(
  _prevState: AddApplicationNoteState,
  formData: FormData
): Promise<AddApplicationNoteState> {
  const hrProfile = await requireHRUser();

  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!applicationId) {
    return { status: "error", message: "Missing application reference." };
  }
  if (!note) {
    return { status: "error", message: "Please enter a note before saving." };
  }

  const supabase = await createClient();

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, candidate_id, job_id, full_name, jobs ( title )")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError || !application) {
    return { status: "error", message: "Application not found." };
  }

  const applicationRow = application as unknown as {
    id: string;
    candidate_id: string | null;
    job_id: string;
    full_name: string;
    jobs: { title: string } | null;
  };

  const { error } = await supabase.from("application_notes").insert({
    application_id: applicationId,
    author_id: hrProfile.id,
    note,
  });

  if (error) {
    console.error("[hr/application-actions] Failed to add application note:", error.message);
    return { status: "error", message: error.message };
  }

  await auditHRNoteAdded(hrActor(hrProfile), {
    applicationId,
    candidateId: applicationRow.candidate_id,
    candidateName: applicationRow.full_name,
    jobId: applicationRow.job_id,
    jobTitle: applicationRow.jobs?.title ?? "Unknown role",
    notePreview: note,
  });

  revalidatePath(`/hr/applications/${applicationId}`);
  revalidatePath("/hr/activity-log");
  return { status: "success" };
}
