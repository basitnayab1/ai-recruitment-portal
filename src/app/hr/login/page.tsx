import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getHRProfile } from "@/lib/auth/dal";
import { PremiumShell } from "@/components/atmosphere/premium-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "HR Login | AI Recruitment Portal",
  description: "Sign in to the AI Recruitment Portal HR dashboard.",
};

export default async function HRLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getHRProfile();
  if (profile) {
    redirect("/hr");
  }

  const { error } = await searchParams;

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
            <h1 className="text-3xl font-semibold tracking-tight text-white">HR Portal</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Sign in to manage recruitment for the AI Recruitment Portal.
            </p>
          </div>
          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
            >
              {error}
            </p>
          ) : null}
          <LoginForm />
        </div>
      </div>
    </PremiumShell>
  );
}
