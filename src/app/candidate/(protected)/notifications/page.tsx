import type { Metadata } from "next";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { getNotificationsPage, getUnreadNotificationCount } from "@/lib/notifications/data";
import { markAllNotificationsReadAction } from "@/lib/notifications/actions";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { Pagination } from "@/components/hr/pagination";
import { EmptyState } from "@/components/hr/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Bell } from "lucide-react";
import { BTN_SECONDARY, DASHBOARD_CARD, PAGE_STACK } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Notifications | AI Recruitment Portal",
};

export default async function CandidateNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireCandidateUser();
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? "1");
  const [{ notifications, total, pageSize }, unreadCount] = await Promise.all([
    getNotificationsPage(profile.id, "candidate", page),
    getUnreadNotificationCount(profile.id, "candidate"),
  ]);

  return (
    <div className={PAGE_STACK}>
      <PageHeader
        title="Notifications"
        description="Updates about your applications and interviews."
        actions={
          total > 0 && unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction.bind(null, "candidate")}>
              <button type="submit" className={BTN_SECONDARY}>
                Mark all as read
                {unreadCount > 0 ? (
                  <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            </form>
          ) : undefined
        }
      />

      <div className={DASHBOARD_CARD}>
        {notifications.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="You'll see updates here when your application status changes or interviews are scheduled."
            />
          </div>
        ) : (
          <>
            <NotificationsList notifications={notifications} role="candidate" />
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              basePath="/candidate/notifications"
            />
          </>
        )}
      </div>
    </div>
  );
}
