"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/shared/form-alert";
import { FILE_INPUT } from "@/lib/ui/classes";
import { uploadResume, type UploadResumeState } from "@/lib/candidate/resume-actions";

const initialState: UploadResumeState = undefined;

export function ResumeUploadForm({ hasExistingResume }: { hasExistingResume: boolean }) {
  const [state, formAction, pending] = useActionState(uploadResume, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="resume">{hasExistingResume ? "Replace resume" : "Upload resume"}</Label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,application/pdf"
          required
          disabled={pending}
          className={FILE_INPUT}
        />
        <p className="text-xs text-muted-foreground">PDF only, up to 5 MB.</p>
      </div>

      {state?.status === "error" ? (
        <FormAlert variant="error">{state.message}</FormAlert>
      ) : null}
      {state?.status === "success" ? (
        <FormAlert variant="success">{state.message}</FormAlert>
      ) : null}

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Uploading…" : hasExistingResume ? "Replace Resume" : "Upload Resume"}
      </Button>
    </form>
  );
}
