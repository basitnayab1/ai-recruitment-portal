import type { ReactNode } from "react";
import { PAGE_DESCRIPTION, PAGE_TITLE } from "@/lib/ui/classes";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-zinc-200/60 pb-8 dark:border-zinc-800/60 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className={PAGE_TITLE}>{title}</h1>
        {description ? <p className={PAGE_DESCRIPTION}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
