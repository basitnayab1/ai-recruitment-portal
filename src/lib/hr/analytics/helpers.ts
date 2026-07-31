import "server-only";

import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/hr/status";

export const MONTHLY_CHART_MONTHS = 6;
export const TOP_JOBS_CHART_LIMIT = 8;
export const RECENT_APPLICATIONS_LIMIT = 8;
export const RECENT_JOBS_LIMIT = 6;
export const RECENT_UPDATED_LIMIT = 6;
export const RECENT_ACTIVITY_LIMIT = 12;
export const UPCOMING_INTERVIEWS_LIMIT = 8;

export function emptyDistribution(): Record<ApplicationStatus, number> {
  return APPLICATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );
}

export function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string
): T | null {
  if (result.error) {
    console.error(`[analytics] Failed to load ${context}:`, result.error.message);
    return null;
  }
  return result.data;
}

const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

export function buildMonthlyApplicationCounts(submittedAts: string[]) {
  const now = new Date();
  const months = [];

  for (let offset = MONTHLY_CHART_MONTHS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      month: monthLabelFormatter.format(date),
      monthKey,
      count: 0,
    });
  }

  const monthIndex = new Map(months.map((entry, index) => [entry.monthKey, index]));

  for (const submittedAt of submittedAts) {
    const date = new Date(submittedAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const index = monthIndex.get(monthKey);
    if (index !== undefined) {
      months[index].count += 1;
    }
  }

  return months;
}

export function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
