import Link from "next/link";
import { formatDisplayYear } from "@/lib/format/display-dates";

const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "For Candidates",
    links: [
      { label: "Browse Jobs", href: "/jobs" },
      { label: "Create Account", href: "/candidate/signup" },
      { label: "Sign In", href: "/candidate/login" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Companies", href: "/#companies" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Employers",
    links: [
      { label: "HR Portal Sign In", href: "/hr/login" },
      { label: "HR Dashboard", href: "/hr" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                AI
              </span>
              <span className="text-base font-semibold tracking-tight text-white">RecruitAI</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
              A cinematic AI recruitment platform connecting talent with opportunity.
            </p>
          </div>

          {FOOTER_LINKS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-[11px] font-semibold tracking-[0.18em] text-zinc-300 uppercase">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 transition-colors hover:text-violet-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-zinc-500">&copy; {formatDisplayYear()} RecruitAI. All rights reserved.</p>
          <p className="text-[11px] font-medium tracking-[0.18em] text-zinc-500 uppercase">
            Inspired by immersive UI craft
          </p>
        </div>
      </div>
    </footer>
  );
}
