"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCandidateProfile } from "@/lib/candidate-auth/ensure-profile";
import { sanitizeNextPath } from "@/lib/candidate-auth/next-path";
import { notifyAccountCreated } from "@/lib/email/notifications";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { getTrustedSiteOrigin } from "@/lib/security/site-origin";

export type SignupState =
  | { status: "error"; message: string }
  | { status: "pending_confirmation"; message: string }
  | undefined;

function friendlySignUpError(message: string): string {
  if (/already registered|already exists|user already/i.test(message)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  return message;
}

/**
 * Server Action backing candidate signup. Runs entirely on the server. The
 * candidate's `role` is always hard-coded to `"candidate"` here — it is
 * never read from the form or trusted from the client.
 *
 * Supabase's own project settings decide whether email confirmation is
 * required:
 *   - If not required, `signUp()` returns an active session immediately,
 *     so the candidate profile is created right away using that session.
 *   - If required, no session exists yet in this request. In that case the
 *     profile is created on first successful login instead (see `login`
 *     below) — still entirely server-side, just deferred until we have an
 *     authenticated context to write with.
 */
export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { status: "error", message: "Please fill in your name, email, and password." };
  }
  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." };
  }

  const signupLimit = checkRateLimit({
    key: rateLimitKey("candidate-signup", email),
    limit: 5,
    windowMs: 60 * 60 * 1000,
    message: "Too many signup attempts. Please try again later.",
  });
  if (!signupLimit.ok) {
    return { status: "error", message: signupLimit.message };
  }

  const supabase = await createClient();
  let origin: string;
  try {
    origin = getTrustedSiteOrigin();
  } catch {
    return {
      status: "error",
      message: "Site URL is not configured. Set NEXT_PUBLIC_SITE_URL and try again.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      // Must match the "Confirm signup" email template in the Supabase
      // dashboard, which should link to `/auth/confirm` with
      // `token_hash`/`type` (Supabase's standard SSR confirmation flow).
      // See src/app/auth/confirm/route.ts.
      emailRedirectTo: `${origin}/auth/confirm?next=/candidate`,
    },
  });

  if (error) {
    return { status: "error", message: friendlySignUpError(error.message) };
  }

  const userId = data.user?.id;
  if (!userId) {
    return {
      status: "error",
      message: "Something went wrong creating your account. Please try again.",
    };
  }

  if (data.session) {
    const { error: profileError } = await supabase.from("candidate_profiles").insert({
      id: userId,
      email,
      full_name: fullName,
      role: "candidate",
    });

    if (profileError) {
      return {
        status: "error",
        message:
          "Your account was created, but we couldn't finish setting up your profile. Please try signing in.",
      };
    }

    await notifyAccountCreated({ email, candidateName: fullName });

    revalidatePath("/");
    redirect("/candidate");
  }

  await notifyAccountCreated({ email, candidateName: fullName });

  return {
    status: "pending_confirmation",
    message: "Check your email to confirm your account, then sign in.",
  };
}

export type LoginState = { error: string } | undefined;

/**
 * Server Action backing candidate login. After a successful sign-in, this
 * also ensures a `candidate_profiles` row exists (covers signups made while
 * email confirmation was pending) via an upsert scoped to the caller's own
 * session — `role` is always hard-coded to `"candidate"`, never supplied by
 * the client.
 *
 * HR/admin accounts are rejected so they cannot obtain a candidate session
 * or create a candidate_profiles row via this portal.
 *
 * Redirects to the `next` hidden field when present (e.g. back to a job
 * detail page after gating "Apply Now"), falling back to `/candidate`.
 * `sanitizeNextPath` ensures this can never become an open redirect.
 */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Please enter both your email and password." };
  }

  const loginLimit = checkRateLimit({
    key: rateLimitKey("candidate-login", email),
    limit: 10,
    windowMs: 15 * 60 * 1000,
    message: "Too many login attempts. Please wait and try again.",
  });
  if (!loginLimit.ok) {
    return { error: loginLimit.message };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: "Invalid email or password." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    await supabase.auth.signOut();
    return { error: "Invalid email or password." };
  }

  // Block HR/admin from the candidate portal (defense in depth).
  const { data: hrProfile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const hrRow = hrProfile as { role: string; is_active: boolean } | null;
  if (
    hrRow &&
    hrRow.is_active &&
    (hrRow.role === "hr" || hrRow.role === "admin")
  ) {
    await supabase.auth.signOut();
    return { error: "This account is for the HR portal. Please sign in at /hr/login." };
  }

  const { error: profileError } = await ensureCandidateProfile(supabase, user);

  if (profileError) {
    console.error("[candidate-login] ensureCandidateProfile failed:", profileError);
    await supabase.auth.signOut();
    return { error: "Something went wrong setting up your account. Please try again." };
  }

  redirect(next);
}

/**
 * Server Action for logging out. Clears the Supabase session cookie and
 * redirects back to the candidate login page.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/candidate/login");
}
