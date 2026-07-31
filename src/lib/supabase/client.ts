import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Client Components.
 *
 * This client relies on public, browser-safe credentials only
 * (URL + publishable key) and is safe to call from client-side code.
 *
 * Create a new instance where needed (e.g. inside a component or hook)
 * rather than sharing a single module-level instance across the app.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables."
    );
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
