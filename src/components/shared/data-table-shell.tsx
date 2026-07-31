import type { ReactNode } from "react";
import { SURFACE_CARD, TABLE_WRAPPER } from "@/lib/ui/classes";

export function DataTableShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className={`${SURFACE_CARD} overflow-hidden`}>
      <div className={TABLE_WRAPPER}>{children}</div>
      {footer}
    </div>
  );
}
