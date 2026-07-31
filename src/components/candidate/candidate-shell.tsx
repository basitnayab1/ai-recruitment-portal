"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CandidateSidebar } from "@/components/candidate/candidate-sidebar";
import { CandidateTopbar } from "@/components/candidate/candidate-topbar";
import { CANDIDATE_MAIN_BG, CANDIDATE_SHELL_BG } from "@/lib/ui/classes";
import type { NotificationPreviewItem } from "@/components/notifications/notification-bell-menu";

export function CandidateShell({
  children,
  fullName,
  email,
  completionPercentage,
  pictureUrl,
  notifications,
}: {
  children: ReactNode;
  fullName: string;
  email: string;
  completionPercentage: number;
  pictureUrl: string | null;
  notifications: {
    preview: NotificationPreviewItem[];
    unreadCount: number;
  };
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={CANDIDATE_SHELL_BG}>
      <div className="hidden lg:block">
        <CandidateSidebar
          fullName={fullName}
          email={email}
          completionPercentage={completionPercentage}
          pictureUrl={pictureUrl}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </div>

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        }`}
      >
        <CandidateTopbar
          fullName={fullName}
          email={email}
          completionPercentage={completionPercentage}
          pictureUrl={pictureUrl}
          notificationProps={{
            role: "candidate",
            notificationsPath: "/candidate/notifications",
            unreadCount: notifications.unreadCount,
            preview: notifications.preview,
          }}
        />

        <main className={`${CANDIDATE_MAIN_BG} flex-1 px-4 py-8 sm:px-6 lg:px-10`}>
          <div className="relative mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
