"use client";

import { Brain, ShieldCheck, Zap, LineChart } from "lucide-react";
import { FadeReveal } from "@/components/react-bits/fade-reveal";
import { RB_GLASS, RB_GLASS_HOVER, RB_SECTION, RB_SUBTITLE } from "@/lib/ui/premium";

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
    <section className={RB_SECTION}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeReveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-violet-300/90 uppercase">
            Platform
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Why Choose RecruitAI
          </h2>
          <p className={`mt-4 ${RB_SUBTITLE}`}>
            A modern hiring experience, built for both candidates and recruiting teams.
          </p>
        </FadeReveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <FadeReveal key={feature.title} delay={index * 0.08}>
              <div className={`${RB_GLASS} ${RB_GLASS_HOVER} h-full p-6`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_0_28px_rgba(139,92,246,0.4)]">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
              </div>
            </FadeReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
