import "server-only";

import { formatDate } from "@/lib/hr/format";
import { formatEmailTime } from "@/lib/email/format";

export function formatExportDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return formatDate(value);
}

export function formatExportTime(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return formatEmailTime(value.length >= 5 ? value.slice(0, 5) : value);
}

export function formatExportExperience(years: number | null | undefined): string {
  if (years === null || years === undefined) {
    return "";
  }
  return years === 1 ? "1 year" : `${years} years`;
}

export function formatExportYesNo(value: boolean): string {
  return value ? "Yes" : "No";
}
