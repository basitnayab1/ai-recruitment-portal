import "server-only";

/**
 * Canonical app origin for auth email redirects.
 * Never trust Host / X-Forwarded-Host alone (header injection risk).
 */
export function getTrustedSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // fall through
    }
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL must be set to a valid absolute URL for auth email redirects."
  );
}
