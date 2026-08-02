"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type FadeRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
} & Omit<HTMLMotionProps<"div">, "children" | "initial" | "whileInView" | "viewport">;

/** Scroll / mount fade + subtle slide — respects reduced motion via MotionProvider. */
export function FadeReveal({
  children,
  className,
  delay = 0,
  y = 16,
  once = true,
  ...rest
}: FadeRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-48px" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
