import { cn } from "@/lib/utils";

/** Subtle dotted / grid plane — Linear/Vercel style, no animation. */
export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10",
        "[background-image:linear-gradient(to_right,rgba(113,113,122,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(113,113,122,0.08)_1px,transparent_1px)]",
        "[background-size:48px_48px]",
        "dark:[background-image:linear-gradient(to_right,rgba(161,161,170,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(161,161,170,0.06)_1px,transparent_1px)]",
        "mask-[linear-gradient(to_bottom,black_20%,transparent_90%)]",
        className
      )}
    />
  );
}
