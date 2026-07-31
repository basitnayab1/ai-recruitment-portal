"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { HR_NAV_ITEMS } from "@/lib/hr/nav-items";
import {
  ApplicationsIcon,
  CandidatesIcon,
  DashboardIcon,
  InterviewsIcon,
  JobsIcon,
  NotificationsIcon,
  ReportsIcon,
  ActivityLogIcon,
  SettingsIcon,
} from "@/components/hr/icons";

const NAV_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  "/hr": DashboardIcon,
  "/hr/jobs": JobsIcon,
  "/hr/applications": ApplicationsIcon,
  "/hr/interviews": InterviewsIcon,
  "/hr/candidates": CandidatesIcon,
  "/hr/notifications": NotificationsIcon,
  "/hr/reports": ReportsIcon,
  "/hr/activity-log": ActivityLogIcon,
  "/hr/settings": SettingsIcon,
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/hr") {
    return pathname === "/hr";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="HR navigation">
      <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
        Menu
      </p>
      {HR_NAV_ITEMS.map((item) => {
        const Icon = NAV_ICONS[item.href];
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`hr-nav-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-white/10 text-white shadow-inner"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            {active ? (
              <span
                className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                aria-hidden="true"
              />
            ) : null}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                active
                  ? "bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-violet-300"
                  : "bg-zinc-800/50 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
