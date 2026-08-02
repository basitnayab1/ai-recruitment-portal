"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { RB_GLASS_STRONG, RB_SECTION } from "@/lib/ui/premium";

const TESTIMONIALS = [
  {
    quote:
      "I could finally see exactly where my application stood instead of refreshing my inbox every day. Landed an offer within three weeks.",
    name: "Amara O.",
    role: "Product Designer",
  },
  {
    quote:
      "The application process felt respectful of my time — one profile, clear next steps, and real updates as my status changed.",
    name: "Daniel K.",
    role: "Backend Engineer",
  },
  {
    quote:
      "As someone switching careers, having a single place to track every application took so much anxiety out of the search.",
    name: "Priya R.",
    role: "Data Analyst",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const current = TESTIMONIALS[index];

  function next() {
    setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  }
  function prev() {
    setIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  return (
    <section className={RB_SECTION}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-violet-300/90 uppercase">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            What Candidates Say
          </h2>
        </div>

        <div className="relative mt-12 min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className={`${RB_GLASS_STRONG} p-8 text-center sm:p-10`}
            >
              <Quote className="mx-auto h-8 w-8 text-violet-300" aria-hidden="true" />
              <blockquote className="mt-4 text-lg leading-relaxed text-zinc-200">
                &ldquo;{current.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6">
                <p className="text-sm font-semibold text-white">{current.name}</p>
                <p className="text-sm text-zinc-400">{current.role}</p>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
