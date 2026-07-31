import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 outline-none focus-visible:ring-4 aria-invalid:ring-destructive/20 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-violet-600 to-violet-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(124,58,237,0.35)] hover:from-violet-500 hover:to-violet-600 focus-visible:ring-violet-500/30",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:from-red-400 hover:to-red-500 focus-visible:ring-red-500/30",
        outline:
          "border border-zinc-200/80 bg-transparent hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-700 focus-visible:ring-violet-500/10 dark:border-zinc-700 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10",
        secondary:
          "border border-zinc-200/80 bg-white text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
        ghost: "hover:bg-violet-50/50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300",
        link: "text-violet-600 underline-offset-4 hover:underline dark:text-violet-400",
      },
      size: {
        default: "h-11 px-5 py-2 has-[>svg]:px-4",
        sm: "h-9 rounded-xl gap-1.5 px-3.5 has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-7 has-[>svg]:px-5",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
