export type HRNavItem = {
  href: string;
  label: string;
};

export const HR_NAV_ITEMS: HRNavItem[] = [
  { href: "/hr", label: "Dashboard" },
  { href: "/hr/jobs", label: "Jobs" },
  { href: "/hr/applications", label: "Applications" },
  { href: "/hr/interviews", label: "Interviews" },
  { href: "/hr/candidates", label: "Candidates" },
  { href: "/hr/notifications", label: "Notifications" },
  { href: "/hr/reports", label: "Reports" },
  { href: "/hr/activity-log", label: "Activity Log" },
  { href: "/hr/settings", label: "Settings" },
];
