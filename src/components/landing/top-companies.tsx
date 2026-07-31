"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

// This schema doesn't yet model separate employer/company accounts (jobs
// belong to a single hiring organization), so there is no real "top
// companies" data to show. Per spec, this renders an honest, generic
// placeholder grid rather than fabricating brand names — swap this for
// real employer logos once a company entity exists.
const PLACEHOLDER_SLOTS = Array.from({ length: 6 }, (_, index) => index);

export function TopCompanies() {
  return (
    <section id="companies" className="scroll-mt-16 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Trusted by Growing Teams
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Employer branding coming soon — this is where our hiring partners will appear.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PLACEHOLDER_SLOTS.map((slot, index) => (
            <motion.div
              key={slot}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-700"
            >
              <Building2 className="h-7 w-7" aria-hidden="true" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
