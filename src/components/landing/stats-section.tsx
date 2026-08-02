"use client";

import { Briefcase, CalendarCheck, FileText, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { FadeReveal } from "@/components/react-bits/fade-reveal";
import { RB_GLASS, RB_GLASS_HOVER, RB_SECTION } from "@/lib/ui/premium";
import type { LandingStats } from "@/lib/public/landing-data";

type StatsSectionProps = {
  stats: LandingStats;
};

export function StatsSection({ stats }: StatsSectionProps) {
  const items = [
    { icon: Briefcase, label: "Total Jobs", value: stats.totalJobs },
    { icon: Users, label: "Total Candidates", value: stats.totalCandidates },
    { icon: FileText, label: "Total Applications", value: stats.totalApplications },
    { icon: CalendarCheck, label: "Total Interviews", value: stats.totalInterviews },
  ];

  return (
    <section className={RB_SECTION}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <FadeReveal key={item.label} delay={index * 0.06}>
              <div className={`${RB_GLASS} ${RB_GLASS_HOVER} flex flex-col items-center gap-3 p-6 text-center`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/80 to-fuchsia-500/80 text-white shadow-[0_0_24px_rgba(167,139,250,0.35)]">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  <AnimatedCounter value={item.value} />
                </span>
                <span className="text-sm font-medium text-zinc-400">{item.label}</span>
              </div>
            </FadeReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
