import "server-only";

import {
  isEmploymentType,
  isSeniorityLevel,
  isWorkMode,
  type EmploymentType,
  type SeniorityLevel,
  type WorkMode,
} from "@/lib/hr/jobs";
import { parseSkillsList } from "@/lib/hr/skill-match";

export type JobFormValues = {
  title: string;
  department: string | null;
  location: string | null;
  employmentType: EmploymentType;
  workMode: WorkMode | null;
  isRemote: boolean;
  summary: string | null;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  benefits: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  matchingKeywords: string[];
  experienceRequired: string | null;
  educationRequired: string | null;
  seniorityLevel: SeniorityLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  openPositions: number;
  closesAt: string | null;
  hiringManager: string | null;
  internalNotes: string | null;
};

export type JobFormFieldName =
  | "title"
  | "employmentType"
  | "description"
  | "responsibilities"
  | "requiredSkills"
  | "salaryMin"
  | "salaryMax"
  | "closesAt"
  | "openPositions";

export type JobFormFieldErrors = Partial<Record<JobFormFieldName, string>>;

export type ParseJobFormResult =
  | { ok: true; values: JobFormValues }
  | { ok: false; fieldErrors: JobFormFieldErrors };

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

/**
 * Validates shared job fields for create/edit.
 * When `requirePublishFields` is true (publishing), enforces title,
 * description, responsibilities, and required skills.
 */
export function parseJobForm(
  formData: FormData,
  options: { requirePublishFields?: boolean } = {}
): ParseJobFormResult {
  const fieldErrors: JobFormFieldErrors = {};
  const requirePublish = options.requirePublishFields === true;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    fieldErrors.title = "Title is required.";
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) {
    fieldErrors.description = "Description is required.";
  }

  const responsibilities = optionalText(formData.get("responsibilities"));
  const requiredSkills = parseSkillsList(String(formData.get("requiredSkills") ?? ""));

  if (requirePublish) {
    if (!responsibilities) {
      fieldErrors.responsibilities = "Responsibilities are required to publish.";
    }
    if (requiredSkills.length === 0) {
      fieldErrors.requiredSkills = "Add at least one required skill to publish.";
    }
  }

  const employmentTypeRaw = String(formData.get("employmentType") ?? "");
  const employmentType: EmploymentType | null = isEmploymentType(employmentTypeRaw)
    ? employmentTypeRaw
    : null;
  if (!employmentType) {
    fieldErrors.employmentType = "Select a valid employment type.";
  }

  const workModeRaw = String(formData.get("workMode") ?? "").trim();
  const workMode: WorkMode | null = isWorkMode(workModeRaw) ? workModeRaw : null;
  const isRemoteCheckbox = formData.get("isRemote") === "on";
  const isRemote = workMode === "remote" || (!workMode && isRemoteCheckbox);

  const seniorityRaw = String(formData.get("seniorityLevel") ?? "").trim();
  const seniorityLevel: SeniorityLevel | null = isSeniorityLevel(seniorityRaw)
    ? seniorityRaw
    : null;

  const department = optionalText(formData.get("department"));
  const location = optionalText(formData.get("location"));
  const summary = optionalText(formData.get("summary"));
  const requirements = optionalText(formData.get("requirements"));
  const benefits = optionalText(formData.get("benefits"));
  const experienceRequired = optionalText(formData.get("experienceRequired"));
  const educationRequired = optionalText(formData.get("educationRequired"));
  const hiringManager = optionalText(formData.get("hiringManager"));
  const internalNotes = optionalText(formData.get("internalNotes"));
  const preferredSkills = parseSkillsList(String(formData.get("preferredSkills") ?? ""));
  const matchingKeywords = parseSkillsList(String(formData.get("matchingKeywords") ?? ""));

  const salaryMinRaw = String(formData.get("salaryMin") ?? "").trim();
  const salaryMaxRaw = String(formData.get("salaryMax") ?? "").trim();
  const salaryMin = salaryMinRaw ? Number(salaryMinRaw) : null;
  const salaryMax = salaryMaxRaw ? Number(salaryMaxRaw) : null;

  if (salaryMinRaw && (Number.isNaN(salaryMin) || (salaryMin as number) < 0)) {
    fieldErrors.salaryMin = "Enter a valid non-negative number.";
  }
  if (salaryMaxRaw && (Number.isNaN(salaryMax) || (salaryMax as number) < 0)) {
    fieldErrors.salaryMax = "Enter a valid non-negative number.";
  }
  if (
    !fieldErrors.salaryMin &&
    !fieldErrors.salaryMax &&
    salaryMin !== null &&
    salaryMax !== null &&
    salaryMax < salaryMin
  ) {
    fieldErrors.salaryMax = "Maximum salary must be greater than or equal to minimum.";
  }

  const openPositionsRaw = String(formData.get("openPositions") ?? "1").trim();
  const openPositions = Number.parseInt(openPositionsRaw || "1", 10);
  if (!Number.isFinite(openPositions) || openPositions < 1) {
    fieldErrors.openPositions = "Enter at least 1 open position.";
  }

  const closesAtRaw = String(formData.get("closesAt") ?? "").trim();
  let closesAt: string | null = null;
  if (closesAtRaw) {
    const parsedDate = new Date(closesAtRaw);
    if (Number.isNaN(parsedDate.getTime())) {
      fieldErrors.closesAt = "Enter a valid date.";
    } else {
      closesAt = parsedDate.toISOString();
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !employmentType) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    values: {
      title,
      department,
      location,
      employmentType,
      workMode: workMode ?? (isRemote ? "remote" : null),
      isRemote,
      summary,
      description,
      responsibilities,
      requirements,
      benefits,
      requiredSkills,
      preferredSkills,
      matchingKeywords,
      experienceRequired,
      educationRequired,
      seniorityLevel,
      salaryMin,
      salaryMax,
      openPositions: Number.isFinite(openPositions) ? openPositions : 1,
      closesAt,
      hiringManager,
      internalNotes,
    },
  };
}

/** Check whether a stored job row is complete enough to publish. */
export function getPublishBlockingErrors(job: {
  title?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  required_skills?: string[] | null;
}): JobFormFieldErrors {
  const fieldErrors: JobFormFieldErrors = {};
  if (!job.title?.trim()) fieldErrors.title = "Title is required.";
  if (!job.description?.trim()) fieldErrors.description = "Description is required.";
  if (!job.responsibilities?.trim()) {
    fieldErrors.responsibilities = "Responsibilities are required to publish.";
  }
  if (!job.required_skills?.length) {
    fieldErrors.requiredSkills = "Add at least one required skill to publish.";
  }
  return fieldErrors;
}
