"use client";

import dynamic from "next/dynamic";

/** Lazy-load copilot widget so it is not in the critical HR layout bundle. */
export const HRCopilotLazy = dynamic(
  () =>
    import("@/components/hr/copilot/hr-copilot-widget").then((mod) => mod.HRCopilotWidget),
  { ssr: false, loading: () => null }
);
