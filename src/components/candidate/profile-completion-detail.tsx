"use client";

import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import type { ProfileCompletion } from "@/lib/candidate/dashboard-data";
import { MotionProgressBar } from "@/components/candidate/ui/motion-wrapper";
import { DETAIL_SECTION } from "@/lib/ui/classes";

export function ProfileCompletionDetail({ completion }: { completion: ProfileCompletion }) {
  return (
    <div className={`${DETAIL_SECTION} h-fit`}>
      <h2 className="text-lg font-bold tracking-tight text-white">
        Completion Checklist
      </h2>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-4xl font-bold tracking-tight text-white">
          {completion.percentage}%
        </span>
        <span className="text-xs font-medium text-zinc-400">
          {completion.completedFields}/{completion.totalFields} fields
        </span>
      </div>

      <div className="mt-4">
        <MotionProgressBar value={completion.percentage} />
      </div>

      <ul className="mt-6 max-h-80 space-y-2 overflow-y-auto">
        {completion.fields.map((field, index) => (
          <motion.li
            key={field.label}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-white/[0.06]"
          >
            {field.completed ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                <Check className="h-3 w-3 text-emerald-300" aria-hidden="true" />
              </span>
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                <X className="h-3 w-3 text-zinc-400" aria-hidden="true" />
              </span>
            )}
            <span
              className={
                field.completed
                  ? "font-medium text-white"
                  : "text-zinc-400"
              }
            >
              {field.label}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
