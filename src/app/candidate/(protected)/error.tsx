"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BTN_PRIMARY, PAGE_TITLE, SURFACE_CARD } from "@/lib/ui/classes";

export default function CandidatePortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CandidatePortalError]", error);
  }, [error]);

  return (
    <div className={`${SURFACE_CARD} mx-auto max-w-lg p-8 text-center`}>
      <h1 className={PAGE_TITLE}>Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-400">
        We could not load this page. Please try again or return to your dashboard.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-zinc-400">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button type="button" onClick={() => reset()} className={BTN_PRIMARY}>
          Try again
        </button>
        <Link
          href="/candidate"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/80 px-5 text-sm font-semibold text-zinc-200 dark:border-zinc-700"
        >
          Candidate Dashboard
        </Link>
      </div>
    </div>
  );
}
