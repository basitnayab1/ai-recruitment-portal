"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Sparkles } from "lucide-react";
import type { LandingAuthState } from "@/lib/public/landing-auth";
import { HeroIllustration } from "@/components/landing/hero-illustration";
import { BTN_PRIMARY, SURFACE_CARD } from "@/lib/ui/classes";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero({ auth }: { auth: LandingAuthState }) {
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
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-white to-white dark:from-indigo-950/30 dark:via-black dark:to-black"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-10%] -z-10 h-[32rem] w-[32rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-700/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-10%] left-[-10%] -z-10 h-[28rem] w-[28rem] rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-700/20"
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-Powered Recruitment Platform
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeUp}
            className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50"
          >
            Find your next role,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              faster and smarter
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400"
          >
            AI-matched job recommendations, real-time application tracking, and a hiring team
            that actually reviews your profile. Built for candidates who want a better job
            search — and for teams who want better hires.
          </motion.p>

          <motion.form
            initial="hidden"
            animate="visible"
            custom={0.3}
            variants={fadeUp}
            onSubmit={handleSearch}
            role="search"
            aria-label="Search jobs"
            className={`mt-8 flex flex-col gap-2 p-2 shadow-lg shadow-zinc-900/5 backdrop-blur sm:flex-row ${SURFACE_CARD} bg-white/90 dark:bg-zinc-950/90`}
          >
            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Job title or keyword"
                aria-label="Job title or keyword"
                className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-zinc-100"
              />
            </label>
            <div className="hidden w-px self-stretch bg-zinc-200 sm:block dark:bg-zinc-800" />
            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location"
                aria-label="Location"
                className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-zinc-100"
              />
            </label>
            <button type="submit" className={BTN_PRIMARY}>
              Search Jobs
            </button>
          </motion.form>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.4}
            variants={fadeUp}
            className="mt-6 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Browse Jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition-transform hover:scale-[1.03]"
            >
              {primaryCtaLabel}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
}
