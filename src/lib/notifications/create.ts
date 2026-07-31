import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationRole } from "@/lib/notifications/types";

export type CreateNotificationInput = {
  userId: string;
  role: NotificationRole;
  title: string;
  message: string;
  type: string;
  referenceId?: string | null;
  referenceType?: string | null;
};

/**
 * Inserts one or more in-app notifications via the service-role client.
 * Each input produces its own row — never reuse or share rows across users.
 * Never throws — failures are logged only so Server Actions keep working.
 */
export async function createNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  const rows = inputs
    .map((input) => ({
      user_id: input.userId,
      role: input.role,
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type,
      reference_id: input.referenceId ?? null,
      reference_type: input.referenceType ?? null,
      is_read: false,
    }))
    .filter((row) => row.user_id && row.title && row.message && row.type);

  if (rows.length === 0) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("notifications").insert(rows);

    if (error) {
      console.error("[notifications] Failed to create notifications:", error.message, {
        count: rows.length,
        type: rows[0]?.type,
      });
    }
  } catch (error) {
    console.error("[notifications] Failed to create notifications.", {
      error: error instanceof Error ? error.message : String(error),
      count: rows.length,
    });
  }
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await createNotifications([input]);
}
