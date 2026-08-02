"use client";

import dynamic from "next/dynamic";
import { useActionState, useMemo, useState } from "react";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  SENIORITY_LEVELS,
  SENIORITY_LEVEL_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
  isEmploymentType,
  isSeniorityLevel,
  isWorkMode,
  type EmploymentType,
  type SeniorityLevel,
  type WorkMode,
} from "@/lib/hr/jobs";
import type { JobFormState } from "@/lib/hr/jobs-actions";
import type { AIJobDescriptionApplyPayload } from "@/components/hr/jobs/ai-job-description-modal";
import { SkillsInput } from "@/components/shared/skills-input";
import { BTN_OUTLINE, BTN_PRIMARY, FIELD_INPUT, SURFACE_CARD } from "@/lib/ui/classes";

const AIJobDescriptionModal = dynamic(
  () =>
    import("@/components/hr/jobs/ai-job-description-modal").then(
      (mod) => mod.AIJobDescriptionModal
    ),
  { ssr: false }
);

export type JobFormDefaultValues = {
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode | "";
  seniorityLevel: SeniorityLevel | "";
  experienceRequired: string;
  educationRequired: string;
  summary: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchingKeywords: string[];
  salaryMin: string;
  salaryMax: string;
  openPositions: string;
  isRemote: boolean;
  closesAt: string;
  hiringManager: string;
  internalNotes: string;
  status: "draft" | "published";
};

const EMPTY_DEFAULTS: JobFormDefaultValues = {
  title: "",
  department: "",
  location: "",
  employmentType: "full_time",
  workMode: "",
  seniorityLevel: "",
  experienceRequired: "",
  educationRequired: "",
  summary: "",
  description: "",
  requirements: "",
  responsibilities: "",
  benefits: "",
  requiredSkills: [],
  preferredSkills: [],
  matchingKeywords: [],
  salaryMin: "",
  salaryMax: "",
  openPositions: "1",
  isRemote: false,
  closesAt: "",
  hiringManager: "",
  internalNotes: "",
  status: "draft",
};

const inputClassName = FIELD_INPUT;
const labelClassName = "block text-sm font-medium text-zinc-400";
const fieldErrorClassName = "mt-1 text-sm text-red-300";

const initialState: JobFormState = undefined;

function coerceEmploymentType(raw: string, fallback: EmploymentType): EmploymentType {
  const normalized = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (isEmploymentType(normalized)) return normalized;
  if (normalized.includes("part")) return "part_time";
  if (normalized.includes("contract")) return "contract";
  if (normalized.includes("intern")) return "internship";
  if (normalized.includes("temp")) return "temporary";
  if (normalized.includes("full")) return "full_time";
  return fallback;
}

function coerceWorkMode(raw: string): WorkMode | "" {
  const normalized = raw.trim().toLowerCase();
  if (isWorkMode(normalized)) return normalized;
  if (normalized.includes("hybrid")) return "hybrid";
  if (normalized.includes("remote") || normalized.includes("wfh")) return "remote";
  if (normalized.includes("onsite") || normalized.includes("on-site") || normalized.includes("office")) {
    return "onsite";
  }
  return "";
}

function coerceSeniority(raw: string): SeniorityLevel | "" {
  const normalized = raw.trim().toLowerCase();
  if (isSeniorityLevel(normalized)) return normalized;
  if (normalized.includes("intern")) return "intern";
  if (normalized.includes("junior") || normalized.includes("entry")) return "junior";
  if (normalized.includes("mid")) return "mid";
  if (normalized.includes("senior") || normalized.includes("sr")) return "senior";
  if (normalized.includes("lead") || normalized.includes("principal")) return "lead";
  if (normalized.includes("manager")) return "manager";
  if (normalized.includes("director") || normalized.includes("head")) return "director";
  return "";
}

export function JobForm({
  mode,
  action,
  submitLabel,
  defaultValues,
}: {
  mode: "create" | "edit";
  action: (state: JobFormState, formData: FormData) => Promise<JobFormState>;
  submitLabel: string;
  defaultValues?: Partial<JobFormDefaultValues>;
}) {
  const mergedDefaults = useMemo(
    () => ({ ...EMPTY_DEFAULTS, ...defaultValues }),
    [defaultValues]
  );

  const [values, setValues] = useState<JobFormDefaultValues>(mergedDefaults);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldErrors = state?.status === "error" ? state.fieldErrors : undefined;

  const hasExistingContent = Boolean(
    values.description.trim() ||
      values.requirements.trim() ||
      values.responsibilities.trim() ||
      values.requiredSkills.length > 0
  );

  const aiSeed = useMemo(
    () => ({
      title: values.title,
      department: values.department,
      location: values.location,
      employmentType: values.employmentType,
      salaryMin: values.salaryMin,
      salaryMax: values.salaryMax,
      requiredSkills: values.requiredSkills,
      preferredSkills: values.preferredSkills,
    }),
    [
      values.title,
      values.department,
      values.location,
      values.employmentType,
      values.salaryMin,
      values.salaryMax,
      values.requiredSkills,
      values.preferredSkills,
    ]
  );

  function updateField<K extends keyof JobFormDefaultValues>(
    key: K,
    value: JobFormDefaultValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleAiAccept(payload: AIJobDescriptionApplyPayload) {
    setValues((prev) => {
      const workMode = coerceWorkMode(payload.workMode) || prev.workMode;
      return {
        ...prev,
        title: payload.title || prev.title,
        summary: payload.summary || prev.summary,
        description: payload.description || prev.description,
        responsibilities: payload.responsibilities || prev.responsibilities,
        requirements: payload.requirements || prev.requirements,
        benefits: payload.benefits || prev.benefits,
        requiredSkills: payload.requiredSkills.length
          ? payload.requiredSkills
          : prev.requiredSkills,
        preferredSkills: payload.preferredSkills.length
          ? payload.preferredSkills
          : prev.preferredSkills,
        matchingKeywords: payload.matchingKeywords.length
          ? payload.matchingKeywords
          : prev.matchingKeywords,
        experienceRequired: payload.experienceRequired || prev.experienceRequired,
        educationRequired: payload.educationRequired || prev.educationRequired,
        employmentType: coerceEmploymentType(payload.employmentType, prev.employmentType),
        seniorityLevel: coerceSeniority(payload.seniorityLevel) || prev.seniorityLevel,
        department: payload.department || prev.department,
        location: payload.location || prev.location,
        workMode,
        isRemote: workMode === "remote" || prev.isRemote,
        salaryMin: payload.salaryMin || prev.salaryMin,
        salaryMax: payload.salaryMax || prev.salaryMax,
      };
    });
  }

  return (
    <>
      <form action={formAction} noValidate className={`space-y-8 p-8 ${SURFACE_CARD}`}>
        <div className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Job posting
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Enter a title (and optional department), then generate a complete posting with AI.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            disabled={pending}
            className={`${BTN_OUTLINE} w-full sm:w-auto`}
          >
            ✨ Generate with AI
          </button>
        </div>

        {state?.status === "error" ? (
          <p
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {state.message}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="title" className={labelClassName}>
              Job title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              disabled={pending}
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className={inputClassName}
            />
            {fieldErrors?.title ? <p className={fieldErrorClassName}>{fieldErrors.title}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="department" className={labelClassName}>
              Department
            </label>
            <input
              id="department"
              name="department"
              type="text"
              disabled={pending}
              value={values.department}
              onChange={(event) => updateField("department", event.target.value)}
              placeholder="e.g. Engineering"
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className={labelClassName}>
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              disabled={pending}
              value={values.location}
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="e.g. San Francisco, CA"
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="workMode" className={labelClassName}>
              Remote / Hybrid / Onsite
            </label>
            <select
              id="workMode"
              name="workMode"
              disabled={pending}
              value={values.workMode}
              onChange={(event) => {
                const next = event.target.value as WorkMode | "";
                updateField("workMode", next);
                if (next === "remote") updateField("isRemote", true);
                if (next === "onsite" || next === "hybrid") updateField("isRemote", false);
              }}
              className={inputClassName}
            >
              <option value="">Not specified</option>
              {WORK_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {WORK_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="employmentType" className={labelClassName}>
              Employment type
            </label>
            <select
              id="employmentType"
              name="employmentType"
              required
              disabled={pending}
              value={values.employmentType}
              onChange={(event) =>
                updateField("employmentType", event.target.value as EmploymentType)
              }
              className={inputClassName}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            {fieldErrors?.employmentType ? (
              <p className={fieldErrorClassName}>{fieldErrors.employmentType}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="seniorityLevel" className={labelClassName}>
              Seniority level
            </label>
            <select
              id="seniorityLevel"
              name="seniorityLevel"
              disabled={pending}
              value={values.seniorityLevel}
              onChange={(event) =>
                updateField("seniorityLevel", event.target.value as SeniorityLevel | "")
              }
              className={inputClassName}
            >
              <option value="">Not specified</option>
              {SENIORITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {SENIORITY_LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="experienceRequired" className={labelClassName}>
              Experience required
            </label>
            <input
              id="experienceRequired"
              name="experienceRequired"
              type="text"
              disabled={pending}
              value={values.experienceRequired}
              onChange={(event) => updateField("experienceRequired", event.target.value)}
              placeholder="e.g. 3–5 years"
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="educationRequired" className={labelClassName}>
              Education
            </label>
            <input
              id="educationRequired"
              name="educationRequired"
              type="text"
              disabled={pending}
              value={values.educationRequired}
              onChange={(event) => updateField("educationRequired", event.target.value)}
              placeholder="e.g. Bachelor’s in CS or equivalent"
              className={inputClassName}
            />
          </div>

          {mode === "create" ? (
            <div className="space-y-2">
              <label htmlFor="status" className={labelClassName}>
                Status
              </label>
              <select
                id="status"
                name="status"
                required
                disabled={pending}
                value={values.status}
                onChange={(event) =>
                  updateField("status", event.target.value as "draft" | "published")
                }
                className={inputClassName}
              >
                <option value="draft">Draft (not visible to candidates)</option>
                <option value="published">Published (visible to candidates)</option>
              </select>
              <p className="text-xs text-zinc-400">
                Publishing requires title, description, responsibilities, and required skills.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="salaryMin" className={labelClassName}>
              Salary min
            </label>
            <input
              id="salaryMin"
              name="salaryMin"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              disabled={pending}
              value={values.salaryMin}
              onChange={(event) => updateField("salaryMin", event.target.value)}
              placeholder="e.g. 90000"
              className={inputClassName}
            />
            {fieldErrors?.salaryMin ? (
              <p className={fieldErrorClassName}>{fieldErrors.salaryMin}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="salaryMax" className={labelClassName}>
              Salary max
            </label>
            <input
              id="salaryMax"
              name="salaryMax"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              disabled={pending}
              value={values.salaryMax}
              onChange={(event) => updateField("salaryMax", event.target.value)}
              placeholder="e.g. 130000"
              className={inputClassName}
            />
            {fieldErrors?.salaryMax ? (
              <p className={fieldErrorClassName}>{fieldErrors.salaryMax}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="openPositions" className={labelClassName}>
              Number of open positions
            </label>
            <input
              id="openPositions"
              name="openPositions"
              type="number"
              min={1}
              disabled={pending}
              value={values.openPositions}
              onChange={(event) => updateField("openPositions", event.target.value)}
              className={inputClassName}
            />
            {fieldErrors?.openPositions ? (
              <p className={fieldErrorClassName}>{fieldErrors.openPositions}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="closesAt" className={labelClassName}>
              Application deadline
            </label>
            <input
              id="closesAt"
              name="closesAt"
              type="date"
              disabled={pending}
              value={values.closesAt}
              onChange={(event) => updateField("closesAt", event.target.value)}
              className={inputClassName}
            />
            {fieldErrors?.closesAt ? (
              <p className={fieldErrorClassName}>{fieldErrors.closesAt}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="hiringManager" className={labelClassName}>
              Hiring manager <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="hiringManager"
              name="hiringManager"
              type="text"
              disabled={pending}
              value={values.hiringManager}
              onChange={(event) => updateField("hiringManager", event.target.value)}
              placeholder="e.g. Jane Doe"
              className={inputClassName}
            />
          </div>
        </div>

        <SkillsInput
          id="requiredSkills"
          name="requiredSkills"
          label="Required skills"
          hint="Press Enter to add. Used for AI resume matching and ranking."
          values={values.requiredSkills}
          onChange={(next) => updateField("requiredSkills", next)}
          disabled={pending}
          required
          error={fieldErrors?.requiredSkills}
        />

        <SkillsInput
          id="preferredSkills"
          name="preferredSkills"
          label="Preferred skills"
          values={values.preferredSkills}
          onChange={(next) => updateField("preferredSkills", next)}
          disabled={pending}
        />

        <SkillsInput
          id="matchingKeywords"
          name="matchingKeywords"
          label="Keywords for candidate matching"
          values={values.matchingKeywords}
          onChange={(next) => updateField("matchingKeywords", next)}
          disabled={pending}
        />

        <div className="space-y-2">
          <label htmlFor="summary" className={labelClassName}>
            Job summary
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            disabled={pending}
            value={values.summary}
            onChange={(event) => updateField("summary", event.target.value)}
            placeholder="Short overview of the role."
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className={labelClassName}>
            Job description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            disabled={pending}
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Detailed description of the role, team, and impact."
            className={inputClassName}
          />
          {fieldErrors?.description ? (
            <p className={fieldErrorClassName}>{fieldErrors.description}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="responsibilities" className={labelClassName}>
            Responsibilities
          </label>
          <textarea
            id="responsibilities"
            name="responsibilities"
            rows={5}
            disabled={pending}
            value={values.responsibilities}
            onChange={(event) => updateField("responsibilities", event.target.value)}
            placeholder="Day-to-day responsibilities (required to publish)."
            className={inputClassName}
          />
          {fieldErrors?.responsibilities ? (
            <p className={fieldErrorClassName}>{fieldErrors.responsibilities}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="requirements" className={labelClassName}>
            Requirements
          </label>
          <textarea
            id="requirements"
            name="requirements"
            rows={4}
            disabled={pending}
            value={values.requirements}
            onChange={(event) => updateField("requirements", event.target.value)}
            placeholder="Qualification bullets and must-haves."
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="benefits" className={labelClassName}>
            Benefits
          </label>
          <textarea
            id="benefits"
            name="benefits"
            rows={3}
            disabled={pending}
            value={values.benefits}
            onChange={(event) => updateField("benefits", event.target.value)}
            placeholder="Benefits and perks."
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="internalNotes" className={labelClassName}>
            Internal notes <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            id="internalNotes"
            name="internalNotes"
            rows={3}
            disabled={pending}
            value={values.internalNotes}
            onChange={(event) => updateField("internalNotes", event.target.value)}
            placeholder="Not shown to candidates."
            className={inputClassName}
          />
        </div>

        {/* Backward-compatible flag for older readers */}
        <input type="hidden" name="isRemote" value={values.isRemote || values.workMode === "remote" ? "on" : ""} />

        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className={BTN_PRIMARY}
          >
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>

      {aiModalOpen ? (
        <AIJobDescriptionModal
          open={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onAccept={handleAiAccept}
          hasExistingContent={hasExistingContent}
          seed={aiSeed}
        />
      ) : null}
    </>
  );
}
