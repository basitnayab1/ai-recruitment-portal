// Plain utility, deliberately NOT in a "use server" file (those may only
// export async functions) and safe to import from Server Components,
// Server Actions, and the client Login form alike.

/**
 * Only relative, same-origin paths are ever accepted as a post-login
 * redirect target (never `//host`, `http(s)://host`, or a `\`-prefixed
 * value), to prevent an open-redirect via a crafted `next` query/form
 * parameter. Falls back to `/candidate` for anything else.
 */
export function sanitizeNextPath(value: unknown, fallback = "/candidate"): string {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
