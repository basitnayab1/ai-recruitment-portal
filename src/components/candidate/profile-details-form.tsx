"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateCandidateProfileDetails,
  type UpdateProfileDetailsState,
} from "@/lib/candidate/profile-actions";
import {
  GENDERS,
  GENDER_LABELS,
  HIGHEST_QUALIFICATIONS,
  HIGHEST_QUALIFICATION_LABELS,
  NOTICE_PERIODS,
  NOTICE_PERIOD_LABELS,
  type CandidateProfileDetails,
} from "@/lib/candidate/profile-details";

import { SELECT_INPUT } from "@/lib/ui/classes";

const selectClassName = SELECT_INPUT;

const initialState: UpdateProfileDetailsState = undefined;

function SelectField({
  id,
  label,
  defaultValue,
  disabled,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  defaultValue: string;
  disabled: boolean;
  options: readonly { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue}
        disabled={disabled}
        className={selectClassName}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const GENDER_OPTIONS = GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }));
const QUALIFICATION_OPTIONS = HIGHEST_QUALIFICATIONS.map((value) => ({
  value,
  label: HIGHEST_QUALIFICATION_LABELS[value],
}));
const NOTICE_PERIOD_OPTIONS = NOTICE_PERIODS.map((value) => ({
  value,
  label: NOTICE_PERIOD_LABELS[value],
}));

export function ProfileDetailsForm({ details }: { details: CandidateProfileDetails | null }) {
  const [state, formAction, pending] = useActionState(updateCandidateProfileDetails, initialState);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Personal Details</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={details?.phone ?? ""}
              disabled={pending}
              placeholder="+92 300 1234567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnic">CNIC</Label>
            <Input
              id="cnic"
              name="cnic"
              defaultValue={details?.cnic ?? ""}
              disabled={pending}
              placeholder="12345-1234567-1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={details?.dateOfBirth ?? ""}
              disabled={pending}
            />
          </div>
          <SelectField
            id="gender"
            label="Gender"
            defaultValue={details?.gender ?? ""}
            disabled={pending}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              defaultValue={details?.country ?? ""}
              disabled={pending}
              placeholder="Pakistan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              name="province"
              defaultValue={details?.province ?? ""}
              disabled={pending}
              placeholder="Punjab"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={details?.city ?? ""}
              disabled={pending}
              placeholder="Lahore"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={details?.address ?? ""}
              disabled={pending}
              placeholder="House / street / area"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Professional Details
        </h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currentJobTitle">Current Job Title</Label>
            <Input
              id="currentJobTitle"
              name="currentJobTitle"
              defaultValue={details?.currentJobTitle ?? ""}
              disabled={pending}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentCompany">Current Company</Label>
            <Input
              id="currentCompany"
              name="currentCompany"
              defaultValue={details?.currentCompany ?? ""}
              disabled={pending}
              placeholder="e.g. Acme Inc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
            <Input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              min={0}
              step={0.5}
              defaultValue={details?.yearsOfExperience ?? ""}
              disabled={pending}
              placeholder="e.g. 3.5"
            />
          </div>
          <SelectField
            id="highestQualification"
            label="Highest Qualification"
            defaultValue={details?.highestQualification ?? ""}
            disabled={pending}
            options={QUALIFICATION_OPTIONS}
            placeholder="Select qualification"
          />
          <div className="space-y-2">
            <Label htmlFor="expectedSalary">Expected Salary</Label>
            <Input
              id="expectedSalary"
              name="expectedSalary"
              type="number"
              min={0}
              step={1000}
              defaultValue={details?.expectedSalary ?? ""}
              disabled={pending}
              placeholder="e.g. 150000"
            />
          </div>
          <SelectField
            id="noticePeriod"
            label="Notice Period"
            defaultValue={details?.noticePeriod ?? ""}
            disabled={pending}
            options={NOTICE_PERIOD_OPTIONS}
            placeholder="Select notice period"
          />
        </div>
      </div>

      <div className="space-y-5 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Online Presence</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={details?.linkedinUrl ?? ""}
              disabled={pending}
              placeholder="https://linkedin.com/in/your-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">Portfolio URL</Label>
            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              defaultValue={details?.portfolioUrl ?? ""}
              disabled={pending}
              placeholder="https://your-portfolio.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              type="url"
              defaultValue={details?.githubUrl ?? ""}
              disabled={pending}
              placeholder="https://github.com/your-username"
            />
          </div>
        </div>
      </div>

      {state?.status === "error" ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : "Save Profile"}
      </Button>
    </form>
  );
}
