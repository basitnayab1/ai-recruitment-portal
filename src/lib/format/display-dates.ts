/**
 * Stable date/time formatters for display in Server Components.
 * Pass formatted values as props to Client Components to avoid hydration mismatches.
 */

export function formatLongDisplayDate(
  date: Date = new Date(),
  timeZone = "UTC"
): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(date);
}

export function formatIsoDateUTC(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatGreeting(date: Date = new Date(), timeZone = "UTC"): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone,
    }).format(date)
  );

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDisplayYear(date: Date = new Date(), timeZone = "UTC"): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone,
  }).format(date);
}
