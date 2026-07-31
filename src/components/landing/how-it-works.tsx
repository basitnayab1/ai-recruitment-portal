"use client";

import { motion } from "framer-motion";
import { UserPlus, UserCheck, FileUp, Send, Activity, Trophy } from "lucide-react";

const STEPS = [
  { icon: UserPlus, title: "Create Account", description: "Sign up in seconds with just your email." },
  { icon: UserCheck, title: "Complete Profile", description: "Add your contact and professional details." },
  { icon: FileUp, title: "Upload Resume", description: "Give recruiters the full picture of your experience." },
  { icon: Send, title: "Apply", description: "Submit applications to roles that match your goals." },
  { icon: Activity, title: "Track Application", description: "Watch your status update in real time." },
  { icon: Trophy, title: "Get Hired", description: "Receive your offer and start your next chapter." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-zinc-50/60 py-24 dark:bg-zinc-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            From sign-up to offer letter — a clear path, every step of the way.
          </p>
        </div>

        <div className="relative mt-16">
          <div
            aria-hidden="true"
            className="absolute top-6 left-6 hidden h-[calc(100%-3rem)] w-px bg-zinc-200 lg:left-1/2 lg:block lg:h-px lg:w-[calc(100%-3rem)] lg:top-6 dark:bg-zinc-800"
          />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-6 lg:gap-6">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center"
              >
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/25">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="lg:mt-2">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
