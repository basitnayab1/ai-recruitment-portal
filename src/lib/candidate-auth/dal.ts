import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/candidate-auth/next-path";

export type CandidateProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
};

// Row shape from `candidate_profiles`. Manually typed since DB types have
// not been generated yet (`supabase gen types typescript`); replace with
// the generated `Database` type when available. See the same note in
// `src/lib/auth/dal.ts`.
type CandidateProfileRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
};

/**
 * Authoritative, server-only check for "is the current request from a
 * logged-in candidate?". Completely independent of `src/lib/auth/dal.ts`
 * (HR) — this only ever reads `candidate_profiles`, never `profiles`, so an
 * HR session never grants candidate access and vice versa.
 *
 * The role is never read from the client or the JWT — it is always
 * re-fetched from `candidate_profiles`, protected by that table's RLS.
 * Memoized with React `cache()` so multiple calls within the same request
 * only hit the database once.
 */
export const getCandidateProfile = cache(async (): Promise<CandidateProfile | null> => {
  try {
    const supabase = await createClient();

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;

    if (claimsError || !userId) {
      return null;
    }

    const { data, error } = await supabase
      .from("candidate_profiles")
      .select("id, email, full_name, phone, role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    const profile = data as CandidateProfileRow;

    if (profile.role !== "candidate") {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
    };
  } catch {
    // Fail closed: any unexpected error is treated as "not authorized".
    return null;
  }
});

/**
 * Use at the top of every protected `/candidate` route. Redirects to
 * `/candidate/login` if the visitor is not an authenticated candidate;
 * otherwise returns their profile.
 *
 * When `nextPath` is given (e.g. a job detail page gating "Apply Now"),
 * it's appended as `?next=` so the candidate lands back where they started
 * right after signing in — validated via `sanitizeNextPath` so it can never
 * be used for an open redirect.
 */
export async function requireCandidateUser(nextPath?: string): Promise<CandidateProfile> {
  const profile = await getCandidateProfile();

  if (!profile) {
    const target = nextPath
      ? `/candidate/login?next=${encodeURIComponent(sanitizeNextPath(nextPath))}`
      : "/candidate/login";
    redirect(target);
  }

  return profile;
}
