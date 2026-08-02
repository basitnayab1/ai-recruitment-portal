"use client";

import {
  CalendarCheck,
  CheckCircle2,
  FileText,
  UserCircle,
} from "lucide-react";
import { AnimatedCounter } from "@/components/candidate/ui/animated-counter";
import { MotionStagger, MotionStaggerItem } from "@/components/candidate/ui/motion-wrapper";
import { KPI_HERO_CARD, KPI_ICON_GRADIENTS } from "@/lib/ui/classes";
import { MotionProgressBar } from "@/components/candidate/ui/motion-wrapper";

const STAT_CONFIG = [
  { key: "applications", label: "Applications Submitted", icon: FileText, colorIndex: 0 },
  { key: "interviews", label: "Interviews Scheduled", icon: CalendarCheck, colorIndex: 1 },
  { key: "completion", label: "Profile Completion", icon: UserCircle, colorIndex: 2 },
  { key: "resume", label: "Resume Status", icon: CheckCircle2, colorIndex: 3 },
] as const;

export function DashboardStatCards({
  applicationsCount,
  interviewsCount,
  completionPercentage,
  hasResume,
}: {
  applicationsCount: number;
  interviewsCount: number;
  completionPercentage: number;
  hasResume: boolean;
}) {
  const values: Record<(typeof STAT_CONFIG)[number]["key"], number | string> = {
    applications: applicationsCount,
    interviews: interviewsCount,
    completion: completionPercentage,
    resume: hasResume ? 100 : 0,
  };

  return (
    <MotionStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_CONFIG.map((stat) => {
        const gradient = KPI_ICON_GRADIENTS[stat.colorIndex];
        const Icon = stat.icon;
        const isCompletion = stat.key === "completion";
        const isResume = stat.key === "resume";

        return (
          <MotionStaggerItem key={stat.key}>
            <div className={`${KPI_HERO_CARD} relative overflow-hidden`}>
              <div
                className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    {stat.label}
                  </p>
                  {isResume ? (
                    <p className="mt-3 text-3xl font-bold text-white">
                      {hasResume ? (
                        <span className="text-emerald-300">Uploaded</span>
                      ) : (
                        <span className="text-amber-300">Missing</span>
                      )}
                    </p>
                  ) : isCompletion ? (
                    <>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-white tabular-nums">
                        <AnimatedCounter value={completionPercentage} />%
                      </p>
                      <div className="mt-3">
                        <MotionProgressBar value={completionPercentage} />
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-4xl font-bold tracking-tight text-white tabular-nums">
                      <AnimatedCounter value={values[stat.key] as number} />
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${gradient}`}
                >
                  <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </div>
            </div>
          </MotionStaggerItem>
        );
      })}
    </MotionStagger>
  );
}
