import { requireHRUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";
import { SidebarNav } from "@/components/hr/sidebar-nav";
import { MobileNav } from "@/components/hr/mobile-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { BTN_OUTLINE, HR_MAIN_BG, HR_SHELL_BG } from "@/lib/ui/classes";
import { Sparkles } from "lucide-react";

export default async function HRProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireHRUser();

  return (
    <div className={HR_SHELL_BG}>
      {/* Desktop sidebar — dark premium panel */}
      <aside className="hr-sidebar-gradient hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[260px] lg:flex-col lg:border-r lg:border-zinc-800/80">
        <div className="flex h-[72px] shrink-0 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
            <Sparkles className="h-4.5 w-4.5 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="hr-logo-glow text-sm font-bold tracking-tight">RecruitAI</span>
            <p className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
              HR Console
            </p>
          </div>
        </div>

        <SidebarNav />

        <div className="mx-4 mb-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100">{profile.fullName}</p>
              <p className="text-xs text-zinc-500">
                {profile.role === "admin" ? "Administrator" : "HR Manager"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center gap-4 border-b border-zinc-200/60 bg-white/70 px-4 backdrop-blur-xl sm:px-6 dark:border-zinc-800/60 dark:bg-zinc-950/70">
          <MobileNav />

          <div className="flex flex-1 items-center justify-end gap-4">
            <NotificationBell userId={profile.id} role="hr" notificationsPath="/hr/notifications" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {profile.fullName}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {profile.role === "admin" ? "Administrator" : "HR Manager"}
              </p>
            </div>
            <form action={logout}>
              <button type="submit" className={BTN_OUTLINE}>
                Log out
              </button>
            </form>
          </div>
        </header>

        <main className={`${HR_MAIN_BG} flex-1 px-4 py-10 sm:px-6 lg:px-10`}>
          <div className="relative mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
