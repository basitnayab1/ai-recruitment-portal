"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SidebarNav } from "@/components/hr/sidebar-nav";
import { CloseIcon, MenuIcon } from "@/components/hr/icons";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="rounded-xl p-2.5 text-zinc-200 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <MenuIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="hr-sidebar-gradient relative flex h-full w-72 max-w-[85%] flex-col py-4 shadow-2xl">
            <div className="flex items-center justify-between px-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                  <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <span className="hr-logo-glow text-sm font-bold">RecruitAI</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              >
                <CloseIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
