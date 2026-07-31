import "server-only";

import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Ensures a `candidate_profiles` row exists for the given authenticated
 * user, creating (or refreshing) it if missing. Shared by:
 *   - the candidate `login` Server Action (covers signups made while email
 *     confirmation was pending), and
 *   - the `/auth/confirm` route (so a freshly-confirmed candidate lands on
 *     `/candidate` fully set up, without needing to log in a second time).
 *
 * `role` is always hard-coded to `"candidate"` here — never read from the
 * client or from auth metadata. Runs through the caller's own RLS-scoped
 * Supabase client (never the service-role key), so this can only ever
 * write the caller's own row (`auth.uid() = id`).
 */
export async function ensureCandidateProfile(
  supabase: SupabaseServerClient,
  user: User
): Promise<{ error: string | null }> {
  if (!user.email) {
    return { error: "Authenticated user has no email address." };
  }

  const metadataFullName = user.user_metadata?.full_name;
  const fullName =
    typeof metadataFullName === "string" && metadataFullName.trim().length > 0
      ? metadataFullName.trim()
      : user.email.split("@")[0];

  const { error } = await supabase.from("candidate_profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      role: "candidate",
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("[ensureCandidateProfile] candidate_profiles upsert failed:", {
      query: "candidate_profiles.upsert(onConflict: id)",
      userId: user.id,
      email: user.email,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  return { error: error ? error.message : null };
}
