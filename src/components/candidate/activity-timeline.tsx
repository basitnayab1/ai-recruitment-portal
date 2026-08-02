"use client";

import { motion } from "framer-motion";
import { formatDate } from "@/lib/hr/format";
import { StatusBadge } from "@/components/hr/status-badge";
import type { CandidateApplicationSummary } from "@/lib/candidate/dashboard-data";
import type { ApplicationStatus } from "@/lib/hr/status";
import { DASHBOARD_CARD, CARD_HEADER } from "@/lib/ui/classes";
import { FileText } from "lucide-react";

export function ActivityTimeline({
  applications,
}: {
  applications: CandidateApplicationSummary[];
}) {
  return (
    <div className={DASHBOARD_CARD}>
      <div className={CARD_HEADER}>
        <h2 className="text-base font-bold tracking-tight text-white">
          Recent Activity
        </h2>
      </div>

      {applications.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
            <FileText className="h-6 w-6 text-violet-300" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-semibold text-white">No activity yet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Your application updates will appear here.
          </p>
        </div>
      ) : (
        <ul className="relative px-6 py-4">
          <span
            className="absolute top-4 bottom-4 left-[2.125rem] w-px bg-gradient-to-b from-violet-700 via-indigo-800 to-transparent"
            aria-hidden="true"
          />
          {applications.map((application, index) => (
            <motion.li
              key={application.id}
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className="relative flex gap-4 py-4 first:pt-0 last:pb-0"
            >
              <span className="relative z-10 mt-1 flex h-3 w-3 shrink-0 rounded-full border-2 border-[#06060a] bg-gradient-to-br from-violet-500 to-indigo-500 shadow-md shadow-violet-500/30" />
              <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-violet-500/5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">
                    Applied to {application.jobTitle}
                  </p>
                  <StatusBadge status={application.status as ApplicationStatus} />
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {formatDate(application.submittedAt)}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
