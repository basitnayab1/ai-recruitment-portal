import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
import { sanitizeNextPath } from "@/lib/candidate-auth/next-path";
import { PremiumShell } from "@/components/atmosphere/premium-shell";
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
    <PremiumShell intensity="full" className="rb-page">
      <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_28px_rgba(139,92,246,0.45)]">
              <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-zinc-400">Sign in to track your job applications.</p>
          </div>
          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
            >
              {error}
            </p>
          ) : null}
          <LoginForm next={next} />
        </div>
      </div>
    </PremiumShell>
  );
}
