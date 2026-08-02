import type { ComponentType, SVGProps } from "react";
import { SURFACE_CARD } from "@/lib/ui/classes";

type EmptyStateProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
};

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden px-8 py-20 text-center ${SURFACE_CARD}`}
      role="status"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.06),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 ring-1 ring-violet-500/20">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
          <Icon className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
      </div>
      <h2 className="relative mt-6 text-xl font-bold tracking-tight text-white">
        {title}
      </h2>
      <p className="relative mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
    </div>
  );
}
