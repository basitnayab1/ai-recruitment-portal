import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers.
 *
 * Reads/writes auth cookies via Next.js's `cookies()` API. Cookie writes
 * (`setAll`) only succeed inside Server Actions and Route Handlers; calls
 * made during Server Component rendering are safely ignored (Next.js does
 * not allow mutating cookies while rendering), since a Server Action or
 * middleware refreshing the session will set them instead.
 *
 * Must be called fresh on every request — do not cache or reuse the
 * returned client across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables."
    );
  }

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component during rendering, where cookies
          // cannot be set. Safe to ignore if session refresh is handled
          // elsewhere (e.g. middleware or a Server Action).
        }
      },
    },
  });
}
