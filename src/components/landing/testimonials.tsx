"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { SURFACE_CARD } from "@/lib/ui/classes";

// Illustrative testimonials — no real candidate data or photos are used
// here (this is marketing copy, distinct from the recruitment data shown
// elsewhere on the site, which is always sourced live from Supabase).
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
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            What Candidates Say
          </h2>
        </div>

        <div className="relative mt-12 min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className={`p-8 text-center sm:p-10 ${SURFACE_CARD}`}
            >
              <Quote className="mx-auto h-8 w-8 text-indigo-500" aria-hidden="true" />
              <blockquote className="mt-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                &ldquo;{current.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {current.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{current.role}</p>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            className="rounded-full border border-zinc-300 p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((testimonial, dotIndex) => (
              <button
                key={testimonial.name}
                type="button"
                onClick={() => setIndex(dotIndex)}
                aria-label={`Show testimonial ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  dotIndex === index
                    ? "bg-indigo-600 dark:bg-indigo-400"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className="rounded-full border border-zinc-300 p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
