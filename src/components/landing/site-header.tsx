import Link from "next/link";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { getLandingAuthState, type LandingAuthState } from "@/lib/public/landing-auth";
import { logout as candidateLogout } from "@/lib/candidate-auth/actions";
import { logout as hrLogout } from "@/lib/auth/actions";

export const LANDING_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#companies", label: "Companies" },
  { href: "/#faq", label: "FAQ" },
] as const;

function HeaderActions({ auth }: { auth: LandingAuthState }) {
  if (auth.kind === "candidate") {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/candidate"
          className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          Dashboard
        </Link>
        <Link
          href="/candidate/profile"
          className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          Profile
        </Link>
        <form action={candidateLogout}>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Log out
          </button>
        </form>
      </div>
    );
  }

  if (auth.kind === "hr") {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/hr"
          className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          HR Dashboard
        </Link>
        <form action={hrLogout}>
          <button
            type="submit"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            Log out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      <Link
        href="/hr/login"
        className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        HR Login
      </Link>
      <Link
        href="/candidate/login"
        className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
      >
        Sign in
      </Link>
      <Link
        href="/candidate/signup"
        className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Get Started
      </Link>
    </div>
  );
}

export async function SiteHeader() {
  const auth = await getLandingAuthState();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            AI
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            RecruitAI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {LANDING_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <HeaderActions auth={auth} />

        <MobileMenu navLinks={[...LANDING_NAV_LINKS]} auth={auth} />
      </div>
    </header>
  );
}
