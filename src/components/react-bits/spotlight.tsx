"use client";

import { useCallback, useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  children: ReactNode;
  className?: string;
};

/** ReactBits-inspired spotlight card — subtle, professional hover light. */
export function Spotlight({ children, className }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        "group/spotlight relative overflow-hidden rounded-2xl",
        "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:opacity-0 before:transition-opacity before:duration-300",
        "before:bg-[radial-gradient(400px_circle_at_var(--spot-x,50%)_var(--spot-y,50%),rgba(139,92,246,0.18),transparent_55%)]",
        "hover:before:opacity-100",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
