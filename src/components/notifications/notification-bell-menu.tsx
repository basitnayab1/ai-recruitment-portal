"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getNotificationHref } from "@/lib/notifications/links";
import type { NotificationRole } from "@/lib/notifications/types";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import { NotificationRelativeTime } from "@/components/notifications/notification-relative-time";
import { SURFACE_CARD } from "@/lib/ui/classes";

export type NotificationPreviewItem = {
  id: string;
  title: string;
  message: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBellMenu({
  role,
  notificationsPath,
  preview,
  unreadCount,
}: {
  role: NotificationRole;
  notificationsPath: string;
  preview: NotificationPreviewItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 text-zinc-600 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-gradient-to-b from-violet-500 to-violet-600 px-1 text-[10px] font-bold text-white shadow-md shadow-violet-500/40">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={`absolute right-0 z-50 mt-2 w-[min(100vw-2rem,24rem)] overflow-hidden shadow-lg ${SURFACE_CARD}`}>
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifications</h2>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsReadAction.bind(null, role)}>
                <button
                  type="submit"
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Mark all read
                </button>
              </form>
            ) : null}
          </div>

          {preview.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">No notifications yet</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Updates about applications and interviews will appear here.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
              {preview.map((notification) => {
                const href = getNotificationHref(notification, role);

                return (
                  <li key={notification.id} className={notification.isRead ? "bg-white dark:bg-zinc-950" : "bg-indigo-50/40 dark:bg-indigo-950/20"}>
                    <div className="flex items-start gap-3 px-4 py-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-zinc-300 dark:bg-zinc-700" : "bg-indigo-500"}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          className="block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                        >
                          {notification.title}
                        </Link>
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                          <NotificationRelativeTime createdAt={notification.createdAt} />
                        </p>
                      </div>
                      {!notification.isRead ? (
                        <form action={markNotificationReadAction.bind(null, notification.id, role)}>
                          <button
                            type="submit"
                            className="shrink-0 text-[10px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                          >
                            Mark read
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <Link
              href={notificationsPath}
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
