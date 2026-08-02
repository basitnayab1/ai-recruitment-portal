"use server";

import { generateJobDescription } from "@/lib/ai/job-description-generator";
import {
  JobDescriptionGeneratorError,
  mapGeneratedJobToFormFields,
  type GeneratedJobDescription,
} from "@/lib/ai/types";
import { requireHRUser } from "@/lib/auth/dal";
import { isEmploymentType } from "@/lib/hr/jobs";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

export type GenerateJobDescriptionState =
  | {
      status: "success";
      generated: GeneratedJobDescription;
      formFields: ReturnType<typeof mapGeneratedJobToFormFields>;
    }
  | { status: "error"; message: string }
  | undefined;

function parseSkillsList(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function defaultCompanyName(): string {
  return process.env.APP_NAME?.trim() || "AI Recruitment Portal";
}

/**
 * Server Action: generate a job description from HR-provided inputs.
 */
export async function generateJobDescriptionAction(
  _prevState: GenerateJobDescriptionState,
  formData: FormData
): Promise<GenerateJobDescriptionState> {
  try {
    const hr = await requireHRUser();

    const limit = checkRateLimit({
      key: rateLimitKey("hr-job-description", hr.id),
      limit: 40,
      windowMs: 60 * 60 * 1000,
      message: "Job description generation rate limit reached. Please try again later.",
    });
    if (!limit.ok) {
      return { status: "error", message: limit.message };
    }

    const jobTitle = String(formData.get("jobTitle") ?? "").trim();
    const department = String(formData.get("department") ?? "").trim();
    const employmentTypeRaw = String(formData.get("employmentType") ?? "full_time").trim();
    const experience = String(formData.get("experience") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const salary = String(formData.get("salary") ?? "").trim();
    const requiredSkillsRaw = String(formData.get("requiredSkills") ?? "");
    const preferredSkillsRaw = String(formData.get("preferredSkills") ?? "");
    const companyName = String(formData.get("companyName") ?? "").trim() || defaultCompanyName();

    if (!jobTitle) {
      return { status: "error", message: "Job title is required." };
    }

    const employmentType = isEmploymentType(employmentTypeRaw) ? employmentTypeRaw : "full_time";

    const generated = await generateJobDescription({
      jobTitle,
      department,
      employmentType,
      experience,
      location,
      salary: salary || null,
      requiredSkills: parseSkillsList(requiredSkillsRaw),
      preferredSkills: parseSkillsList(preferredSkillsRaw),
      companyName,
    });

    return {
      status: "success",
      generated,
      formFields: mapGeneratedJobToFormFields(generated),
    };
  } catch (error) {
    if (error instanceof JobDescriptionGeneratorError) {
      return { status: "error", message: error.message };
    }

    console.error("[hr/job-description-actions] Unexpected error:", error);
    return { status: "error", message: "Job description generation failed. Please try again." };
  }
}
