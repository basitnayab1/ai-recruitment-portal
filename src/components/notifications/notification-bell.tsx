import {
  getNotificationPreview,
  getUnreadNotificationCount,
} from "@/lib/notifications/data";
import type { NotificationRole } from "@/lib/notifications/types";
import { NotificationBellMenu } from "@/components/notifications/notification-bell-menu";

export async function NotificationBell({
  userId,
  role,
  notificationsPath,
}: {
  userId: string;
  role: NotificationRole;
  notificationsPath: string;
}) {
  const [preview, unreadCount] = await Promise.all([
    getNotificationPreview(userId, role),
    getUnreadNotificationCount(userId, role),
  ]);

  return (
    <NotificationBellMenu
      role={role}
      notificationsPath={notificationsPath}
      unreadCount={unreadCount}
      preview={preview.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        referenceId: notification.referenceId,
        referenceType: notification.referenceType,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      }))}
    />
  );
}
