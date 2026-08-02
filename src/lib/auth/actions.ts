"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireHRUser } from "@/lib/auth/dal";
import { validateNewPassword } from "@/lib/auth/password";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

export type LoginState = { error: string } | undefined;

export type ChangePasswordState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

/**
 * Server Action backing the HR login form. Runs entirely on the server:
 * the session cookie is set here via the Supabase server client, never via
 * client-side storage.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter both your email and password." };
  }

  const limit = checkRateLimit({
    key: rateLimitKey("hr-login", email),
    limit: 10,
    windowMs: 15 * 60 * 1000,
    message: "Too many login attempts. Please wait and try again.",
  });
  if (!limit.ok) {
    return { error: limit.message };
  }

  const supabase = await createClient();

  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { error: "Invalid email or password." };
    }

    // Re-verify who just signed in and look up their role directly from the
    // database — never trust a role claimed by the client.
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;

    if (!userId) {
      await supabase.auth.signOut();
      return { error: "Invalid email or password." };
    }

    const { data, error: profileQueryError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", userId)
      .single();

    if (profileQueryError) {
      console.error("[hr-login] profiles SELECT failed:", {
        query: "profiles.select(role, is_active).eq(id).single()",
        userId,
        message: profileQueryError.message,
        code: profileQueryError.code,
        details: profileQueryError.details,
        hint: profileQueryError.hint,
      });
    }

    const profile = data as { role: string; is_active: boolean } | null;
    const isAuthorizedHR =
      !!profile &&
      profile.is_active &&
      (profile.role === "hr" || profile.role === "admin");

    if (!isAuthorizedHR) {
      // Valid Supabase credentials, but no authorized HR profile: don't
      // leave a dangling session behind.
      await supabase.auth.signOut();
      return { error: "This account is not authorized to access the HR portal." };
    }
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/hr");
}

/**
 * Server Action for logging out. Clears the Supabase session cookie and
 * redirects back to the login page.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/hr/login");
}

/**
 * Change the signed-in HR user's password after re-authenticating with the
 * current password via Supabase Auth.
 */
export async function changeHRPassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  try {
    const profile = await requireHRUser();

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { status: "error", message: "Please fill in all password fields." };
    }

    if (newPassword !== confirmPassword) {
      return { status: "error", message: "New password and confirmation do not match." };
    }

    if (newPassword === currentPassword) {
      return {
        status: "error",
        message: "New password must be different from your current password.",
      };
    }

    const policyError = validateNewPassword(newPassword);
    if (policyError) {
      return { status: "error", message: policyError };
    }

    const limit = checkRateLimit({
      key: rateLimitKey("hr-change-password", profile.id),
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many password change attempts. Please wait and try again.",
    });
    if (!limit.ok) {
      return { status: "error", message: limit.message };
    }

    const supabase = await createClient();

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (reauthError) {
      return { status: "error", message: "Current password is incorrect." };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[hr-change-password] updateUser failed:", updateError.message);
      return {
        status: "error",
        message: updateError.message || "Could not update your password. Please try again.",
      };
    }

    return { status: "success", message: "Password updated successfully." };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("[hr-change-password] unexpected error:", error);
    return {
      status: "error",
      message: "Something went wrong while updating your password. Please try again.",
    };
  }
}
