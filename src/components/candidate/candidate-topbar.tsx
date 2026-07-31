"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { logout } from "@/lib/candidate-auth/actions";
import { NotificationBellMenu } from "@/components/notifications/notification-bell-menu";
import type { NotificationPreviewItem } from "@/components/notifications/notification-bell-menu";
import { ThemeToggle } from "@/components/candidate/ui/theme-toggle";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";
import { BTN_OUTLINE } from "@/lib/ui/classes";
import { CandidateMobileNav } from "@/components/candidate/candidate-mobile-nav";

const BREADCRUMB_LABELS: Record<string, string> = {
  candidate: "Dashboard",
  applications: "Applications",
  interviews: "Interviews",
  notifications: "Notifications",
  profile: "Profile",
  resume: "Resume",
  apply: "Apply",
};

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "candidate") return [{ label: "Dashboard", href: "/candidate" }];

  const crumbs: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/candidate" }];
  if (segments.length === 1) return crumbs;

  const section = segments[1];
  const label = BREADCRUMB_LABELS[section] ?? section;
  crumbs.push({ label });
  return crumbs;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function CandidateTopbar({
  fullName,
  email,
  completionPercentage,
  pictureUrl,
  notificationProps,
}: {
  fullName: string;
  email: string;
  completionPercentage: number;
  pictureUrl: string | null;
  notificationProps: {
    role: "candidate";
    notificationsPath: string;
    unreadCount: number;
    preview: NotificationPreviewItem[];
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const breadcrumbs = getBreadcrumbs(pathname);
  const firstName = fullName.split(" ")[0];

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] shrink-0 flex-col justify-center gap-3 border-b border-zinc-200/60 bg-white/70 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:px-6 dark:border-zinc-800/60 dark:bg-zinc-950/70">
      <div className="flex items-center gap-3 lg:hidden">
        <CandidateMobileNav
          fullName={fullName}
          email={email}
          completionPercentage={completionPercentage}
          pictureUrl={pictureUrl}
        />
      </div>

      <div className="hidden min-w-0 flex-1 lg:block">
        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
          {getGreeting()}, {firstName} 👋
        </p>
        <nav aria-label="Breadcrumb" className="mt-0.5 flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <span className="text-zinc-300 dark:text-zinc-700">/</span> : null}
              {crumb.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="font-medium text-zinc-500 transition-colors hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSearch} className="relative hidden max-w-sm flex-1 md:block lg:max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs…"
          aria-label="Search jobs"
          className="h-10 w-full rounded-xl border border-zinc-200/80 bg-white/90 pr-4 pl-10 text-sm text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus-visible:border-violet-400 focus-visible:ring-4 focus-visible:ring-violet-500/10 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-100"
        />
      </form>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <ThemeToggle />
        <NotificationBellMenu {...notificationProps} />
        <div className="hidden sm:block">
          <CandidateAvatar name={fullName} pictureSrc={pictureUrl} size="sm" />
        </div>
        <form action={logout}>
          <button type="submit" className={`${BTN_OUTLINE} hidden h-10 sm:inline-flex`}>
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
