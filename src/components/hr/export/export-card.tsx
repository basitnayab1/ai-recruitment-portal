import type { ReactNode } from "react";
import { SURFACE_CARD } from "@/lib/ui/classes";

export function ExportCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className={`${SURFACE_CARD} p-5 sm:p-6`}>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
      <div className="mt-4">{children}</div>
    </article>
  );
}
