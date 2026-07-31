"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteResume, type DeleteResumeState } from "@/lib/candidate/resume-actions";

const initialState: DeleteResumeState = undefined;

export function ResumeDeleteButton() {
  const [state, formAction, pending] = useActionState(deleteResume, initialState);

  return (
    <div className="shrink-0">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm("Delete your resume? You'll need to upload a new one before applying to jobs.")) {
            event.preventDefault();
          }
        }}
      >
        <Button type="submit" variant="outline" size="sm" disabled={pending} aria-busy={pending}>
          {pending ? "Deleting…" : "Delete"}
        </Button>
      </form>
      {state?.status === "error" ? (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
