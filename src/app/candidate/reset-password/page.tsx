import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { PremiumShell } from "@/components/atmosphere/premium-shell";
import { ResetPasswordForm } from "@/components/candidate/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | AI Recruitment Portal",
  description: "Choose a new password for your candidate account.",
};

export default async function CandidateResetPasswordPage() {
  // Recovery email establishes a session via /auth/confirm before landing here.
  await requireCandidateUser("/candidate/reset-password");

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
            <h1 className="text-3xl font-semibold tracking-tight text-white">Set a new password</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Choose a strong password to secure your candidate account.
            </p>
          </div>
          <ResetPasswordForm />
        </div>
      </div>
    </PremiumShell>
  );
}
