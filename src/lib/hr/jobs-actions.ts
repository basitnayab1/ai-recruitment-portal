"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireHRUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  getPublishBlockingErrors,
  parseJobForm,
  type JobFormFieldErrors,
  type JobFormValues,
} from "@/lib/hr/jobs-validation";
import { auditJobCreated, auditJobUpdated, hrActor } from "@/lib/audit/events";

export type JobFormState =
  | { status: "error"; message: string; fieldErrors?: JobFormFieldErrors }
  | undefined;

function toJobRow(values: JobFormValues) {
  return {
    title: values.title,
    department: values.department,
    location: values.location,
    employment_type: values.employmentType,
    work_mode: values.workMode,
    is_remote: values.isRemote,
    summary: values.summary,
    description: values.description,
    requirements: values.requirements,
    responsibilities: values.responsibilities,
    benefits: values.benefits,
    required_skills: values.requiredSkills,
    preferred_skills: values.preferredSkills,
    matching_keywords: values.matchingKeywords,
    experience_required: values.experienceRequired,
    education_required: values.educationRequired,
    seniority_level: values.seniorityLevel,
    salary_min: values.salaryMin,
    salary_max: values.salaryMax,
    open_positions: values.openPositions,
    closes_at: values.closesAt,
    hiring_manager: values.hiringManager,
    internal_notes: values.internalNotes,
  };
}

/**
 * Creates a new job posting. Only reachable by an authenticated, active
 * HR/admin user — `requireHRUser()` re-verifies this from the `profiles`
 * table on every call (never trusts a client-supplied role), and the
 * insert itself is additionally gated by the `jobs` RLS policy.
 */
export async function createJobAction(
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const profile = await requireHRUser();

  const statusRaw = String(formData.get("status") ?? "draft");
  const status = statusRaw === "published" ? "published" : "draft";

  const parsed = parseJobForm(formData, {
    requirePublishFields: status === "published",
  });
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      ...toJobRow(parsed.values),
      status,
      published_at: status === "published" ? nowIso : null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: error?.message ?? "Failed to create job. Please try again.",
    };
  }

  await auditJobCreated(hrActor(profile), { id: data.id, title: parsed.values.title });

  updateTag("landing-stats");
  revalidatePath("/");
  revalidatePath("/hr/jobs");
  revalidatePath("/hr");
  redirect(`/hr/jobs/${data.id}?created=1`);
}

/**
 * Updates an existing job's content fields. Status transitions (publish /
 * close) are handled by the dedicated actions below, not here, so this
 * action never needs to touch `published_at`.
 */
export async function updateJobAction(
  jobId: string,
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const profile = await requireHRUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .maybeSingle();

  const isPublished = (existing as { status?: string } | null)?.status === "published";

  const parsed = parseJobForm(formData, {
    requirePublishFields: isPublished,
  });
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const { error } = await supabase
    .from("jobs")
    .update(toJobRow(parsed.values))
    .eq("id", jobId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await auditJobUpdated(hrActor(profile), { id: jobId, title: parsed.values.title });

  updateTag("landing-stats");
  revalidatePath("/");
  revalidatePath("/hr/jobs");
  revalidatePath(`/hr/jobs/${jobId}`);
  redirect(`/hr/jobs/${jobId}?updated=1`);
}

export type JobStatusActionState =
  | { error: string; fieldErrors?: JobFormFieldErrors }
  | undefined;

async function setJobStatus(
  formData: FormData,
  nextStatus: "published" | "closed"
): Promise<JobStatusActionState> {
  const profile = await requireHRUser();

  const jobId = String(formData.get("jobId") ?? "").trim();
  if (!jobId) {
    return { error: "Missing job id." };
  }

  const supabase = await createClient();

  const { data: jobRow, error: jobFetchError } = await supabase
    .from("jobs")
    .select(
      "id, title, description, responsibilities, required_skills, published_at"
    )
    .eq("id", jobId)
    .maybeSingle();

  if (jobFetchError || !jobRow) {
    return { error: "Job not found." };
  }

  if (nextStatus === "published") {
    const blocking = getPublishBlockingErrors(
      jobRow as {
        title: string;
        description: string;
        responsibilities: string | null;
        required_skills: string[] | null;
      }
    );
    if (Object.keys(blocking).length > 0) {
      return {
        error:
          "Cannot publish until title, description, responsibilities, and required skills are filled in.",
        fieldErrors: blocking,
      };
    }

    const existing = jobRow as { published_at: string | null };
    const { error } = await supabase
      .from("jobs")
      .update({
        status: "published",
        published_at: existing.published_at ?? new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      return { error: `Could not publish this job: ${error.message}` };
    }

    await auditJobUpdated(
      hrActor(profile),
      {
        id: jobId,
        title: (jobRow as { title: string }).title,
      },
      "Job published"
    );
  } else {
    const { error } = await supabase.from("jobs").update({ status: "closed" }).eq("id", jobId);

    if (error) {
      return { error: `Could not close this job: ${error.message}` };
    }

    await auditJobUpdated(
      hrActor(profile),
      {
        id: jobId,
        title: (jobRow as { title: string }).title,
      },
      "Job closed"
    );
  }

  updateTag("landing-stats");
  revalidatePath("/");
  revalidatePath("/hr/jobs");
  revalidatePath(`/hr/jobs/${jobId}`);
  revalidatePath("/hr");
  revalidatePath("/hr/activity-log");
  return undefined;
}

export async function publishJobAction(
  _prevState: JobStatusActionState,
  formData: FormData
): Promise<JobStatusActionState> {
  return setJobStatus(formData, "published");
}

export async function closeJobAction(
  _prevState: JobStatusActionState,
  formData: FormData
): Promise<JobStatusActionState> {
  return setJobStatus(formData, "closed");
}
