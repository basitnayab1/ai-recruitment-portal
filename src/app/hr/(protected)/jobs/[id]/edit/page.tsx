import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHRUser } from "@/lib/auth/dal";
import { getJobById } from "@/lib/hr/jobs-data";
import { JobForm } from "@/components/hr/jobs/job-form";
import { updateJobAction } from "@/lib/hr/jobs-actions";
import { toDateInputValue } from "@/lib/hr/format";

export const metadata: Metadata = {
  title: "Edit Job | AI Recruitment Portal",
};

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireHRUser();
  const { id } = await params;

  const job = await getJobById(id);
  if (!job) {
    notFound();
  }

  const boundUpdateJobAction = updateJobAction.bind(null, job.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/hr/jobs/${job.id}`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to Job
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Edit Job
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{job.title}</p>
      </div>

      <JobForm
        mode="edit"
        action={boundUpdateJobAction}
        submitLabel="Save Changes"
        defaultValues={{
          title: job.title,
          department: job.department ?? "",
          location: job.location ?? "",
          employmentType: job.employmentType,
          description: job.description,
          requirements: job.requirements ?? "",
          responsibilities: job.responsibilities ?? "",
          salaryMin: job.salaryMin !== null ? String(job.salaryMin) : "",
          salaryMax: job.salaryMax !== null ? String(job.salaryMax) : "",
          isRemote: job.isRemote,
          closesAt: toDateInputValue(job.closesAt),
        }}
      />
    </div>
  );
}
