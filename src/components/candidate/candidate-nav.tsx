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
      className="flex gap-1 overflow-x-auto border-b border-white/10 pb-3"
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
                ? "bg-violet-500/15 text-white ring-1 ring-violet-400/30"
                : "text-zinc-200 hover:bg-white/[0.06] hover:text-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
