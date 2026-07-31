"use client";

import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { SURFACE_CARD } from "@/lib/ui/classes";

/**
 * Abstract dashboard mockup built from styled divs (no external screenshot
 * asset) so the hero loads instantly with zero extra network requests.
 */
export function HeroIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute inset-4 rounded-3xl p-6 shadow-2xl shadow-indigo-900/10 ${SURFACE_CARD}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs font-medium text-zinc-400">Candidate Dashboard</span>
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-3 w-2/3 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-1/2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white">
            <Briefcase className="h-5 w-5" aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold">12</p>
            <p className="text-xs text-indigo-100">Applications</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">3</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Interviews</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {["Senior Product Designer", "Backend Engineer"].map((role) => (
            <div
              key={role}
              className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800/80"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {role}
                </p>
                <p className="text-[10px] text-zinc-400">Under review</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className={`absolute -right-6 top-6 flex items-center gap-3 px-4 py-3 shadow-xl ${SURFACE_CARD}`}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
          <Users className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Offer Sent</p>
          <p className="text-xs text-zinc-400">Just now</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className={`absolute -bottom-4 -left-6 px-4 py-3 shadow-xl ${SURFACE_CARD}`}
      >
        <p className="text-xs text-zinc-400">Match Score</p>
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">96%</p>
      </motion.div>
    </div>
  );
}
