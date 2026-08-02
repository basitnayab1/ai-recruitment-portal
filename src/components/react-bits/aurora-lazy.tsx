"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Aurora = dynamic(
  () => import("@/components/react-bits/aurora").then((m) => m.Aurora),
  { ssr: false, loading: () => null }
);

/** CSS aurora fallback — Lighthouse-friendly, used until WebGL mounts / reduced motion. */
export function AuroraFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      <div className="aurora-blob aurora-blob-a absolute -top-1/4 left-1/4 h-[60%] w-[55%] rounded-full bg-violet-500/30 blur-3xl" />
      <div className="aurora-blob aurora-blob-b absolute top-1/3 right-0 h-[50%] w-[45%] rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="aurora-blob aurora-blob-c absolute bottom-0 left-1/3 h-[40%] w-[50%] rounded-full bg-fuchsia-500/15 blur-3xl" />
    </div>
  );
}

/**
 * Lazy ReactBits Aurora with CSS fallback.
 * Skips WebGL when the user prefers reduced motion.
 */
export function AuroraBackground({ className }: { className?: string }) {
  const [enableWebGL, setEnableWebGL] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      setEnableWebGL(true);
    }
  }, []);

  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 ${className ?? ""}`} aria-hidden="true">
      <AuroraFallback />
      {enableWebGL ? (
        <div className="absolute inset-0 opacity-70 mix-blend-screen dark:opacity-90">
          <Aurora className="h-full w-full" speed={0.55} blend={0.55} amplitude={0.9} />
        </div>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white dark:via-[#0c0c0f]/50 dark:to-[#0c0c0f]" />
    </div>
  );
}
