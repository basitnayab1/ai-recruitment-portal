"use client";

import { useActionState, useEffect, useRef } from "react";
import { addApplicationNoteAction, type AddApplicationNoteState } from "@/lib/hr/application-actions";
import { BTN_PRIMARY, FIELD_INPUT } from "@/lib/ui/classes";

const initialState: AddApplicationNoteState = undefined;

export function AddNoteForm({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(addApplicationNoteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <textarea
        name="note"
        rows={3}
        required
        placeholder="Add an internal note about this candidate…"
        className={`${FIELD_INPUT} min-h-[80px] resize-none py-3`}
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className={BTN_PRIMARY}
        >
          {pending ? "Saving…" : "Save Note"}
        </button>
        {state?.status === "error" ? (
          <p role="alert" className="text-xs text-red-300">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
