import type { Metadata } from "next";
import { requireHRUser } from "@/lib/auth/dal";
import { getNotificationsPage, getUnreadNotificationCount } from "@/lib/notifications/data";
import { markAllNotificationsReadAction } from "@/lib/notifications/actions";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { Pagination } from "@/components/hr/pagination";
import { EmptyState } from "@/components/hr/empty-state";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { PageHeader } from "@/components/shared/page-header";
import { BTN_SECONDARY, PAGE_STACK } from "@/lib/ui/classes";
import { Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Notifications | AI Recruitment Portal",
};

export default async function HRNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireHRUser();
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? "1");
  const [{ notifications, total, pageSize }, unreadCount] = await Promise.all([
    getNotificationsPage(profile.id, "hr", page),
    getUnreadNotificationCount(profile.id, "hr"),
  ]);

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Notifications"
        description="Stay up to date on applications and interviews."
        actions={
          total > 0 && unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction.bind(null, "hr")}>
              <button type="submit" className={BTN_SECONDARY}>
                Mark all as read
              </button>
            </form>
          ) : undefined
        }
      />

      <DataTableShell
        footer={
          notifications.length > 0 ? (
            <Pagination page={page} pageSize={pageSize} total={total} basePath="/hr/notifications" />
          ) : undefined
        }
      >
        {notifications.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="You'll see alerts here when candidates apply or interviews are updated."
            />
          </div>
        ) : (
          <NotificationsList notifications={notifications} role="hr" />
        )}
      </DataTableShell>
    </div>
  );
}
