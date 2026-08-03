"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/shared/form-alert";
import { FILE_INPUT } from "@/lib/ui/classes";
import { uploadResume, type UploadResumeState } from "@/lib/candidate/resume-actions";

const initialState: UploadResumeState = undefined;
const MAX_RESUME_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export function ResumeUploadForm({ hasExistingResume }: { hasExistingResume: boolean }) {
  const [state, formAction, pending] = useActionState(uploadResume, initialState);
  const [clientError, setClientError] = useState<string | null>(null);

  return (
    <form
      action={formAction}
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        const form = event.currentTarget;
        const input = form.elements.namedItem("resume");
        const file =
          input instanceof HTMLInputElement && input.files?.[0] ? input.files[0] : null;
        if (file && file.size > MAX_RESUME_SIZE_BYTES) {
          event.preventDefault();
          setClientError("Resume must be smaller than 1 MB.");
          return;
        }
        setClientError(null);
      }}
    >
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
          onChange={() => setClientError(null)}
        />
        <p className="text-xs text-muted-foreground">PDF only, up to 1 MB.</p>
      </div>

      {clientError ? <FormAlert variant="error">{clientError}</FormAlert> : null}
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
