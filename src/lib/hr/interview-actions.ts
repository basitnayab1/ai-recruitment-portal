"use server";

import { revalidatePath } from "next/cache";
import { requireHRUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  buildInterviewEmailPayload,
  getInterviewByApplicationId,
  getInterviewById,
  type HRInterview,
} from "@/lib/hr/interview-data";
import {
  hasInterviewScheduleChanged,
  parseInterviewFormData,
  type ParsedInterviewForm,
} from "@/lib/hr/interview-validation";
import {
  notifyInterviewCancelled,
  notifyInterviewRescheduled,
  notifyInterviewScheduled,
} from "@/lib/email/notifications";
import {
  notifyCandidateInterviewCancelled,
  notifyCandidateInterviewRescheduled,
  notifyCandidateInterviewScheduled,
  notifyHRInterviewUpdated,
} from "@/lib/notifications/events";
import {
  auditInterviewCancelled,
  auditInterviewRescheduled,
  auditInterviewScheduled,
  auditInterviewUpdated,
  hrActor,
} from "@/lib/audit/events";

type ApplicationContext = {
  id: string;
  candidate_id: string | null;
  job_id: string;
  full_name: string;
  email: string;
  jobs: { title: string } | null;
};

async function loadApplicationContext(
  applicationId: string
): Promise<{ application: ApplicationContext } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("id, candidate_id, job_id, full_name, email, jobs ( title )")
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data) {
    return { error: error?.message ?? "Application not found." };
  }

  return { application: data as unknown as ApplicationContext };
}

function interviewInsertPayload(
  application: ApplicationContext,
  parsed: ParsedInterviewForm,
  createdBy: string
) {
  return {
    application_id: application.id,
    candidate_id: application.candidate_id,
    job_id: application.job_id,
    interviewer_name: parsed.interviewerName,
    interview_type: parsed.interviewType,
    meeting_link: parsed.meetingLink,
    office_location: parsed.officeLocation,
    interview_date: parsed.interviewDate,
    interview_time: parsed.interviewTime,
    timezone: parsed.timezone,
    duration_minutes: parsed.durationMinutes,
    notes: parsed.notes,
    status: "scheduled" as const,
    created_by: createdBy,
  };
}

function interviewUpdatePayload(parsed: ParsedInterviewForm) {
  return {
    interviewer_name: parsed.interviewerName,
    interview_type: parsed.interviewType,
    meeting_link: parsed.meetingLink,
    office_location: parsed.officeLocation,
    interview_date: parsed.interviewDate,
    interview_time: parsed.interviewTime,
    timezone: parsed.timezone,
    duration_minutes: parsed.durationMinutes,
    notes: parsed.notes,
    status: "scheduled" as const,
  };
}

function parsedFromInterview(interview: HRInterview): ParsedInterviewForm {
  return {
    interviewerName: interview.interviewerName,
    interviewType: interview.interviewType,
    meetingLink: interview.meetingLink,
    officeLocation: interview.officeLocation,
    interviewDate: interview.interviewDate,
    interviewTime: interview.interviewTime,
    timezone: interview.timezone,
    durationMinutes: interview.durationMinutes,
    notes: interview.notes,
  };
}

async function sendInterviewEmail(
  interview: HRInterview,
  application: ApplicationContext,
  kind: "scheduled" | "rescheduled" | "cancelled"
): Promise<void> {
  const payload = buildInterviewEmailPayload({
    interview,
    candidateEmail: application.email,
    candidateName: application.full_name,
    jobTitle: application.jobs?.title ?? "Unknown role",
  });

  if (kind === "scheduled") {
    await notifyInterviewScheduled(payload);
    return;
  }
  if (kind === "rescheduled") {
    await notifyInterviewRescheduled(payload);
    return;
  }
  await notifyInterviewCancelled(payload);
}

async function sendInAppInterviewNotifications(
  interview: HRInterview,
  application: ApplicationContext,
  kind: "scheduled" | "rescheduled" | "cancelled" | "updated"
): Promise<void> {
  const payload = {
    candidateId: application.candidate_id,
    interviewId: interview.id,
    applicationId: application.id,
    jobTitle: application.jobs?.title ?? "Unknown role",
    interviewDate: interview.interviewDate,
    interviewTime: interview.interviewTime,
  };

  if (kind === "scheduled") {
    await notifyCandidateInterviewScheduled(payload);
    return;
  }
  if (kind === "rescheduled") {
    await notifyCandidateInterviewRescheduled(payload);
    return;
  }
  if (kind === "cancelled") {
    await notifyCandidateInterviewCancelled(payload);
    return;
  }

  await notifyHRInterviewUpdated({
    applicationId: application.id,
    interviewId: interview.id,
    jobTitle: payload.jobTitle,
    actionLabel: "updated",
  });
}

function revalidateInterviewPaths(applicationId: string) {
  revalidatePath(`/hr/applications/${applicationId}`);
  revalidatePath("/hr/applications");
  revalidatePath("/hr");
  revalidatePath("/candidate/interviews");
  revalidatePath("/hr/notifications");
  revalidatePath("/candidate/notifications");
  revalidatePath("/hr/activity-log");
}

function interviewAuditPayload(application: ApplicationContext, interview: HRInterview) {
  return {
    interviewId: interview.id,
    candidateId: application.candidate_id,
    candidateName: application.full_name,
    jobId: application.job_id,
    jobTitle: application.jobs?.title ?? "Unknown role",
    interviewDate: interview.interviewDate,
    interviewTime: interview.interviewTime,
  };
}

export type InterviewActionState =
  | { status: "error"; message: string }
  | { status: "success"; message: string }
  | undefined;

export async function scheduleInterviewAction(
  _prevState: InterviewActionState,
  formData: FormData
): Promise<InterviewActionState> {
  const hrProfile = await requireHRUser();

  const applicationId = String(formData.get("applicationId") ?? "").trim();
  if (!applicationId) {
    return { status: "error", message: "Missing application reference." };
  }

  const parsedResult = parseInterviewFormData(formData);
  if (!parsedResult.ok) {
    return { status: "error", message: parsedResult.message };
  }

  const context = await loadApplicationContext(applicationId);
  if ("error" in context) {
    return { status: "error", message: context.error };
  }

  const existing = await getInterviewByApplicationId(applicationId);
  if (existing?.status === "scheduled") {
    return {
      status: "error",
      message: "An interview is already scheduled. Use Edit or Reschedule instead.",
    };
  }

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("interviews")
    .insert(interviewInsertPayload(context.application, parsedResult.data, hrProfile.id))
    .select("*")
    .single();

  if (error || !inserted) {
    console.error("[interview-actions] Failed to schedule interview:", error?.message);
    return { status: "error", message: error?.message ?? "Failed to schedule interview." };
  }

  await supabase
    .from("applications")
    .update({ status: "interview" })
    .eq("id", applicationId);

  const interview = await getInterviewById(inserted.id);
  if (interview) {
    await sendInterviewEmail(interview, context.application, "scheduled");
    await sendInAppInterviewNotifications(interview, context.application, "scheduled");
    await auditInterviewScheduled(
      hrActor(hrProfile),
      interviewAuditPayload(context.application, interview)
    );
  }

  revalidateInterviewPaths(applicationId);
  return { status: "success", message: "Interview scheduled successfully." };
}

export async function updateInterviewAction(
  _prevState: InterviewActionState,
  formData: FormData
): Promise<InterviewActionState> {
  const hrProfile = await requireHRUser();

  const interviewId = String(formData.get("interviewId") ?? "").trim();
  const applicationId = String(formData.get("applicationId") ?? "").trim();

  if (!interviewId || !applicationId) {
    return { status: "error", message: "Missing interview reference." };
  }

  const parsedResult = parseInterviewFormData(formData);
  if (!parsedResult.ok) {
    return { status: "error", message: parsedResult.message };
  }

  const existing = await getInterviewById(interviewId);
  if (!existing || existing.applicationId !== applicationId) {
    return { status: "error", message: "Interview not found." };
  }
  if (existing.status !== "scheduled") {
    return { status: "error", message: "Only scheduled interviews can be edited." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("interviews")
    .update(interviewUpdatePayload(parsedResult.data))
    .eq("id", interviewId);

  if (error) {
    console.error("[interview-actions] Failed to update interview:", error.message);
    return { status: "error", message: error.message };
  }

  const context = await loadApplicationContext(applicationId);
  const updated = await getInterviewById(interviewId);
  if (updated && !("error" in context)) {
    await sendInAppInterviewNotifications(updated, context.application, "updated");
    await auditInterviewUpdated(
      hrActor(hrProfile),
      interviewAuditPayload(context.application, updated)
    );
  }

  revalidateInterviewPaths(applicationId);
  return { status: "success", message: "Interview updated successfully." };
}

export async function rescheduleInterviewAction(
  _prevState: InterviewActionState,
  formData: FormData
): Promise<InterviewActionState> {
  const hrProfile = await requireHRUser();

  const interviewId = String(formData.get("interviewId") ?? "").trim();
  const applicationId = String(formData.get("applicationId") ?? "").trim();

  if (!interviewId || !applicationId) {
    return { status: "error", message: "Missing interview reference." };
  }

  const parsedResult = parseInterviewFormData(formData);
  if (!parsedResult.ok) {
    return { status: "error", message: parsedResult.message };
  }

  const existing = await getInterviewById(interviewId);
  if (!existing || existing.applicationId !== applicationId) {
    return { status: "error", message: "Interview not found." };
  }
  if (existing.status !== "scheduled") {
    return { status: "error", message: "Only scheduled interviews can be rescheduled." };
  }

  const context = await loadApplicationContext(applicationId);
  if ("error" in context) {
    return { status: "error", message: context.error };
  }

  const scheduleChanged = hasInterviewScheduleChanged(parsedFromInterview(existing), parsedResult.data);

  const supabase = await createClient();
  const { error } = await supabase
    .from("interviews")
    .update(interviewUpdatePayload(parsedResult.data))
    .eq("id", interviewId);

  if (error) {
    console.error("[interview-actions] Failed to reschedule interview:", error.message);
    return { status: "error", message: error.message };
  }

  const updated = await getInterviewById(interviewId);
  if (updated && scheduleChanged) {
    await sendInterviewEmail(updated, context.application, "rescheduled");
    await sendInAppInterviewNotifications(updated, context.application, "rescheduled");
    await auditInterviewRescheduled(
      hrActor(hrProfile),
      interviewAuditPayload(context.application, updated)
    );
  } else if (updated) {
    await sendInAppInterviewNotifications(updated, context.application, "updated");
    await auditInterviewUpdated(
      hrActor(hrProfile),
      interviewAuditPayload(context.application, updated)
    );
  }

  revalidateInterviewPaths(applicationId);
  return {
    status: "success",
    message: scheduleChanged
      ? "Interview rescheduled and candidate notified."
      : "Interview details saved.",
  };
}

export async function cancelInterviewAction(
  _prevState: InterviewActionState,
  formData: FormData
): Promise<InterviewActionState> {
  const hrProfile = await requireHRUser();

  const interviewId = String(formData.get("interviewId") ?? "").trim();
  const applicationId = String(formData.get("applicationId") ?? "").trim();

  if (!interviewId || !applicationId) {
    return { status: "error", message: "Missing interview reference." };
  }

  const existing = await getInterviewById(interviewId);
  if (!existing || existing.applicationId !== applicationId) {
    return { status: "error", message: "Interview not found." };
  }
  if (existing.status !== "scheduled") {
    return { status: "error", message: "This interview is not active." };
  }

  const context = await loadApplicationContext(applicationId);
  if ("error" in context) {
    return { status: "error", message: context.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("interviews")
    .update({ status: "cancelled" })
    .eq("id", interviewId);

  if (error) {
    console.error("[interview-actions] Failed to cancel interview:", error.message);
    return { status: "error", message: error.message };
  }

  const cancelled = await getInterviewById(interviewId);
  if (cancelled) {
    await sendInterviewEmail(cancelled, context.application, "cancelled");
    await sendInAppInterviewNotifications(cancelled, context.application, "cancelled");
    await auditInterviewCancelled(hrActor(hrProfile), {
      interviewId: cancelled.id,
      candidateId: context.application.candidate_id,
      candidateName: context.application.full_name,
      jobId: context.application.job_id,
      jobTitle: context.application.jobs?.title ?? "Unknown role",
    });
  }

  revalidateInterviewPaths(applicationId);
  return { status: "success", message: "Interview cancelled and candidate notified." };
}

/**
 * Used when status is changed to interview via the status form.
 * Always re-authenticates via requireHRUser() — never trusts a client-supplied actor.
 */
export async function createInterviewForApplication({
  applicationId,
  parsed,
}: {
  applicationId: string;
  parsed: ParsedInterviewForm;
}): Promise<{ ok: true; interviewId: string } | { ok: false; message: string }> {
  const actor = await requireHRUser();

  const context = await loadApplicationContext(applicationId);
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const existing = await getInterviewByApplicationId(applicationId);
  const supabase = await createClient();

  if (existing?.status === "scheduled") {
    const { error } = await supabase
      .from("interviews")
      .update(interviewUpdatePayload(parsed))
      .eq("id", existing.id);

    if (error) {
      return { ok: false, message: error.message };
    }

    const scheduleChanged = hasInterviewScheduleChanged(parsedFromInterview(existing), parsed);
    const updated = await getInterviewById(existing.id);
    if (updated) {
      if (scheduleChanged) {
        await sendInterviewEmail(updated, context.application, "rescheduled");
        await sendInAppInterviewNotifications(updated, context.application, "rescheduled");
        await auditInterviewRescheduled(
          hrActor(actor),
          interviewAuditPayload(context.application, updated)
        );
      } else {
        await sendInterviewEmail(updated, context.application, "scheduled");
        await sendInAppInterviewNotifications(updated, context.application, "updated");
        await auditInterviewUpdated(
          hrActor(actor),
          interviewAuditPayload(context.application, updated)
        );
      }
    }

    return { ok: true, interviewId: existing.id };
  }

  const { data: inserted, error } = await supabase
    .from("interviews")
    .insert(interviewInsertPayload(context.application, parsed, actor.id))
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, message: error?.message ?? "Failed to save interview." };
  }

  const interview = await getInterviewById(inserted.id);
  if (interview) {
    await sendInterviewEmail(interview, context.application, "scheduled");
    await sendInAppInterviewNotifications(interview, context.application, "scheduled");
    await auditInterviewScheduled(
      hrActor(actor),
      interviewAuditPayload(context.application, interview)
    );
  }

  return { ok: true, interviewId: inserted.id };
}
