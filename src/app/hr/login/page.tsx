import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getHRProfile } from "@/lib/auth/dal";
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
  // Already an authorized HR/admin user? Skip straight to the dashboard.
  const profile = await getHRProfile();
  if (profile) {
    redirect("/hr");
  }

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            HR Portal
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to manage recruitment for the AI Recruitment Portal.
          </p>
        </div>
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
        <LoginForm />
      </div>
    </div>
  );
}
