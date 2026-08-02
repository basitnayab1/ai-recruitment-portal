"use client";

import type { ReactNode } from "react";
import { CursorSpotlight } from "@/components/atmosphere/cursor-spotlight";
import { MeshAtmosphere } from "@/components/atmosphere/mesh-atmosphere";

type PremiumShellProps = {
  children: ReactNode;
  /** soft = dashboards; full = marketing / auth */
  intensity?: "full" | "soft";
  className?: string;
};

/**
 * One cohesive ReactBits-inspired atmosphere wrapper for the whole product.
 */
export function PremiumShell({
  children,
  intensity = "full",
  className,
}: PremiumShellProps) {
  return (
    <div className={`relative min-h-full flex-1 text-zinc-100 ${className ?? ""}`}>
      <MeshAtmosphere intensity={intensity} />
      <CursorSpotlight
        size={intensity === "full" ? 560 : 420}
        color={
          intensity === "full"
            ? "rgba(167, 139, 250, 0.18)"
            : "rgba(139, 92, 246, 0.10)"
        }
      />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
    </div>
  );
}
