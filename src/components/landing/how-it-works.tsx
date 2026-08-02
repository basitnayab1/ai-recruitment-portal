"use client";

import { UserPlus, UserCheck, FileUp, Send, Activity, Trophy } from "lucide-react";
import { FadeReveal } from "@/components/react-bits/fade-reveal";
import { RB_GLASS, RB_SECTION, RB_SUBTITLE } from "@/lib/ui/premium";

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
    <section id="how-it-works" className={`scroll-mt-20 ${RB_SECTION}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">How It Works</h2>
          <p className={`mt-4 ${RB_SUBTITLE}`}>
            From sign-up to offer letter — a clear path, every step of the way.
          </p>
        </FadeReveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <FadeReveal key={step.title} delay={index * 0.06}>
              <div className={`${RB_GLASS} flex gap-4 p-5`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.35)]">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-violet-300 uppercase">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{step.description}</p>
                </div>
              </div>
            </FadeReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
