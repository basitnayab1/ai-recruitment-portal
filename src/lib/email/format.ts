import "server-only";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/** Parses HTML `<input type="date">` values (`YYYY-MM-DD`) in local time. */
function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

/** Parses HTML `<input type="time">` values (`HH:mm` or `HH:mm:ss`). */
function parseTimeInput(value: string): Date | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? "0");

  if (hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }

  return new Date(1970, 0, 1, hours, minutes, seconds);
}

export function formatEmailDate(value: string | Date = new Date()): string {
  if (value instanceof Date) {
    return dateFormatter.format(value);
  }

  const dateOnly = parseDateInput(value);
  if (dateOnly) {
    return dateFormatter.format(dateOnly);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return dateFormatter.format(parsed);
  }

  return value.trim();
}

export function formatEmailTime(value: string): string {
  const parsed = parseTimeInput(value);
  if (parsed) {
    return timeFormatter.format(parsed);
  }

  return value.trim();
}
