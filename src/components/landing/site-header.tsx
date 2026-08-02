import Link from "next/link";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { getLandingAuthState, type LandingAuthState } from "@/lib/public/landing-auth";
import { logout as candidateLogout } from "@/lib/candidate-auth/actions";
import { logout as hrLogout } from "@/lib/auth/actions";
import { RB_BTN_PRIMARY } from "@/lib/ui/premium";

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
          className="text-sm font-medium text-zinc-300 transition-colors hover:text-white"
        >
          Dashboard
        </Link>
        <Link
          href="/candidate/profile"
          className="text-sm font-medium text-zinc-300 transition-colors hover:text-white"
        >
          Profile
        </Link>
        <form action={candidateLogout}>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-zinc-200 backdrop-blur transition-colors hover:bg-white/10"
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
        <Link href="/hr" className={`${RB_BTN_PRIMARY} h-10 px-4`}>
          HR Dashboard
        </Link>
        <form action={hrLogout}>
          <button
            type="submit"
            className="text-sm font-medium text-zinc-300 transition-colors hover:text-white"
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
        className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
      >
        HR Login
      </Link>
      <Link
        href="/candidate/login"
        className="text-sm font-medium text-zinc-300 transition-colors hover:text-white"
      >
        Sign in
      </Link>
      <Link href="/candidate/signup" className={`${RB_BTN_PRIMARY} h-10 px-5`}>
        Get Started
      </Link>
    </div>
  );
}

export async function SiteHeader() {
  const auth = await getLandingAuthState();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06060a]/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-sm font-bold text-white shadow-[0_0_24px_rgba(167,139,250,0.45)]">
            AI
          </span>
          <span className="text-base font-semibold tracking-tight text-white">RecruitAI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {LANDING_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
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
