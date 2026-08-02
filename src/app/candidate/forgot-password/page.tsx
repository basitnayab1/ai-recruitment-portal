import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
import { PremiumShell } from "@/components/atmosphere/premium-shell";
import { ForgotPasswordForm } from "@/components/candidate/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | AI Recruitment Portal",
  description: "Reset your candidate account password.",
};

export default async function CandidateForgotPasswordPage() {
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
            <h1 className="text-3xl font-semibold tracking-tight text-white">Forgot password?</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </PremiumShell>
  );
}
