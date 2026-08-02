"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/react-bits/spotlight";

type HoverCardProps = {
  children: ReactNode;
  className?: string;
};

/** Premium card with hover lift + spotlight — HR-safe subtle motion. */
export function HoverCard({ children, className }: HoverCardProps) {
  return (
    <Spotlight
      className={cn(
        "rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300",
        "hover:-translate-y-1 hover:border-violet-300/60 hover:shadow-[0_8px_30px_rgba(124,58,237,0.12)]",
        "dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:hover:border-violet-500/30 dark:hover:shadow-[0_8px_30px_rgba(124,58,237,0.18)]",
        className
      )}
    >
      {children}
    </Spotlight>
  );
}
