import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureCandidateProfile } from "@/lib/candidate-auth/ensure-profile";

const DEFAULT_NEXT = "/candidate";

function loginPathFor(next: string): string {
  return next.startsWith("/hr") ? "/hr/login" : "/candidate/login";
}

function withError(loginPath: string, message: string): string {
  return `${loginPath}?error=${encodeURIComponent(message)}`;
}

/**
 * Supabase email-confirmation landing route.
 *
 * IMPORTANT — how Supabase actually delivers this link (as configured in
 * this project): the "Confirm signup" email does **not** link directly to
 * this route. It links to Supabase's own hosted endpoint:
 *
 *   https://PROJECT.supabase.co/auth/v1/verify?token=pkce_xxx&type=signup&redirect_to=<our emailRedirectTo>
 *
 * Supabase verifies the PKCE `token` server-side on *their* domain, then
 * 302-redirects the browser to our `redirect_to` (the `emailRedirectTo` we
 * pass to `signUp()` — see `src/lib/candidate-auth/actions.ts`), appending
 * either:
 *   - `?code=<auth-code>` on success — we must exchange this for a session
 *     with `exchangeCodeForSession()`, or
 *   - `?error=...&error_code=...&error_description=...` on failure (e.g.
 *     an expired/already-used link) — Supabase has already given up, there
 *     is nothing left here to verify.
 *
 * The previous implementation only handled a `token_hash` + `type` pair,
 * which is the shape used by a *different* Supabase flow (linking directly
 * to this route with `{{ .TokenHash }}`, bypassing Supabase's hosted
 * verify step entirely). That shape never appears with this project's
 * actual email template, so `token_hash` was always `null` and every
 * confirmation hit the "missing required information" branch — the code
 * was written for a flow this app doesn't use, not the PKCE `code`/`error`
 * redirect it actually receives.
 *
 * This route now handles all three shapes it may realistically receive:
 * `code` (PKCE, the real-world case above), `token_hash` + `type` (kept
 * for compatibility, in case the email template is ever reconfigured to
 * link here directly), and `error` (surfaced from Supabase as a friendly
 * message instead of being misreported as "missing information").
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? DEFAULT_NEXT;
  const fallbackLoginPath = loginPathFor(next);

  const supabaseError = searchParams.get("error");
  const supabaseErrorDescription = searchParams.get("error_description");

  if (supabaseError) {
    redirect(
      withError(
        fallbackLoginPath,
        supabaseErrorDescription ||
          "This confirmation link is invalid or has expired. Please sign in, or sign up again to request a new one."
      )
    );
  }

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!code && !(token_hash && type)) {
    redirect(
      withError(fallbackLoginPath, "This confirmation link is missing required information.")
    );
  }

  const supabase = await createClient();

  const { error: sessionError } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: token_hash as string });

  if (sessionError) {
    redirect(
      withError(
        fallbackLoginPath,
        "This confirmation link is invalid or has expired. Please sign in, or sign up again to request a new one."
      )
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    redirect(withError(fallbackLoginPath, "We couldn't confirm your account. Please try signing in."));
  }

  // HR accounts are always provisioned server-side (never via this public
  // confirmation link), but check first anyway so this route can never
  // mistakenly touch candidate data for an HR account.
  const { data: hrProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (hrProfile) {
    redirect("/hr");
  }

  // Supabase's hosted verify redirect doesn't forward `type` back to us
  // (only `code`/`next` survive the round trip), so we can't gate this on
  // `type === "signup"`. Instead: only candidates ever reach this route
  // without an HR profile, so if they also don't have a candidate profile
  // yet, this is their first authenticated request — finish provisioning
  // it now instead of waiting for a second, separate login.
  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!candidateProfile) {
    await ensureCandidateProfile(supabase, user);
  }

  redirect("/candidate");
}
