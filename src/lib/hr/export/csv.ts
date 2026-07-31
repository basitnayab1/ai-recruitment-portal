import "server-only";

function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  return escapeCsvField(String(value));
}

/** Builds a UTF-8 CSV string with a header row. All cell values are escaped on the server. */
export function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [
    headers.map((header) => escapeCsvField(header)).join(","),
    ...rows.map((row) => row.map((cell) => toCsvCell(cell)).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function exportFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.csv`;
}
