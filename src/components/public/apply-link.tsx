import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  return (
    <Button asChild size={size} className={className}>
      <Link href={href}>Apply Now</Link>
    </Button>
  );
}
