import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-zinc-200/80 via-zinc-100/80 to-zinc-200/80 bg-[length:200%_100%] dark:from-zinc-800/80 dark:via-zinc-700/60 dark:to-zinc-800/80",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
