"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyToJob, type ApplyToJobState } from "@/lib/candidate/application-actions";
import { NOTICE_PERIODS, NOTICE_PERIOD_LABELS } from "@/lib/candidate/profile-details";

const initialState: ApplyToJobState = undefined;

const selectClassName =
  "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export function ApplyForm({
  jobId,
  defaultExpectedSalary,
  defaultNoticePeriod,
}: {
  jobId: string;
  defaultExpectedSalary?: number | null;
  defaultNoticePeriod?: string | null;
}) {
  const [state, formAction, pending] = useActionState(applyToJob, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="jobId" value={jobId} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expectedSalary">Expected Salary (optional)</Label>
          <Input
            id="expectedSalary"
            name="expectedSalary"
            type="number"
            min={0}
            step={1000}
            defaultValue={defaultExpectedSalary ?? ""}
            disabled={pending}
            placeholder="e.g. 150000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="noticePeriod">Notice Period (optional)</Label>
          <select
            id="noticePeriod"
            name="noticePeriod"
            defaultValue={defaultNoticePeriod ?? ""}
            disabled={pending}
            className={selectClassName}
          >
            <option value="">Select notice period</option>
            {NOTICE_PERIODS.map((value) => (
              <option key={value} value={value}>
                {NOTICE_PERIOD_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverLetter">Cover Letter (optional)</Label>
        <textarea
          id="coverLetter"
          name="coverLetter"
          rows={5}
          disabled={pending}
          placeholder="Tell the hiring team why you're a great fit for this role…"
          className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
        />
      </div>

      {state?.status === "error" ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
        {pending ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}
