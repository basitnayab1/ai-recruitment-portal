"use client";

import dynamic from "next/dynamic";

export const AIInterviewAssistantLazy = dynamic(
  () =>
    import("@/components/hr/AIInterviewAssistantCard").then((mod) => mod.AIInterviewAssistantCard),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="h-5 w-48 rounded bg-white/10" />
        <div className="mt-4 h-32 rounded bg-white/10" />
      </div>
    ),
  }
);
