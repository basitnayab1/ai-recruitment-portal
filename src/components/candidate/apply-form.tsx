"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyToJob, type ApplyToJobState } from "@/lib/candidate/application-actions";
import { NOTICE_PERIODS, NOTICE_PERIOD_LABELS } from "@/lib/candidate/profile-details";
import { ALERT_ERROR, FIELD_INPUT, SELECT_INPUT } from "@/lib/ui/classes";

const initialState: ApplyToJobState = undefined;

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
            className={SELECT_INPUT}
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
          className={`${FIELD_INPUT} min-h-[120px] resize-none py-3`}
        />
      </div>

      {state?.status === "error" ? (
        <p
          role="alert"
          className={ALERT_ERROR}
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
