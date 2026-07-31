import type { Metadata } from "next";
import { requireHRUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/shared/page-header";
import { DETAIL_SECTION, PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Settings | AI Recruitment Portal",
};

export default async function HRSettingsPage() {
  const profile = await requireHRUser();

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Settings"
        description="Manage your account and portal preferences."
      />

      <div className={`max-w-xl ${DETAIL_SECTION}`}>
        <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your account
        </h2>
        <dl className="mt-6 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">Name</dt>
            <dd className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {profile.fullName}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {profile.email}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">Role</dt>
            <dd>
              <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                {profile.role === "admin" ? "Administrator" : "HR Manager"}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Team management, notification preferences, and other settings are coming soon.
      </p>
    </div>
  );
}
