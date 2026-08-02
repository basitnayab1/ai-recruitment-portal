import type { ReactNode } from "react";
import Link from "next/link";
import { CARD_HEADER, CARD_HEADER_LINK, DASHBOARD_CARD } from "@/lib/ui/classes";

export function DashboardCardShell({
  title,
  href,
  linkLabel = "View all",
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className={DASHBOARD_CARD}>
      <div className={CARD_HEADER}>
        <h2 className="text-base font-bold tracking-tight text-white">{title}</h2>
        {href ? (
          <Link href={href} className={CARD_HEADER_LINK}>
            {linkLabel} →
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}
