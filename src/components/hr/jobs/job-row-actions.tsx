"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  closeJobAction,
  publishJobAction,
  type JobStatusActionState,
} from "@/lib/hr/jobs-actions";
import type { JobStatus } from "@/lib/hr/jobs";

const initialState: JobStatusActionState = undefined;

export function JobRowActions({ jobId, status }: { jobId: string; status: JobStatus }) {
  const [publishState, publishFormAction, publishPending] = useActionState(
    publishJobAction,
    initialState
  );
  const [closeState, closeFormAction, closePending] = useActionState(
    closeJobAction,
    initialState
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-3 whitespace-nowrap text-sm">
        <Link
          href={`/hr/jobs/${jobId}`}
          className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          View
        </Link>
        <Link
          href={`/hr/jobs/${jobId}/edit`}
          className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Edit
        </Link>
        {status === "draft" ? (
          <form action={publishFormAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <button
              type="submit"
              disabled={publishPending}
              className="font-medium text-green-700 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-60 dark:text-green-400 dark:hover:text-green-300"
            >
              {publishPending ? "Publishing…" : "Publish"}
            </button>
          </form>
        ) : null}
        {status === "published" ? (
          <form action={closeFormAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <button
              type="submit"
              disabled={closePending}
              className="font-medium text-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
            >
              {closePending ? "Closing…" : "Close"}
            </button>
          </form>
        ) : null}
      </div>
      {publishState?.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{publishState.error}</p>
      ) : null}
      {closeState?.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{closeState.error}</p>
      ) : null}
    </div>
  );
}
