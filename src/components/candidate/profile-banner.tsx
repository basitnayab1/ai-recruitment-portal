"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";
import { MotionProgressBar } from "@/components/candidate/ui/motion-wrapper";
import { BTN_OUTLINE } from "@/lib/ui/classes";

export function ProfileBanner({
  fullName,
  email,
  pictureUrl,
  completionPercentage,
}: {
  fullName: string;
  email: string;
  pictureUrl: string | null;
  completionPercentage: number;
}) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/80"
    >
      <div
        className="h-32 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 sm:h-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-0 left-0 h-32 w-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)] sm:h-40"
        aria-hidden="true"
      />

      <div className="relative px-6 pb-6 sm:px-8">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="rounded-full border-4 border-white shadow-xl dark:border-zinc-900">
              <CandidateAvatar name={fullName} pictureSrc={pictureUrl} size="lg" />
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {fullName}
              </h1>
              <p className="text-sm text-zinc-400">{email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/candidate/resume" className={BTN_OUTLINE}>
              Manage Resume
            </Link>
            {completionPercentage < 100 ? (
              <span className="inline-flex h-11 items-center rounded-xl bg-violet-100 px-4 text-sm font-bold text-violet-700 dark:bg-violet-950/50">
                {completionPercentage}% Complete
              </span>
            ) : (
              <span className="inline-flex h-11 items-center rounded-xl bg-emerald-100 px-4 text-sm font-bold text-emerald-700 dark:bg-emerald-950/50">
                Profile Complete ✓
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 max-w-md">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-200">Profile completion</span>
            <span className="font-bold text-violet-300">{completionPercentage}%</span>
          </div>
          <MotionProgressBar value={completionPercentage} />
        </div>
      </div>
    </motion.div>
  );
}
