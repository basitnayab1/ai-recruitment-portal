import type { Metadata } from "next";
import Link from "next/link";
import { requireHRUser } from "@/lib/auth/dal";
import { JobForm } from "@/components/hr/jobs/job-form";
import { createJobAction } from "@/lib/hr/jobs-actions";

export const metadata: Metadata = {
  title: "Create Job | AI Recruitment Portal",
};

export default async function NewJobPage() {
  await requireHRUser();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/hr/jobs"
          className="text-sm font-medium text-zinc-500 hover:text-white"
        >
          ← Back to Jobs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Create Job
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Fill in the details for the new job posting.
        </p>
      </div>

      <JobForm mode="create" action={createJobAction} submitLabel="Create Job" />
    </div>
  );
}
