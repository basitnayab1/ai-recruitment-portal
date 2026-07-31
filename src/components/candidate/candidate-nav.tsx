"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/candidate", label: "Dashboard" },
  { href: "/candidate/applications", label: "Applications" },
  { href: "/candidate/interviews", label: "Interviews" },
  { href: "/candidate/notifications", label: "Notifications" },
  { href: "/candidate/profile", label: "Profile" },
  { href: "/candidate/resume", label: "Resume" },
] as const;

export function CandidateNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Candidate navigation"
      className="flex gap-1 overflow-x-auto border-b border-zinc-200 pb-3 dark:border-zinc-800"
    >
      {links.map((link) => {
        const isActive =
          link.href === "/candidate"
            ? pathname === "/candidate"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
