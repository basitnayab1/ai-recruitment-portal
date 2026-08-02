import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  isNotificationType,
  NOTIFICATION_PREVIEW_LIMIT,
  NOTIFICATIONS_PAGE_SIZE,
  type NotificationRole,
} from "@/lib/notifications/types";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsPage = {
  notifications: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
};

function mapNotificationRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: isNotificationType(row.type) ? row.type : row.type,
    referenceId: row.reference_id,
    referenceType: row.reference_type,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * Every read is scoped to the authenticated user's id AND the active portal
 * role (candidate vs hr). Both HR and candidate profiles use auth.users.id,
 * so user_id alone is not sufficient for isolation when one account holds both
 * roles.
 */
export const getUnreadNotificationCount = cache(
  async (userId: string, role: NotificationRole): Promise<number> => {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", role)
      .eq("is_read", false);

    if (error) {
      console.error("[notifications/data] Failed to count unread notifications:", error.message);
      return 0;
    }

    return count ?? 0;
  }
);

export const getNotificationPreview = cache(
  async (userId: string, role: NotificationRole): Promise<NotificationItem[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, type, reference_id, reference_type, is_read, created_at")
      .eq("user_id", userId)
      .eq("role", role)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_PREVIEW_LIMIT);

    if (error) {
      console.error("[notifications/data] Failed to load notification preview:", error.message);
      return [];
    }

    return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
  }
);

export async function getNotificationsPage(
  userId: string,
  role: NotificationRole,
  page: number
): Promise<NotificationsPage> {
  const supabase = await createClient();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * NOTIFICATIONS_PAGE_SIZE;
  const to = from + NOTIFICATIONS_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("notifications")
    .select("id, title, message, type, reference_id, reference_type, is_read, created_at", {
      count: "exact",
    })
    .eq("user_id", userId)
    .eq("role", role)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[notifications/data] Failed to load notifications page:", error.message);
    return { notifications: [], total: 0, page: safePage, pageSize: NOTIFICATIONS_PAGE_SIZE };
  }

  return {
    notifications: ((data ?? []) as NotificationRow[]).map(mapNotificationRow),
    total: count ?? 0,
    page: safePage,
    pageSize: NOTIFICATIONS_PAGE_SIZE,
  };
}
