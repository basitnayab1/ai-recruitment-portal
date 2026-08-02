import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isJobStatus } from "@/lib/hr/jobs";
import { isApplicationStatus } from "@/lib/hr/status";
import {
  RECENT_APPLICATIONS_LIMIT,
  RECENT_JOBS_LIMIT,
  RECENT_UPDATED_LIMIT,
  unwrap,
} from "@/lib/hr/analytics/helpers";
import type {
  RecentApplication,
  RecentJob,
  RecentlyUpdatedApplication,
} from "@/lib/hr/analytics/types";

type JobRow = {
  id: string;
  title: string;
  status: string;
  department: string | null;
  created_at: string;
};

type RecentApplicationRow = {
  id: string;
  full_name: string;
  status: string;
  submitted_at: string;
  jobs: { title: string } | null;
  ai_evaluations: { overall_score: number | null; evaluated_at: string }[] | null;
};

type RecentlyUpdatedApplicationRow = {
  id: string;
  full_name: string;
  status: string;
  updated_at: string;
  jobs: { title: string } | null;
};

export async function fetchRecentLists(): Promise<{
  recentApplications: RecentApplication[];
  recentJobs: RecentJob[];
  recentlyUpdatedApplications: RecentlyUpdatedApplication[];
}> {
  const supabase = await createClient();

  const [jobsResult, recentApplicationsResult, recentlyUpdatedResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, department, created_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_JOBS_LIMIT),
    supabase
      .from("applications")
      .select(
        `id, full_name, status, submitted_at,
         jobs ( title ),
         ai_evaluations ( overall_score, evaluated_at )`
      )
      .order("submitted_at", { ascending: false })
      .order("evaluated_at", { referencedTable: "ai_evaluations", ascending: false })
      .limit(1, { referencedTable: "ai_evaluations" })
      .limit(RECENT_APPLICATIONS_LIMIT),
    supabase
      .from("applications")
      .select("id, full_name, status, updated_at, jobs ( title )")
      .order("updated_at", { ascending: false })
      .limit(RECENT_UPDATED_LIMIT),
  ]);

  const jobRows = (unwrap(jobsResult, "jobs for recent lists") ?? []) as JobRow[];

  const recentJobs: RecentJob[] = jobRows.map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department,
    status: isJobStatus(row.status) ? row.status : "draft",
    createdAt: row.created_at,
  }));

  const recentApplicationRows = (unwrap(recentApplicationsResult, "recent applications") ??
    []) as unknown as RecentApplicationRow[];

  const recentApplications: RecentApplication[] = recentApplicationRows.map((row) => ({
    id: row.id,
    candidateName: row.full_name,
    jobTitle: row.jobs?.title ?? "Unknown role",
    status: isApplicationStatus(row.status) ? row.status : "new",
    aiScore: row.ai_evaluations?.[0]?.overall_score ?? null,
    submittedAt: row.submitted_at,
  }));

  const recentlyUpdatedRows = (unwrap(recentlyUpdatedResult, "recently updated applications") ??
    []) as unknown as RecentlyUpdatedApplicationRow[];

  const recentlyUpdatedApplications: RecentlyUpdatedApplication[] = recentlyUpdatedRows.map(
    (row) => ({
      id: row.id,
      candidateName: row.full_name,
      jobTitle: row.jobs?.title ?? "Unknown role",
      status: isApplicationStatus(row.status) ? row.status : "new",
      updatedAt: row.updated_at,
    })
  );

  return { recentApplications, recentJobs, recentlyUpdatedApplications };
}
