"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type SignupState } from "@/lib/candidate-auth/actions";
import { BTN_PRIMARY, FIELD_INPUT, SURFACE_CARD } from "@/lib/ui/classes";

const initialState: SignupState = undefined;

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  if (state?.status === "pending_confirmation") {
    return (
      <div className={`space-y-5 p-8 text-center ${SURFACE_CARD}`}>
        <p className="text-sm text-zinc-300">{state.message}</p>
        <Link href="/candidate/login" className={BTN_PRIMARY}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className={`space-y-5 p-8 ${SURFACE_CARD}`} noValidate>
      <div className="space-y-2">
        <label htmlFor="fullName" className="block text-sm font-medium text-zinc-300">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          disabled={pending}
          placeholder="Jane Doe"
          className={FIELD_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="you@example.com"
          className={FIELD_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          placeholder="At least 8 characters"
          className={FIELD_INPUT}
        />
      </div>

      {state?.status === "error" ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} aria-busy={pending} className={`${BTN_PRIMARY} w-full`}>
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/candidate/login"
          className="font-medium text-violet-300 underline underline-offset-2 hover:text-violet-200 hover:no-underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
