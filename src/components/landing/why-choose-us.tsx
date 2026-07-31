"use client";

import { motion } from "framer-motion";
import { Brain, ShieldCheck, Zap, LineChart } from "lucide-react";
import { SURFACE_CARD_INTERACTIVE } from "@/lib/ui/classes";

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Matched Roles",
    description:
      "Our screening engine reads every application against real job criteria, so you spend less time guessing and more time interviewing.",
  },
  {
    icon: Zap,
    title: "Real-Time Tracking",
    description:
      "Follow every application from submitted to hired with a live status timeline — no more wondering where you stand.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Design",
    description:
      "Your data is protected with row-level security and encrypted storage — your resume and profile stay private, always.",
  },
  {
    icon: LineChart,
    title: "Built for Growth",
    description:
      "A single profile that gets stronger over time — complete it once, apply everywhere, and track your progress as you grow.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Why Choose RecruitAI
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            A modern hiring experience, built for both candidates and recruiting teams.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group p-6 transition-all hover:-translate-y-1 ${SURFACE_CARD_INTERACTIVE}`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white transition-transform group-hover:scale-110">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
