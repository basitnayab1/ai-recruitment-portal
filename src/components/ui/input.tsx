import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white shadow-sm outline-none transition-all placeholder:text-zinc-500 selection:bg-violet-500/40 selection:text-white file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-violet-400/60 focus-visible:bg-white/[0.06] focus-visible:ring-4 focus-visible:ring-violet-500/20",
        "aria-invalid:border-red-400 aria-invalid:ring-4 aria-invalid:ring-red-500/15",
        className
      )}
      {...props}
    />
  );
}

export { Input };
