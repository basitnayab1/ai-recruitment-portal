export const HR_LIST_PAGE_SIZE = 20;

export {
  FIELD_INPUT as SEARCH_INPUT_CLASSNAME,
  SELECT_INPUT as SELECT_INPUT_CLASSNAME,
} from "@/lib/ui/classes";

/**
 * Strip PostgREST filter / `.or()` syntax characters from user search text.
 * Also bounds length to reduce abuse of filter strings.
 */
export function sanitizeSearchTerm(value: string): string {
  return value
    .replace(/[,().*\\]/g, " ")
    .replace(/[%_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export function parsePageParam(value: string | undefined): number {
  if (!value) {
    return 1;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
