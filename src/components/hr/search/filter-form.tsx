"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent, type ReactNode } from "react";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui/classes";

type FilterFormProps = {
  /** Path to navigate to, e.g. `/hr/jobs`. */
  action: string;
  /** Clear link href when filters are active. */
  clearHref?: string;
  hasActiveFilters?: boolean;
  submitLabel?: string;
  clearLabel?: string;
  className?: string;
  children: ReactNode;
};

/**
 * GET-style filter form for HR list pages.
 * - Typing never navigates.
 * - Submit only via the Apply/Search button (or Enter in a text field).
 * - Soft-navigates with `useTransition` and blocks duplicate submits while pending.
 * - Omits empty values and `page` so a new search resets pagination.
 */
export function FilterForm({
  action,
  clearHref,
  hasActiveFilters = false,
  submitLabel = "Apply filters",
  clearLabel = "Clear",
  className,
  children,
}: FilterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (key === "page") continue;
      const trimmed = String(value).trim();
      if (trimmed) params.set(key, trimmed);
    }

    const href = params.size > 0 ? `${action}?${params.toString()}` : action;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return (
    <form
      method="get"
      action={action}
      onSubmit={handleSubmit}
      className={className}
      aria-busy={isPending}
    >
      <fieldset disabled={isPending} className="contents">
        {children}
      </fieldset>

      <div className="col-span-full flex flex-wrap gap-2 justify-end">
        <button type="submit" className={BTN_PRIMARY} disabled={isPending}>
          {isPending ? "Searching…" : submitLabel}
        </button>
        {hasActiveFilters && clearHref ? (
          <Link
            href={clearHref}
            className={`${BTN_SECONDARY}${isPending ? " pointer-events-none opacity-60" : ""}`}
            aria-disabled={isPending}
            tabIndex={isPending ? -1 : undefined}
            onClick={(event) => {
              if (isPending) {
                event.preventDefault();
                return;
              }
              event.preventDefault();
              startTransition(() => {
                router.push(clearHref, { scroll: false });
              });
            }}
          >
            {clearLabel}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
