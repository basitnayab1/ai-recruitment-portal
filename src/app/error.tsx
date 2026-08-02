"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BTN_PRIMARY, BTN_SECONDARY, PAGE_TITLE, SURFACE_CARD } from "@/lib/ui/classes";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#06060a] px-4">
        <div className={`${SURFACE_CARD} w-full max-w-md p-8 text-center`}>
          <h1 className={PAGE_TITLE}>Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-400">
            An unexpected error occurred. You can try again or return to the home page.
          </p>
          {error.digest ? (
            <p className="mt-2 font-mono text-xs text-zinc-400">Reference: {error.digest}</p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => reset()} className={BTN_PRIMARY}>
              Try again
            </button>
            <Link href="/" className={BTN_SECONDARY}>
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
