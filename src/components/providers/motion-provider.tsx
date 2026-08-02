"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Respects the user's reduced-motion preference app-wide. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
