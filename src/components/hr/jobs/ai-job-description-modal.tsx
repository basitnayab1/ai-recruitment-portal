"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  generateJobDescriptionAction,
  type GenerateJobDescriptionState,
} from "@/lib/hr/job-description-actions";
import { mapGeneratedJobToFormFields, type GeneratedJobDescription } from "@/lib/ai/types";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS, type EmploymentType } from "@/lib/hr/jobs";
import { BTN_OUTLINE, BTN_PRIMARY, BTN_SECONDARY, FIELD_INPUT } from "@/lib/ui/classes";

const previewFieldClassName = FIELD_INPUT;

const initialState: GenerateJobDescriptionState = undefined;

export type AIJobDescriptionSeed = {
  title?: string;
  department?: string;
  location?: string;
  employmentType?: EmploymentType;
  salaryMin?: string;
  salaryMax?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
};

export type AIJobDescriptionApplyPayload = ReturnType<typeof mapGeneratedJobToFormFields>;

type AIJobDescriptionModalProps = {
  open: boolean;
  onClose: () => void;
  onAccept: (payload: AIJobDescriptionApplyPayload) => void;
  seed?: AIJobDescriptionSeed;
  hasExistingContent: boolean;
};

function formatSalaryPreview(min?: string, max?: string): string {
  const minVal = min?.trim();
  const maxVal = max?.trim();
  if (minVal && maxVal) return `$${minVal} – $${maxVal}`;
  if (minVal) return `From $${minVal}`;
  if (maxVal) return `Up to $${maxVal}`;
  return "";
}

function PreviewFields({
  generated,
  onChange,
}: {
  generated: GeneratedJobDescription;
  onChange: (next: GeneratedJobDescription) => void;
}) {
  const updateList = (key: keyof GeneratedJobDescription, raw: string) => {
    const items = raw
      .split("\n")
      .map((line) => line.replace(/^•\s*/, "").trim())
      .filter(Boolean);
    onChange({ ...generated, [key]: items });
  };

  return (
    <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-200">Title</span>
        <input
          value={generated.title}
          onChange={(event) => onChange({ ...generated, title: event.target.value })}
          className={previewFieldClassName}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-200">Summary</span>
        <textarea
          rows={4}
          value={generated.summary}
          onChange={(event) => onChange({ ...generated, summary: event.target.value })}
          className={previewFieldClassName}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-200">Responsibilities</span>
        <textarea
          rows={5}
          value={generated.responsibilities.map((item) => `• ${item}`).join("\n")}
          onChange={(event) => updateList("responsibilities", event.target.value)}
          className={previewFieldClassName}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-200">Requirements</span>
        <textarea
          rows={4}
          value={generated.requirements.map((item) => `• ${item}`).join("\n")}
          onChange={(event) => updateList("requirements", event.target.value)}
          className={previewFieldClassName}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-200">Required skills</span>
        <textarea
          rows={3}
          value={generated.requiredSkills.join(", ")}
          onChange={(event) =>
            onChange({
              ...generated,
              requiredSkills: event.target.value
                .split(/[,;\n]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className={previewFieldClassName}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-200">Preferred skills</span>
        <textarea
          rows={2}
          value={generated.preferredSkills.join(", ")}
          onChange={(event) =>
            onChange({
              ...generated,
              preferredSkills: event.target.value
                .split(/[,;\n]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className={previewFieldClassName}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-200">
          Preferred qualifications
        </span>
        <textarea
          rows={3}
          value={generated.preferredQualifications.map((item) => `• ${item}`).join("\n")}
          onChange={(event) => updateList("preferredQualifications", event.target.value)}
          className={previewFieldClassName}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-200">Experience</span>
          <input
            value={generated.experienceRequired}
            onChange={(event) =>
              onChange({ ...generated, experienceRequired: event.target.value })
            }
            className={previewFieldClassName}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-200">Education</span>
          <input
            value={generated.educationRequired}
            onChange={(event) =>
              onChange({ ...generated, educationRequired: event.target.value })
            }
            className={previewFieldClassName}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-200">Department</span>
          <input
            value={generated.department}
            onChange={(event) => onChange({ ...generated, department: event.target.value })}
            className={previewFieldClassName}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-200">Location</span>
          <input
            value={generated.location}
            onChange={(event) => onChange({ ...generated, location: event.target.value })}
            className={previewFieldClassName}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-200">Salary min</span>
          <input
            value={generated.salaryMin}
            onChange={(event) => onChange({ ...generated, salaryMin: event.target.value })}
            className={previewFieldClassName}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-200">Salary max</span>
          <input
            value={generated.salaryMax}
            onChange={(event) => onChange({ ...generated, salaryMax: event.target.value })}
            className={previewFieldClassName}
          />
        </label>
      </div>
    </div>
  );
}

export function AIJobDescriptionModal({
  open,
  onClose,
  onAccept,
  seed,
  hasExistingContent,
}: AIJobDescriptionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<"input" | "preview">("input");
  const [preview, setPreview] = useState<GeneratedJobDescription | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const [state, formAction, pending] = useActionState(generateJobDescriptionAction, initialState);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open, mounted]);

  useEffect(() => {
    if (state?.status !== "success") return;
    queueMicrotask(() => {
      setPreview(state.generated);
      setStep("preview");
      setConfirmOverwrite(false);
    });
  }, [state]);

  useEffect(() => {
    if (open) return;
    queueMicrotask(() => {
      setStep("input");
      setPreview(null);
      setConfirmOverwrite(false);
    });
  }, [open]);

  const salaryPreview = formatSalaryPreview(seed?.salaryMin, seed?.salaryMax);

  function handleAccept() {
    if (!preview) return;

    if (hasExistingContent && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }

    onAccept(mapGeneratedJobToFormFields(preview));
    onClose();
  }

  function handleRegenerate() {
    setConfirmOverwrite(false);
    formRef.current?.requestSubmit();
  }

  const inputClassName = FIELD_INPUT;

  if (!open || !mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-white/10 bg-[#0a0a12]/95 p-0 text-zinc-100 shadow-2xl backdrop-blur-2xl open:flex open:max-h-[90vh] open:flex-col"
      onClose={onClose}
    >
      <div className="flex flex-col overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            ✨ Generate Job Description with AI
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            AI fills the form — nothing is saved until you click Save on the job form.
          </p>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <form
            ref={formRef}
            action={formAction}
            className={step === "input" ? "space-y-4" : "hidden"}
            onSubmit={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-200">Job title *</span>
                <input
                  name="jobTitle"
                  required
                  defaultValue={seed?.title ?? ""}
                  className={inputClassName}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-200">Department</span>
                <input name="department" defaultValue={seed?.department ?? ""} className={inputClassName} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-200">Employment type</span>
                <select
                  name="employmentType"
                  defaultValue={seed?.employmentType ?? "full_time"}
                  className={inputClassName}
                >
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {EMPLOYMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-200">Experience level</span>
                <input
                  name="experience"
                  placeholder="e.g. Senior (5+ years)"
                  className={inputClassName}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-200">Location</span>
                <input name="location" defaultValue={seed?.location ?? ""} className={inputClassName} />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-200">
                  Salary <span className="font-normal text-zinc-400">(optional)</span>
                </span>
                <input
                  name="salary"
                  defaultValue={salaryPreview}
                  placeholder="e.g. $90,000 – $130,000"
                  className={inputClassName}
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-200">
                  Required skills{" "}
                  <span className="font-normal text-zinc-400">(optional seed)</span>
                </span>
                <textarea
                  name="requiredSkills"
                  rows={2}
                  defaultValue={(seed?.requiredSkills ?? []).join(", ")}
                  placeholder="Leave blank — AI will generate 10–20 skills from the title"
                  className={inputClassName}
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-200">
                  Preferred skills{" "}
                  <span className="font-normal text-zinc-400">(optional seed)</span>
                </span>
                <textarea
                  name="preferredSkills"
                  rows={2}
                  defaultValue={(seed?.preferredSkills ?? []).join(", ")}
                  placeholder="Optional — AI can generate these too"
                  className={inputClassName}
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-200">Company name</span>
                <input name="companyName" placeholder="Your company name" className={inputClassName} />
              </label>
            </div>

            {state?.status === "error" && step === "input" ? (
              <p role="alert" className="text-sm text-red-300">
                {state.message}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className={`${BTN_OUTLINE} w-full sm:w-auto`}>
                Cancel
              </button>
              <button type="submit" disabled={pending} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
                {pending ? "Generating…" : "Generate"}
              </button>
            </div>
          </form>

          {step === "preview" && preview ? (
            <div className="space-y-4">
              {pending ? (
                <p className="text-sm text-zinc-400" role="status" aria-live="polite">
                  Regenerating job description…
                </p>
              ) : null}

              {state?.status === "error" ? (
                <p role="alert" className="text-sm text-red-300">
                  {state.message}
                </p>
              ) : null}

              <PreviewFields generated={preview} onChange={setPreview} />

              {confirmOverwrite ? (
                <p
                  role="alert"
                  className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
                >
                  This will replace your current job posting fields (description, skills, requirements, and more). Continue?
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setStep("input");
                    setConfirmOverwrite(false);
                  }}
                  className={`${BTN_OUTLINE} w-full sm:w-auto`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={pending}
                  className={`${BTN_SECONDARY} w-full sm:w-auto`}
                >
                  {pending ? "Regenerating…" : "Regenerate"}
                </button>
                <button type="button" onClick={handleAccept} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
                  {confirmOverwrite ? "Confirm & Apply" : "Accept"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
