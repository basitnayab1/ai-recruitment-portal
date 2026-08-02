import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 outline-none focus-visible:ring-4 aria-invalid:ring-destructive/20 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-white text-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(255,255,255,0.16)] hover:bg-zinc-100 focus-visible:ring-violet-500/30",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:from-red-400 hover:to-red-500 focus-visible:ring-red-500/30",
        outline:
          "border border-white/15 bg-transparent text-zinc-200 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200 focus-visible:ring-violet-500/15",
        secondary:
          "border border-white/15 bg-white/[0.04] text-zinc-100 hover:border-white/30 hover:bg-white/[0.08] focus-visible:ring-white/10",
        ghost: "text-zinc-200 hover:bg-white/10 hover:text-white",
        link: "text-violet-300 underline-offset-4 hover:underline hover:text-violet-200",
      },
      size: {
        default: "h-11 px-5 py-2 has-[>svg]:px-4",
        sm: "h-9 rounded-full gap-1.5 px-3.5 has-[>svg]:px-3",
        lg: "h-12 rounded-full px-7 has-[>svg]:px-5",
        icon: "size-11 rounded-full",
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
