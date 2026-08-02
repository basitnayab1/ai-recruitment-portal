"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Bell,
  Sparkles,
  User,
  FileUp,
} from "lucide-react";
import { MotionProgressBar } from "@/components/candidate/ui/motion-wrapper";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";

const NAV_ITEMS = [
  { href: "/candidate", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/candidate/applications", label: "Applications", icon: FileText },
  { href: "/candidate/interviews", label: "Interviews", icon: CalendarCheck },
  { href: "/candidate/notifications", label: "Notifications", icon: Bell },
  { href: "/candidate/profile", label: "Profile", icon: User },
  { href: "/candidate/resume", label: "Resume", icon: FileUp },
  { href: "/jobs", label: "Browse Jobs", icon: Briefcase },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === "/candidate") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CandidateSidebar({
  fullName,
  email,
  completionPercentage,
  pictureUrl,
  collapsed,
  onToggleCollapse,
}: {
  fullName: string;
  email: string;
  completionPercentage: number;
  pictureUrl: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-white/10 bg-[#0a0a12]/80 backdrop-blur-2xl transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
      aria-label="Candidate navigation"
    >
      <div className={`flex h-[72px] shrink-0 items-center ${collapsed ? "justify-center px-2" : "gap-3 px-5"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
          <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <span className="hr-logo-glow text-sm font-bold tracking-tight">RecruitAI</span>
            <p className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase">Candidate</p>
          </div>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
        {!collapsed ? (
          <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-zinc-200 uppercase">Menu</p>
        ) : null}
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                collapsed ? "justify-center px-2" : "px-3"
              } ${
                active
                  ? "bg-white/10 text-white"
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
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                  active
                    ? "bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-violet-300"
                    : "bg-zinc-800/50 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <CandidateAvatar name={fullName} pictureSrc={pictureUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-100">{fullName}</p>
              <p className="truncate text-xs text-zinc-500">{email}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-400">Profile</span>
              <span className="font-bold text-violet-400">{completionPercentage}%</span>
            </div>
            <MotionProgressBar value={completionPercentage} />
          </div>
        </div>
      ) : (
        <div className="mx-2 mb-3 flex justify-center">
          <CandidateAvatar name={fullName} pictureSrc={pictureUrl} size="sm" />
        </div>
      )}

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="mx-3 mb-4 flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="ml-1 text-xs font-medium">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
