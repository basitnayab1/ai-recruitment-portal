import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Active HR/admin profile IDs for broadcast in-app notifications.
 */
export async function getHRNotificationUserIds(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["hr", "admin"])
      .eq("is_active", true);

    if (error) {
      console.error("[notifications] Failed to load HR user ids:", error.message);
      return [];
    }

    return ((data ?? []) as { id: string }[]).map((row) => row.id).filter(Boolean);
  } catch (error) {
    console.error("[notifications] Failed to resolve HR user ids.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
