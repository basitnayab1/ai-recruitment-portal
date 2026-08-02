import Link from "next/link";
import { PAGE_TITLE, SURFACE_CARD, BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui/classes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06060a] px-4">
      <div className={`${SURFACE_CARD} w-full max-w-md p-8 text-center`}>
        <p className="text-sm font-semibold text-violet-300">404</p>
        <h1 className={`${PAGE_TITLE} mt-1`}>Page not found</h1>
        <p className="mt-2 text-sm text-zinc-400">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className={BTN_PRIMARY}>
            Back to home
          </Link>
          <Link href="/jobs" className={BTN_SECONDARY}>
            Browse jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
