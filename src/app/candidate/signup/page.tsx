import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
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
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-[#f8f9fc] px-4 py-16 dark:bg-[#0c0c0f]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.12),transparent)]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
            <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign up to apply for jobs and track your applications.
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
