"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Fires a one-time success toast after a redirect from a successful
 * "Save Profile" submission (see updateCandidateProfileDetails), then
 * strips the `?updated=1` marker from the URL so refreshing the dashboard
 * doesn't repeat it. Rendered only when the dashboard page's Server
 * Component sees that query param — no `useSearchParams()`/Suspense
 * boundary needed.
 */
export function ProfileUpdatedToast() {
  const router = useRouter();

  useEffect(() => {
    toast.success("Profile updated successfully.");
    router.replace("/candidate", { scroll: false });
  }, [router]);

  return null;
}
