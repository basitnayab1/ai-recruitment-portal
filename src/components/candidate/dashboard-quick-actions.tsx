"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  FileText,
  FileUp,
  User,
} from "lucide-react";
import { MotionStagger, MotionStaggerItem } from "@/components/candidate/ui/motion-wrapper";
import { SURFACE_CARD_INTERACTIVE } from "@/lib/ui/classes";

const ACTIONS = [
  {
    href: "/candidate/profile",
    label: "Complete Profile",
    description: "Boost your visibility",
    icon: User,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    href: "/candidate/resume",
    label: "Upload Resume",
    description: "One-click applications",
    icon: FileUp,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    href: "/jobs",
    label: "Browse Jobs",
    description: "Find your next role",
    icon: Briefcase,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    href: "/candidate/applications",
    label: "View Applications",
    description: "Track your pipeline",
    icon: FileText,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    href: "/candidate/interviews",
    label: "Upcoming Interviews",
    description: "Prepare & join meetings",
    icon: CalendarCheck,
    gradient: "from-rose-500 to-pink-600",
  },
] as const;

export function DashboardQuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Quick Actions
      </h2>
      <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ACTIONS.map((action) => (
          <MotionStaggerItem key={action.href}>
            <Link
              href={action.href}
              className={`group flex h-full flex-col gap-3 p-5 ${SURFACE_CARD_INTERACTIVE}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${action.gradient}`}
              >
                <action.icon className="h-4.5 w-4.5 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{action.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{action.description}</p>
              </div>
              <ArrowRight
                className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500 dark:text-zinc-600"
                aria-hidden="true"
              />
            </Link>
          </MotionStaggerItem>
        ))}
      </MotionStagger>
    </div>
  );
}
