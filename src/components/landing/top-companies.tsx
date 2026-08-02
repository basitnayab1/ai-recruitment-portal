"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { FadeReveal } from "@/components/react-bits/fade-reveal";
import { RB_GLASS, RB_SECTION, RB_SUBTITLE } from "@/lib/ui/premium";

// This schema doesn't yet model separate employer/company accounts (jobs
// belong to a single hiring organization), so there is no real "top
// companies" data to show. Per spec, this renders an honest, generic
// placeholder grid rather than fabricating brand names — swap this for
// real employer logos once a company entity exists.
const PLACEHOLDER_SLOTS = Array.from({ length: 6 }, (_, index) => index);

export function TopCompanies() {
  return (
    <section id="companies" className={`scroll-mt-20 ${RB_SECTION}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Trusted by Growing Teams
          </h2>
          <p className={`mt-4 ${RB_SUBTITLE}`}>
            Employer branding coming soon — this is where our hiring partners will appear.
          </p>
        </FadeReveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PLACEHOLDER_SLOTS.map((slot, index) => (
            <motion.div
              key={slot}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`${RB_GLASS} flex h-20 items-center justify-center text-zinc-500`}
            >
              <Building2 className="h-7 w-7" aria-hidden="true" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
