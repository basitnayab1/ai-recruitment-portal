"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Sparkles } from "lucide-react";
import type { LandingAuthState } from "@/lib/public/landing-auth";
import type { FeaturedJob, LandingStats } from "@/lib/public/landing-data";
import { HeroIllustration } from "@/components/landing/hero-illustration";
import {
  RB_BTN_GHOST,
  RB_BTN_PRIMARY,
  RB_EYEBROW,
  RB_GLASS_STRONG,
  RB_SUBTITLE,
} from "@/lib/ui/premium";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({
  auth,
  stats,
  featuredJobs,
}: {
  auth: LandingAuthState;
  stats: LandingStats;
  featuredJobs: FeaturedJob[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  const primaryCtaHref =
    auth.kind === "candidate" ? "/candidate" : auth.kind === "hr" ? "/hr" : "/candidate/signup";
  const primaryCtaLabel =
    auth.kind === "candidate"
      ? "Go to Dashboard"
      : auth.kind === "hr"
        ? "HR Dashboard"
        : "Create Account";

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (title.trim()) params.set("q", title.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/jobs${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  return (
    <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden">
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className={RB_EYEBROW}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
            AI Recruitment Experience
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
            className="mt-7 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
          >
            Hire and get hired
            <br />
            <span className="rb-gradient-text">with cinematic AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16, ease: EASE }}
            className={`mt-6 max-w-xl ${RB_SUBTITLE}`}
          >
            An immersive hiring workspace — AI matching, live pipelines, and a candidate
            experience that feels as premium as the product you&apos;re building.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24, ease: EASE }}
            onSubmit={handleSearch}
            role="search"
            aria-label="Search jobs"
            className={`mt-9 flex flex-col gap-2 p-2 sm:flex-row ${RB_GLASS_STRONG}`}
          >
            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Job title or keyword"
                aria-label="Job title or keyword"
                className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
              />
            </label>
            <div className="hidden w-px self-stretch bg-white/10 sm:block" />
            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location"
                aria-label="Location"
                className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
              />
            </label>
            <button type="submit" className={`${RB_BTN_PRIMARY} h-11 px-5`}>
              Search
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.32, ease: EASE }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link href={primaryCtaHref} className={RB_BTN_PRIMARY}>
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/jobs" className={RB_BTN_GHOST}>
              Browse open roles
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.18, ease: EASE }}
          className="relative hidden lg:block"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-10 -z-10 rounded-[2.5rem] bg-gradient-to-br from-violet-500/30 via-fuchsia-500/10 to-cyan-400/20 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="overflow-hidden rounded-[1.75rem] border border-white/15 shadow-[0_30px_100px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          >
            <HeroIllustration stats={stats} featuredJobs={featuredJobs} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
