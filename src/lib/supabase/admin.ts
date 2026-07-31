import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the secret (service-role) key. Bypasses
 * Row Level Security — must NEVER be imported by Client Components or any
 * code reachable from the browser.
 *
 * Only use after an explicit authorization check (e.g. `requireHRUser()`)
 * and after the requested resource has been verified through the normal
 * authenticated client + DB RLS (e.g. confirming HR can read the
 * application's `cv_storage_path`). This pattern keeps Storage object
 * policies strict for candidates while allowing trusted server routes to
 * mint download links for HR staff.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY environment variables."
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
