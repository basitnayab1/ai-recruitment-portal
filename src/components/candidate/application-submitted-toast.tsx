"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Fires a one-time success toast after redirecting here from a successful
 * job application submission (see applyToJob), then strips `?applied=1`
 * from the URL so refreshing the page doesn't repeat it. Rendered only
 * when the page's Server Component sees that query param — no
 * `useSearchParams()`/Suspense boundary needed. Mirrors
 * `profile-updated-toast.tsx`.
 */
export function ApplicationSubmittedToast() {
  const router = useRouter();

  useEffect(() => {
    toast.success("Application submitted successfully!");
    router.replace("/candidate/applications", { scroll: false });
  }, [router]);

  return null;
}
