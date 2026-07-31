"use client";

import { useEffect, useState } from "react";
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

/**
 * Renders a notification timestamp without hydration mismatches.
 * SSR and the first client paint use a fixed UTC absolute time; relative
 * copy ("5 minutes ago") is applied only after mount via useEffect.
 */
export function NotificationRelativeTime({
  createdAt,
  className,
}: {
  createdAt: string;
  className?: string;
}) {
  const stableLabel = formatNotificationTimestampUtc(createdAt);
  const [label, setLabel] = useState(stableLabel);

  useEffect(() => {
    setLabel(formatRelativeTime(createdAt));
  }, [createdAt]);

  return <span className={className}>{label}</span>;
}
