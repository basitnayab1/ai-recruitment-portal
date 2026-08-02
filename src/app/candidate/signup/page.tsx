import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
import { PremiumShell } from "@/components/atmosphere/premium-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Candidate Sign Up | AI Recruitment Portal",
  description: "Create a candidate account to apply for jobs and track your applications.",
};

export default async function CandidateSignupPage() {
  const profile = await getCandidateProfile();
  if (profile) {
    redirect("/candidate");
  }

  return (
    <PremiumShell intensity="full" className="rb-page">
      <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_28px_rgba(139,92,246,0.45)]"
            >
              <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Create your account</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Sign up to apply for jobs and track your applications.
            </p>
          </div>
          <SignupForm />
        </div>
      </div>
    </PremiumShell>
  );
}
