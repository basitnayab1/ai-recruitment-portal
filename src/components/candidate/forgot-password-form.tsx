"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  requestCandidatePasswordReset,
  type ForgotPasswordState,
} from "@/lib/candidate-auth/actions";
import { ALERT_ERROR, ALERT_SUCCESS, BTN_PRIMARY, FIELD_INPUT, SURFACE_CARD } from "@/lib/ui/classes";

const initialState: ForgotPasswordState = undefined;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestCandidatePasswordReset, initialState);

  return (
    <form action={formAction} className={`space-y-5 p-8 ${SURFACE_CARD}`} noValidate>
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

      {state?.status === "error" ? (
        <p role="alert" className={ALERT_ERROR}>
          {state.message}
        </p>
      ) : null}

      {state?.status === "success" ? (
        <p role="status" className={ALERT_SUCCESS}>
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} aria-busy={pending} className={`${BTN_PRIMARY} w-full`}>
        {pending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Sending…
          </span>
        ) : (
          "Send reset link"
        )}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Remembered your password?{" "}
        <Link
          href="/candidate/login"
          className="font-medium text-violet-300 underline underline-offset-2 hover:text-violet-200 hover:no-underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
