import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns email addresses of all active HR/admin staff for operational
 * notifications (e.g. new application alerts). Uses the server-only admin
 * client because candidate sessions cannot read the `profiles` table broadly.
 * Falls back to `HR_NOTIFICATION_EMAIL` when set (comma-separated).
 */
export async function getHRNotificationEmails(): Promise<string[]> {
  const fallback = process.env.HR_NOTIFICATION_EMAIL?.split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .in("role", ["hr", "admin"])
      .eq("is_active", true);

    if (error) {
      console.error("[email] Failed to load HR notification recipients:", error.message);
      return fallback ?? [];
    }

    const emails = ((data ?? []) as { email: string }[])
      .map((row) => row.email.trim())
      .filter(Boolean);

    if (emails.length > 0) {
      return emails;
    }
  } catch (error) {
    console.error("[email] Failed to resolve HR notification recipients.", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return fallback ?? [];
}
