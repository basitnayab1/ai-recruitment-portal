"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { CandidateSidebar } from "@/components/candidate/candidate-sidebar";

export function CandidateMobileNav({
  fullName,
  email,
  completionPercentage,
  pictureUrl,
}: {
  fullName: string;
  email: string;
  completionPercentage: number;
  pictureUrl: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 lg:hidden dark:border-zinc-700 dark:bg-zinc-900/80"
      >
        <Sparkles className="h-4 w-4 text-violet-600" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[260px] max-w-[85%]">
            <CandidateSidebar
              fullName={fullName}
              email={email}
              completionPercentage={completionPercentage}
              pictureUrl={pictureUrl}
              collapsed={false}
              onToggleCollapse={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
