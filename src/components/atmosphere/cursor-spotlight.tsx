"use client";

import { useEffect, useRef } from "react";

type CursorSpotlightProps = {
  /** Softness of the glow radius in px */
  size?: number;
  /** Accent color for the spotlight */
  color?: string;
  className?: string;
};

/**
 * Full-viewport mouse-follow spotlight (ReactBits-inspired, original impl).
 * Uses CSS custom properties + rAF for smooth tracking without layout thrash.
 */
export function CursorSpotlight({
  size = 520,
  color = "rgba(139, 92, 246, 0.16)",
  className,
}: CursorSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const active = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "0";
      return;
    }
    if (window.matchMedia("(pointer: coarse)").matches) {
      el.style.opacity = "0";
      return;
    }

    const onMove = (event: MouseEvent) => {
      target.current.x = event.clientX;
      target.current.y = event.clientY;
      if (!active.current) {
        active.current = true;
        current.current.x = event.clientX;
        current.current.y = event.clientY;
        el.style.opacity = "1";
      }
    };

    const onLeave = () => {
      active.current = false;
      el.style.opacity = "0";
    };

    const tick = () => {
      const ease = 0.12;
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;
      el.style.setProperty("--cx", `${current.current.x}px`);
      el.style.setProperty("--cy", `${current.current.y}px`);
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[1] opacity-0 transition-opacity duration-500 ${className ?? ""}`}
      style={{
        background: `radial-gradient(${size}px circle at var(--cx, 50%) var(--cy, 40%), ${color}, transparent 55%)`,
        mixBlendMode: "screen",
      }}
    />
  );
}
