"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingAuthState } from "@/lib/public/landing-auth";
import { FadeReveal } from "@/components/react-bits/fade-reveal";
import { RB_BTN_GHOST, RB_BTN_PRIMARY, RB_SECTION } from "@/lib/ui/premium";

export function FinalCTA({ auth }: { auth: LandingAuthState }) {
  const signupHref =
    auth.kind === "candidate" ? "/candidate" : auth.kind === "hr" ? "/hr" : "/candidate/signup";
  const signupLabel =
    auth.kind === "candidate"
      ? "Go to Dashboard"
      : auth.kind === "hr"
        ? "HR Dashboard"
        : "Create Free Account";

  return (
    <section className={RB_SECTION}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeReveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br from-violet-600/40 via-fuchsia-600/25 to-indigo-700/40 p-10 text-center shadow-[0_30px_100px_rgba(91,33,182,0.35)] backdrop-blur-2xl sm:p-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-fuchsia-400/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl"
            />

            <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to find your next opportunity?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-zinc-300">
              Create your free account today and start applying to real, live roles in minutes.
            </p>

            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={signupHref} className={RB_BTN_PRIMARY}>
                {signupLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/jobs" className={RB_BTN_GHOST}>
                Browse Jobs
              </Link>
            </div>
          </div>
        </FadeReveal>
      </div>
    </section>
  );
}
