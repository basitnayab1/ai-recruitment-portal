"use client";

import { useSyncExternalStore } from "react";
import { formatRelativeTime } from "@/lib/hr/format";

/** UTC-stable absolute label — identical output on server and client. */
function formatNotificationTimestampUtc(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function subscribe(onStoreChange: () => void): () => void {
  const id = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(id);
}

/**
 * Renders a notification timestamp without hydration mismatches.
 * SSR uses a fixed UTC absolute time; relative copy updates on the client.
 */
export function NotificationRelativeTime({
  createdAt,
  className,
}: {
  createdAt: string;
  className?: string;
}) {
  const label = useSyncExternalStore(
    subscribe,
    () => formatRelativeTime(createdAt),
    () => formatNotificationTimestampUtc(createdAt)
  );

  return <span className={className}>{label}</span>;
}
