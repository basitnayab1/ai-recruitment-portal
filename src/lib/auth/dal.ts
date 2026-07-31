import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type HRRole = "hr" | "admin";

export type HRProfile = {
  id: string;
  email: string;
  fullName: string;
  role: HRRole;
};

// Row shape from `profiles`. Manually typed since DB types have not been
// generated yet (`supabase gen types typescript`); replace with the
// generated `Database` type when available.
type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
};

function isHRRole(role: string): role is HRRole {
  return role === "hr" || role === "admin";
}

/**
 * Authoritative, server-only check for "is the current request from a
 * logged-in, active HR/admin user?".
 *
 * The role is NEVER read from the client or from the JWT — it is always
 * re-fetched from the `profiles` table on every call, protected by that
 * table's Row Level Security policies. Memoized with React `cache()` so
 * multiple calls within the same request (e.g. a layout and a page) only
 * hit the database once.
 *
 * Returns `null` if the visitor is unauthenticated, has no profile, or is
 * not an active HR/admin user. Never throws for these cases.
 */
export const getHRProfile = cache(async (): Promise<HRProfile | null> => {
  try {
    const supabase = await createClient();

    // getClaims() verifies the JWT signature (and refreshes it if needed).
    // Never trust getSession() here — it does not verify the token.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;

    if (claimsError || !userId) {
      return null;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .eq("id", userId)
      .single();

    if (profileError || !data) {
      return null;
    }

    const profile = data as ProfileRow;

    if (!profile.is_active || !isHRRole(profile.role)) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
    };
  } catch {
    // Fail closed: any unexpected error (network, misconfiguration, etc.)
    // is treated as "not authorized" rather than leaking to the caller.
    return null;
  }
});

/**
 * Use at the top of every protected `/hr` route (layout or page). Redirects
 * to `/hr/login` if the visitor is not an authenticated, active HR/admin
 * user; otherwise returns their profile.
 */
export async function requireHRUser(): Promise<HRProfile> {
  const profile = await getHRProfile();

  if (!profile) {
    redirect("/hr/login");
  }

  return profile;
}
