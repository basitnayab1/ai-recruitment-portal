"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "@/lib/candidate-auth/actions";
import { BTN_PRIMARY, FIELD_INPUT, SURFACE_CARD } from "@/lib/ui/classes";

const initialState: LoginState = undefined;

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className={`space-y-5 p-8 ${SURFACE_CARD}`} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
            Password
          </label>
          <Link
            href="/candidate/forgot-password"
            className="text-xs font-medium text-violet-300 underline underline-offset-2 hover:text-violet-200 hover:no-underline"
          >
            Forgot Password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          placeholder="••••••••"
          className={FIELD_INPUT}
        />
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} aria-busy={pending} className={`${BTN_PRIMARY} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/candidate/signup"
          className="font-medium text-violet-300 underline underline-offset-2 hover:text-violet-200 hover:no-underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
