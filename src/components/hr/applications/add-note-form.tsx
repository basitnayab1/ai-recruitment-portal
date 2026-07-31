"use client";

import { useActionState, useEffect, useRef } from "react";
import { addApplicationNoteAction, type AddApplicationNoteState } from "@/lib/hr/application-actions";

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
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : "Save Note"}
        </button>
        {state?.status === "error" ? (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
