import "server-only";

/**
 * Simple in-memory sliding-window rate limiter for server actions.
 * Suitable for single-node / dev; for multi-instance production prefer Redis.
 */

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; message: string };

export function checkRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
}): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const existing = buckets.get(options.key) ?? { timestamps: [] };
  const recent = existing.timestamps.filter((ts) => ts > windowStart);

  if (recent.length >= options.limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
    buckets.set(options.key, { timestamps: recent });
    return {
      ok: false,
      retryAfterSeconds,
      message:
        options.message ??
        `Too many attempts. Please wait ${retryAfterSeconds}s and try again.`,
    };
  }

  recent.push(now);
  buckets.set(options.key, { timestamps: recent });
  return { ok: true };
}

/** Best-effort client key from form / headers when IP is unavailable. */
export function rateLimitKey(scope: string, identifier: string): string {
  const id = identifier.trim().toLowerCase() || "anonymous";
  return `${scope}:${id}`;
}
