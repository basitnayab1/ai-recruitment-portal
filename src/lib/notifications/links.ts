import type { NotificationRole } from "@/lib/notifications/types";

export type NotificationLinkItem = {
  referenceId: string | null;
  referenceType: string | null;
};

export function getNotificationHref(
  item: NotificationLinkItem,
  role: NotificationRole
): string {
  if (role === "candidate") {
    if (item.referenceType === "interview") {
      return "/candidate/interviews";
    }
    return "/candidate/applications";
  }

  if (item.referenceType === "application" && item.referenceId) {
    return `/hr/applications/${item.referenceId}`;
  }

  return "/hr/applications";
}
