import "server-only";

import { Resend } from "resend";
import { getEmailConfig } from "@/lib/email/config";

let cachedClient: Resend | null = null;

/**
 * Returns a cached Resend client when email is configured. Server-only —
 * never import from Client Components.
 */
export function getResendClient(): Resend | null {
  const config = getEmailConfig();
  if (!config.enabled) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new Resend(process.env.RESEND_API_KEY);
  }

  return cachedClient;
}
