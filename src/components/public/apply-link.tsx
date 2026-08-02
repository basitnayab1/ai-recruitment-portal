import Link from "next/link";
import { BTN_PRIMARY } from "@/lib/ui/classes";
import { cn } from "@/lib/utils";

/**
 * Shared "Apply Now" gate used on both the job card and job detail page
 * (requirement 9): logged-in candidates go straight to the apply flow;
 * everyone else is sent to candidate login with `next` pointing back at
 * this job's detail page, so they land right back here once signed in.
 */
export function ApplyLink({
  jobId,
  isLoggedIn,
  size = "default",
  className,
}: {
  jobId: string;
  isLoggedIn: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const href = isLoggedIn
    ? `/candidate/apply/${jobId}`
    : `/candidate/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`;

  const sizeClass =
    size === "sm" ? "h-9 px-4 text-xs" : size === "lg" ? "h-12 px-7" : "h-11 px-5";

  return (
    <Link href={href} className={cn(BTN_PRIMARY, sizeClass, className)}>
      Apply Now
    </Link>
  );
}
