import Link from "next/link";
import { getNotificationHref } from "@/lib/notifications/links";
import type { NotificationItem } from "@/lib/notifications/data";
import type { NotificationRole } from "@/lib/notifications/types";
import { markNotificationReadAction } from "@/lib/notifications/actions";
import { NotificationRelativeTime } from "@/components/notifications/notification-relative-time";

export function NotificationsList({
  notifications,
  role,
}: {
  notifications: NotificationItem[];
  role: NotificationRole;
}) {
  return (
    <ul className="divide-y divide-white/[0.06]">
      {notifications.map((notification) => {
        const href = getNotificationHref(notification, role);

        return (
          <li
            key={notification.id}
            className={`flex items-start gap-4 px-6 py-4 ${notification.isRead ? "" : "bg-indigo-500/10"}`}
          >
            <span
              className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? "bg-zinc-600" : "bg-indigo-400"}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={href}
                  className="text-sm font-semibold text-white hover:underline"
                >
                  {notification.title}
                </Link>
                <NotificationRelativeTime
                  createdAt={notification.createdAt}
                  className="text-xs text-zinc-400"
                />
              </div>
              <p className="mt-1 text-sm text-zinc-200">{notification.message}</p>
            </div>
            {!notification.isRead ? (
              <form action={markNotificationReadAction.bind(null, notification.id, role)}>
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.06]"
                >
                  Mark read
                </button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
