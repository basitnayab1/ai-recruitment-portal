import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIX = "/hr";
const LOGIN_PATH = "/hr/login";

/**
 * Refreshes the Supabase auth session on every request and performs an
 * optimistic (cookie-only) redirect for unauthenticated visitors trying to
 * reach a protected `/hr` route. This is a fast pre-filter only — the
 * authoritative HR-role check happens server-side in the Data Access Layer
 * (`src/lib/auth/dal.ts`), which every protected route calls directly.
 *
 * Called from `src/proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables."
    );
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not run other Supabase calls between createServerClient and
  // getClaims() — doing so can cause hard-to-debug random logouts.
  //
  // getClaims() (not getSession()) verifies the JWT signature and refreshes
  // it if needed, writing the refreshed cookies back via setAll above.
  const { data: claimsData } = await supabase.auth.getClaims();

  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname.startsWith(PROTECTED_PREFIX) && pathname !== LOGIN_PATH;

  if (isProtectedRoute && !claimsData?.claims) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith(PROTECTED_PREFIX)) {
    // Auth-sensitive responses must never be cached (by a CDN or the
    // browser), or one user's session could leak to another.
    response.headers.set("Cache-Control", "private, no-store");
  }

  // IMPORTANT: return this exact response object so refreshed cookies are
  // preserved. Creating a new NextResponse here would drop them.
  return response;
}
