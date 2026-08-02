import { APPLICATION_STATUS_META, type ApplicationStatus } from "@/lib/hr/status";
import { formatRelativeTime } from "@/lib/hr/format";
import { DashboardCardShell } from "@/components/shared/dashboard-card-shell";

type RecentActivityItem = {
  id: string;
  candidateName: string;
  jobTitle: string;
  previousStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedByName: string | null;
  createdAt: string;
};

export function RecentActivityCard({ activity }: { activity: RecentActivityItem[] }) {
  return (
    <DashboardCardShell title="Status Changes" href="/hr/applications">
      {activity.length === 0 ? (
        <div className="px-6 py-10">
          <p className="text-sm text-zinc-400">
            Status changes will appear here once applications start moving through your pipeline.
          </p>
        </div>
      ) : (
        <ul className="space-y-4 px-6 py-4">
          {activity.map((item) => (
            <li key={item.id} className="text-sm">
              <p className="text-white">
                <span className="font-medium">{item.candidateName}</span>{" "}
                {item.previousStatus ? (
                  <>
                    moved from{" "}
                    <span className="font-medium">
                      {APPLICATION_STATUS_META[item.previousStatus].label}
                    </span>{" "}
                    to{" "}
                  </>
                ) : (
                  "applied — status set to "
                )}
                <span className="font-medium">
                  {APPLICATION_STATUS_META[item.newStatus].label}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {item.jobTitle} · {formatRelativeTime(item.createdAt)}
                {item.changedByName ? ` · by ${item.changedByName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCardShell>
  );
}
