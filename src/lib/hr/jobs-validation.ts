import "server-only";

import { isEmploymentType, type EmploymentType } from "@/lib/hr/jobs";

export type JobFormValues = {
  title: string;
  department: string | null;
  location: string | null;
  employmentType: EmploymentType;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  isRemote: boolean;
  closesAt: string | null; // ISO timestamp
};

export type JobFormFieldName =
  | "title"
  | "employmentType"
  | "description"
  | "salaryMin"
  | "salaryMax"
  | "closesAt";

export type JobFormFieldErrors = Partial<Record<JobFormFieldName, string>>;

export type ParseJobFormResult =
  | { ok: true; values: JobFormValues }
  | { ok: false; fieldErrors: JobFormFieldErrors };

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

/**
 * Validates and normalizes the shared job fields used by both the create and
 * edit forms. Mirrors the database's own check constraints (non-empty title
 * / description, non-negative salaries, max >= min) so invalid submissions
 * are caught with a friendly message before ever reaching Postgres.
 */
export function parseJobForm(formData: FormData): ParseJobFormResult {
  const fieldErrors: JobFormFieldErrors = {};

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    fieldErrors.title = "Title is required.";
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) {
    fieldErrors.description = "Description is required.";
  }

  const employmentTypeRaw = String(formData.get("employmentType") ?? "");
  const employmentType: EmploymentType | null = isEmploymentType(employmentTypeRaw)
    ? employmentTypeRaw
    : null;
  if (!employmentType) {
    fieldErrors.employmentType = "Select a valid employment type.";
  }

  const department = optionalText(formData.get("department"));
  const location = optionalText(formData.get("location"));
  const requirements = optionalText(formData.get("requirements"));
  const responsibilities = optionalText(formData.get("responsibilities"));
  const isRemote = formData.get("isRemote") === "on";

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
      description,
      requirements,
      responsibilities,
      salaryMin,
      salaryMax,
      isRemote,
      closesAt,
    },
  };
}
