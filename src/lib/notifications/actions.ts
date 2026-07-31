"use server";

import { revalidatePath } from "next/cache";
import { requireHRUser } from "@/lib/auth/dal";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isNotificationRole, type NotificationRole } from "@/lib/notifications/types";

function revalidateNotificationPaths(role: NotificationRole) {
  if (role === "hr") {
    revalidatePath("/hr");
    revalidatePath("/hr/notifications");
    return;
  }

  revalidatePath("/candidate");
  revalidatePath("/candidate/notifications");
}

async function requireNotificationUser(role: NotificationRole): Promise<string> {
  if (role === "hr") {
    const profile = await requireHRUser();
    return profile.id;
  }

  const profile = await requireCandidateUser();
  return profile.id;
}

export async function markNotificationReadAction(
  notificationId: string,
  role: NotificationRole
): Promise<void> {
  if (!notificationId || !isNotificationRole(role)) {
    return;
  }

  const userId = await requireNotificationUser(role);
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .eq("role", role);

  if (error) {
    console.error("[notifications/actions] Failed to mark notification read:", error.message);
    return;
  }

  revalidateNotificationPaths(role);
}

export async function markAllNotificationsReadAction(role: NotificationRole): Promise<void> {
  if (!isNotificationRole(role)) {
    return;
  }

  const userId = await requireNotificationUser(role);
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("role", role)
    .eq("is_read", false);

  if (error) {
    console.error("[notifications/actions] Failed to mark all notifications read:", error.message);
    return;
  }

  revalidateNotificationPaths(role);
}
