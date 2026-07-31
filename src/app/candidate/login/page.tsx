import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
import { sanitizeNextPath } from "@/lib/candidate-auth/next-path";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Candidate Login | AI Recruitment Portal",
  description: "Sign in to your candidate account to track your job applications.",
};

export default async function CandidateLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  const profile = await getCandidateProfile();
  if (profile) {
    redirect(sanitizeNextPath(next));
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
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to track your job applications.
          </p>
        </div>
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}
        <LoginForm next={next} />
      </div>
    </div>
  );
}
