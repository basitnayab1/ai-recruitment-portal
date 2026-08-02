"use client";

import { motion } from "framer-motion";
import { SURFACE_CARD, PAGE_TITLE, PAGE_DESCRIPTION } from "@/lib/ui/classes";

export function DashboardHero({
  fullName,
  todayLabel,
}: {
  fullName: string;
  todayLabel: string;
}) {
  const firstName = fullName.split(" ")[0];

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden ${SURFACE_CARD} p-8 sm:p-10`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(99,102,241,0.06)_40%,rgba(59,130,246,0.08)_100%)]"
        aria-hidden="true"
      />
      <div
        className="hero-blob-a pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="hero-blob-b pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-sm font-semibold text-violet-300">{todayLabel}</p>
        <h1 className={`${PAGE_TITLE} mt-2`}>
          Welcome back, {firstName} <span aria-hidden="true">👋</span>
        </h1>
        <p className={PAGE_DESCRIPTION}>
          Track applications, prepare for interviews, and land your next role.
        </p>
      </div>
    </motion.div>
  );
}
