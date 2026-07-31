"use client";

import { motion } from "framer-motion";
import { Briefcase, CalendarCheck, FileText, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import type { LandingStats } from "@/lib/public/landing-data";

type StatsSectionProps = {
  stats: LandingStats;
};

export function StatsSection({ stats }: StatsSectionProps) {
  const items = [
    { icon: Briefcase, label: "Total Jobs", value: stats.totalJobs, suffix: "" },
    { icon: Users, label: "Total Candidates", value: stats.totalCandidates, suffix: "" },
    { icon: FileText, label: "Total Applications", value: stats.totalApplications, suffix: "" },
    { icon: CalendarCheck, label: "Total Interviews", value: stats.totalInterviews, suffix: "" },
  ];

  return (
    <section className="border-y border-zinc-200 bg-zinc-50/60 py-16 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
                <AnimatedCounter value={item.value} suffix={item.suffix} />
              </span>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
