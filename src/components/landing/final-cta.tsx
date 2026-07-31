"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { LandingAuthState } from "@/lib/public/landing-auth";

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
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-16 text-center sm:px-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to find your next opportunity?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Create your free account today and start applying to real, live roles in minutes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={signupHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:scale-105"
            >
              {signupLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Browse Jobs
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
