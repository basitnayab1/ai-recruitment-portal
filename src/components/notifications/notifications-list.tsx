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
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
      {notifications.map((notification) => {
        const href = getNotificationHref(notification, role);

        return (
          <li
            key={notification.id}
            className={`flex items-start gap-4 px-6 py-4 ${notification.isRead ? "" : "bg-indigo-50/30 dark:bg-indigo-950/10"}`}
          >
            <span
              className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? "bg-zinc-300 dark:bg-zinc-700" : "bg-indigo-500"}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={href}
                  className="text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                >
                  {notification.title}
                </Link>
                <NotificationRelativeTime
                  createdAt={notification.createdAt}
                  className="text-xs text-zinc-400 dark:text-zinc-500"
                />
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{notification.message}</p>
            </div>
            {!notification.isRead ? (
              <form action={markNotificationReadAction.bind(null, notification.id, role)}>
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
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
