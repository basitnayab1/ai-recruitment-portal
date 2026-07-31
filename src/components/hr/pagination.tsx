import Link from "next/link";
import {
  PAGINATION_BAR,
  PAGINATION_BTN,
  PAGINATION_BTN_DISABLED,
} from "@/lib/ui/classes";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  extraParams = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  function hrefForPage(targetPage: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className={PAGINATION_BAR} aria-label="Pagination">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing{" "}
        <span className="font-bold text-zinc-800 dark:text-zinc-200">{from}</span>–
        <span className="font-bold text-zinc-800 dark:text-zinc-200">{to}</span> of{" "}
        <span className="font-bold text-zinc-800 dark:text-zinc-200">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="hidden rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
          Page {page} of {totalPages}
        </span>
        {page > 1 ? (
          <Link href={hrefForPage(page - 1)} className={PAGINATION_BTN} aria-label="Previous page">
            ← Previous
          </Link>
        ) : (
          <span className={PAGINATION_BTN_DISABLED} aria-disabled="true">
            ← Previous
          </span>
        )}
        {page < totalPages ? (
          <Link href={hrefForPage(page + 1)} className={PAGINATION_BTN} aria-label="Next page">
            Next →
          </Link>
        ) : (
          <span className={PAGINATION_BTN_DISABLED} aria-disabled="true">
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}
