import Link from "next/link";

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
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                AI
              </span>
              <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                RecruitAI
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
              A modern recruitment platform connecting candidates with real opportunities, faster.
            </p>
          </div>

          {FOOTER_LINKS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 sm:flex-row dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            &copy; {new Date().getFullYear()} RecruitAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
