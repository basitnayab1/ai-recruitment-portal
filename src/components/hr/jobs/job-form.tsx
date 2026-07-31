"use client";

import { useActionState } from "react";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS, type EmploymentType } from "@/lib/hr/jobs";
import type { JobFormState } from "@/lib/hr/jobs-actions";
import { SURFACE_CARD } from "@/lib/ui/classes";

export type JobFormDefaultValues = {
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requirements: string;
  responsibilities: string;
  salaryMin: string;
  salaryMax: string;
  isRemote: boolean;
  closesAt: string;
  status: "draft" | "published";
};

const EMPTY_DEFAULTS: JobFormDefaultValues = {
  title: "",
  department: "",
  location: "",
  employmentType: "full_time",
  description: "",
  requirements: "",
  responsibilities: "",
  salaryMin: "",
  salaryMax: "",
  isRemote: false,
  closesAt: "",
  status: "draft",
};

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-700";
const labelClassName = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const fieldErrorClassName = "mt-1 text-sm text-red-600 dark:text-red-400";

const initialState: JobFormState = undefined;

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
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = { ...EMPTY_DEFAULTS, ...defaultValues };
  const fieldErrors = state?.status === "error" ? state.fieldErrors : undefined;

  return (
    <form
      action={formAction}
      noValidate
      className={`space-y-8 p-8 ${SURFACE_CARD}`}
    >
      {state?.status === "error" ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className={labelClassName}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            disabled={pending}
            defaultValue={values.title}
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
            defaultValue={values.department}
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
            defaultValue={values.location}
            placeholder="e.g. San Francisco, CA"
            className={inputClassName}
          />
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
            defaultValue={values.employmentType}
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
              defaultValue={values.status}
              className={inputClassName}
            >
              <option value="draft">Draft (not visible to candidates)</option>
              <option value="published">Published (visible to candidates)</option>
            </select>
          </div>
        ) : null}

        <div className="flex items-center gap-2 pt-7">
          <input
            id="isRemote"
            name="isRemote"
            type="checkbox"
            disabled={pending}
            defaultChecked={values.isRemote}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700"
          />
          <label htmlFor="isRemote" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            This is a remote position
          </label>
        </div>

        <div className="space-y-2">
          <label htmlFor="salaryMin" className={labelClassName}>
            Salary min <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            id="salaryMin"
            name="salaryMin"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            disabled={pending}
            defaultValue={values.salaryMin}
            placeholder="e.g. 90000"
            className={inputClassName}
          />
          {fieldErrors?.salaryMin ? (
            <p className={fieldErrorClassName}>{fieldErrors.salaryMin}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="salaryMax" className={labelClassName}>
            Salary max <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            id="salaryMax"
            name="salaryMax"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            disabled={pending}
            defaultValue={values.salaryMax}
            placeholder="e.g. 130000"
            className={inputClassName}
          />
          {fieldErrors?.salaryMax ? (
            <p className={fieldErrorClassName}>{fieldErrors.salaryMax}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="closesAt" className={labelClassName}>
            Application deadline <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            id="closesAt"
            name="closesAt"
            type="date"
            disabled={pending}
            defaultValue={values.closesAt}
            className={inputClassName}
          />
          {fieldErrors?.closesAt ? (
            <p className={fieldErrorClassName}>{fieldErrors.closesAt}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className={labelClassName}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          disabled={pending}
          defaultValue={values.description}
          placeholder="Describe the role, team, and what makes it exciting."
          className={inputClassName}
        />
        {fieldErrors?.description ? (
          <p className={fieldErrorClassName}>{fieldErrors.description}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="responsibilities" className={labelClassName}>
          Responsibilities <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="responsibilities"
          name="responsibilities"
          rows={4}
          disabled={pending}
          defaultValue={values.responsibilities}
          placeholder="What will this person be doing day-to-day?"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="requirements" className={labelClassName}>
          Requirements <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="requirements"
          name="requirements"
          rows={4}
          disabled={pending}
          defaultValue={values.requirements}
          placeholder="Required skills, experience, and qualifications."
          className={inputClassName}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
