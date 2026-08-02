"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 96,
} as const;

export type CandidateAvatarSize = keyof typeof SIZE_PX;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function DefaultAvatar({
  name,
  size,
  className,
}: {
  name: string;
  size: CandidateAvatarSize;
  className: string;
}) {
  const dimension = SIZE_PX[size];
  const initials = initialsFromName(name);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-zinc-200 ${size === "lg" ? "text-lg font-semibold" : "text-xs font-medium"} ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label={`${name} avatar`}
    >
      {initials.length > 0 ? (
        initials
      ) : (
        <UserRound className={size === "lg" ? "h-10 w-10" : size === "md" ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      )}
    </span>
  );
}

export function CandidateAvatar({
  name,
  pictureSrc,
  size = "md",
  className = "",
}: {
  name: string;
  /** Full signed or public URL — not an app route path. */
  pictureSrc?: string | null;
  size?: CandidateAvatarSize;
  className?: string;
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const dimension = SIZE_PX[size];
  const sharedClassName = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ${className}`;

  if (!pictureSrc || loadFailed) {
    return <DefaultAvatar name={name} size={size} className={className} />;
  }

  return (
    <span
      className={sharedClassName}
      style={{ width: dimension, height: dimension }}
      aria-hidden={name ? undefined : true}
    >
      <Image
        src={pictureSrc}
        alt={`${name}'s profile picture`}
        width={dimension}
        height={dimension}
        className="h-full w-full object-cover"
        loading="lazy"
        // Signed Supabase URLs are already sized for avatars. Skipping the
        // Next image optimizer avoids loading native `sharp` on every profile
        // render — a broken sharp binary was crashing the dev server and
        // causing Server Action "Failed to fetch" on this page.
        unoptimized
        onError={() => setLoadFailed(true)}
      />
    </span>
  );
}
