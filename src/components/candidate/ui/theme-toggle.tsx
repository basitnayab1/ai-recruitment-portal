"use client";

import { Moon } from "lucide-react";
import { useEffect } from "react";

/**
 * Dark-first product theme. Keeps `html.dark` locked for the ReactBits-inspired UI.
 */
export function ThemeToggle() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }, []);

  return (
    <button
      type="button"
      aria-label="Dark theme"
      title="Dark theme"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-all hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15"
    >
      <Moon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
