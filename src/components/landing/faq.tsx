"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeReveal } from "@/components/react-bits/fade-reveal";
import { RB_GLASS_STRONG, RB_SECTION, RB_SUBTITLE } from "@/lib/ui/premium";

const FAQS = [
  {
    question: "Is it free to create a candidate account?",
    answer:
      "Yes. Creating an account and applying to jobs is always free for candidates — there's no cost to search, apply, or track your applications.",
  },
  {
    question: "How does AI screening affect my application?",
    answer:
      "AI screening helps our hiring team quickly identify strong matches based on the job's actual requirements. A human always reviews shortlisted applications before any decision is made.",
  },
  {
    question: "Can I track the status of my application?",
    answer:
      "Yes. Once you're signed in, your candidate dashboard shows real-time status for every application you've submitted — from received through to a final decision.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Your data is protected with row-level security at the database level, meaning only you and authorized hiring staff can ever access your profile and applications.",
  },
  {
    question: "How do I get started as a candidate?",
    answer:
      "Create a free account, complete your profile, and start applying — your profile stays saved so future applications only take a minute.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className={`scroll-mt-20 ${RB_SECTION}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeReveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className={`mt-4 ${RB_SUBTITLE}`}>
            Everything you need to know before you get started.
          </p>
        </FadeReveal>

        <FadeReveal delay={0.1} className={`mt-12 px-6 ${RB_GLASS_STRONG}`}>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`item-${index}`}
                className="border-white/10"
              >
                <AccordionTrigger className="text-base font-medium text-white hover:no-underline hover:text-violet-200">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-zinc-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeReveal>
      </div>
    </section>
  );
}
