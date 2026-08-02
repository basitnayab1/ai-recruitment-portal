"use client";

import { cn } from "@/lib/utils";

type ShinyTextProps = {
  text: string;
  className?: string;
  /** Disable shine for reduced motion / static headings */
  disabled?: boolean;
};

/** Soft shimmer on gradient text — used sparingly for brand headlines. */
export function ShinyText({ text, className, disabled }: ShinyTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent dark:from-violet-300 dark:via-indigo-200 dark:to-violet-300",
        !disabled && "animate-shiny-text bg-[length:200%_auto]",
        className
      )}
    >
      {text}
    </span>
  );
}
