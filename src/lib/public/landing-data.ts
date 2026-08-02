import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmploymentType, type EmploymentType } from "@/lib/hr/jobs";

type PublishedJobRow = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  is_remote: boolean;
  employment_type: string;
  published_at: string | null;
};

export type FeaturedJob = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  isRemote: boolean;
  employmentType: EmploymentType;
  publishedAt: string | null;
};

export type LandingStats = {
  totalJobs: number;
  totalCandidates: number;
  totalApplications: number;
  totalInterviews: number;
};

const MAX_FEATURED_JOBS = 6;

async function fetchLandingStatsUncached(): Promise<LandingStats> {
  try {
    const supabase = createAdminClient();

    const [jobsResult, candidatesResult, applicationsResult, interviewsResult] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("candidate_profiles").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("interviews").select("id", { count: "exact", head: true }),
    ]);

    if (jobsResult.error) {
      console.error("[landing-data] Failed to load jobs count:", jobsResult.error.message);
    }
    if (candidatesResult.error) {
      console.error("[landing-data] Failed to load candidates count:", candidatesResult.error.message);
    }
    if (applicationsResult.error) {
      console.error("[landing-data] Failed to load applications count:", applicationsResult.error.message);
    }
    if (interviewsResult.error) {
      console.error("[landing-data] Failed to load interviews count:", interviewsResult.error.message);
    }

    return {
      totalJobs: jobsResult.count ?? 0,
      totalCandidates: candidatesResult.count ?? 0,
      totalApplications: applicationsResult.count ?? 0,
      totalInterviews: interviewsResult.count ?? 0,
    };
  } catch (error) {
    console.error("[landing-data] Failed to load landing stats:", error);
    return {
      totalJobs: 0,
      totalCandidates: 0,
      totalApplications: 0,
      totalInterviews: 0,
    };
  }
}

const getCachedLandingStats = unstable_cache(fetchLandingStatsUncached, ["landing-stats"], {
  revalidate: 60,
  tags: ["landing-stats"],
});

/**
 * Latest published jobs for the public landing page.
 * Request-deduped via React cache(); short TTL via unstable_cache for stats.
 */
export const getFeaturedJobs = cache(async (): Promise<FeaturedJob[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, department, location, is_remote, employment_type, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(MAX_FEATURED_JOBS);

  if (error) {
    console.error("[landing-data] Failed to load featured jobs:", error.message);
    return [];
  }

  return ((data ?? []) as PublishedJobRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    isRemote: row.is_remote,
    employmentType: isEmploymentType(row.employment_type) ? row.employment_type : "full_time",
    publishedAt: row.published_at,
  }));
});

/**
 * Public headline stats for the landing page (60s cache, tag: landing-stats).
 */
export async function getLandingStats(): Promise<LandingStats> {
  return getCachedLandingStats();
}
