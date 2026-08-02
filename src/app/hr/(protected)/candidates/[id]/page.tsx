import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHRUser } from "@/lib/auth/dal";
import { getHRCandidateById } from "@/lib/hr/candidates-data";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";
import { formatDate } from "@/lib/hr/format";
import { StatusBadge } from "@/components/hr/status-badge";
import {
  GENDER_LABELS,
  HIGHEST_QUALIFICATION_LABELS,
  NOTICE_PERIOD_LABELS,
} from "@/lib/candidate/profile-details";
import { BTN_PRIMARY, BTN_SECONDARY, DETAIL_SECTION, PAGE_LINK_BACK, PAGE_TITLE } from "@/lib/ui/classes";
import { AIResumeAnalysisLazy } from "@/components/hr/ai-resume-analysis-lazy";

export const metadata: Metadata = {
  title: "Candidate Details | AI Recruitment Portal",
};

const salaryFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-400">{label}</dt>
      <dd className="mt-1 text-sm text-white">{value}</dd>
    </div>
  );
}

export default async function HRCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireHRUser();
  const { id } = await params;

  const candidate = await getHRCandidateById(id);
  if (!candidate) {
    notFound();
  }

  const profile = candidate.profile;
  const defaultApplicationId = candidate.applications[0]?.id ?? null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/hr/candidates" className={PAGE_LINK_BACK}>
          ← Back to Candidates
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <CandidateAvatar
            name={candidate.fullName}
            pictureSrc={candidate.pictureUrl}
            size="lg"
          />
          <div>
            <h1 className={PAGE_TITLE}>{candidate.fullName}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Joined {formatDate(candidate.joinedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">
              Personal Information
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={candidate.fullName} />
              <Field label="Email" value={candidate.email} />
              <Field label="Phone" value={candidate.phone ?? "Not provided"} />
              <Field label="CNIC" value={profile?.cnic ?? "Not provided"} />
              <Field
                label="Date of Birth"
                value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not provided"}
              />
              <Field
                label="Gender"
                value={profile?.gender ? GENDER_LABELS[profile.gender] : "Not provided"}
              />
              <Field
                label="Location"
                value={
                  [profile?.city, profile?.province, profile?.country].filter(Boolean).join(", ") ||
                  "Not provided"
                }
              />
              <Field label="Address" value={profile?.address ?? "Not provided"} />
            </dl>
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">
              Professional Information
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Current Position" value={profile?.currentJobTitle ?? "Not provided"} />
              <Field label="Current Company" value={profile?.currentCompany ?? "Not provided"} />
              <Field
                label="Total Years of Experience"
                value={
                  profile?.yearsOfExperience === null || profile?.yearsOfExperience === undefined
                    ? "Not provided"
                    : `${profile.yearsOfExperience} ${profile.yearsOfExperience === 1 ? "year" : "years"}`
                }
              />
              <Field
                label="Highest Qualification"
                value={
                  profile?.highestQualification
                    ? HIGHEST_QUALIFICATION_LABELS[profile.highestQualification]
                    : "Not provided"
                }
              />
              <Field
                label="Notice Period"
                value={profile?.noticePeriod ? NOTICE_PERIOD_LABELS[profile.noticePeriod] : "Not provided"}
              />
              <Field
                label="Current Salary"
                value={
                  profile?.currentSalary === null || profile?.currentSalary === undefined
                    ? "Not provided"
                    : salaryFormatter.format(profile.currentSalary)
                }
              />
              <Field
                label="Expected Salary"
                value={
                  profile?.expectedSalary === null || profile?.expectedSalary === undefined
                    ? "Not provided"
                    : salaryFormatter.format(profile.expectedSalary)
                }
              />
              <Field label="LinkedIn" value={profile?.linkedinUrl ?? "Not provided"} />
              <Field label="Portfolio" value={profile?.portfolioUrl ?? "Not provided"} />
              <Field label="GitHub" value={profile?.githubUrl ?? "Not provided"} />
            </dl>
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">Education</h2>
            {candidate.education.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">
                No education records added yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-4 divide-y divide-zinc-100 dark:divide-zinc-900">
                {candidate.education.map((entry) => (
                  <li key={entry.id} className="pt-4 first:pt-0">
                    <p className="text-sm font-medium text-white">
                      {entry.degree}
                      {entry.fieldOfStudy ? ` in ${entry.fieldOfStudy}` : ""}
                    </p>
                    <p className="text-sm text-zinc-200">{entry.institutionName}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {entry.startDate ? formatDate(entry.startDate) : "—"} –{" "}
                      {entry.isCurrent ? "Present" : entry.endDate ? formatDate(entry.endDate) : "—"}
                      {entry.grade ? ` · ${entry.grade}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">Skills</h2>
            {candidate.skills.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">No skills added yet.</p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-200 dark:bg-zinc-800"
                  >
                    {skill.skillName}
                    {skill.proficiencyLevel ? ` · ${skill.proficiencyLevel}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">Applications</h2>
            {candidate.applications.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">
                This candidate hasn&apos;t applied to any jobs yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-900">
                {candidate.applications.map((application) => (
                  <li
                    key={application.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {application.jobTitle}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {application.department ? `${application.department} · ` : ""}
                        Applied {formatDate(application.submittedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={application.status} />
                      <Link
                        href={`/hr/applications/${application.id}`}
                        className={`${BTN_SECONDARY} h-8 px-3 text-xs`}
                      >
                        View Details
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {candidate.resume ? (
            <AIResumeAnalysisLazy
              candidateId={candidate.id}
              hasResume
              applications={candidate.applications.map((application) => ({
                id: application.id,
                jobTitle: application.jobTitle,
              }))}
              defaultApplicationId={defaultApplicationId}
              initialAnalysis={candidate.resumeAnalysis?.analysis ?? null}
              initialJobTitle={candidate.resumeAnalysis?.jobTitle ?? null}
              resumeUploadedAt={candidate.resume.uploadedAt}
              analysisUpdatedAt={candidate.resumeAnalysis?.updatedAt ?? null}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">Resume</h2>
            {candidate.resume ? (
              <>
                <p className="mt-4 truncate text-sm font-medium text-white">
                  {candidate.resume.fileName}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatFileSize(candidate.resume.fileSize)} · Uploaded{" "}
                  {formatDate(candidate.resume.uploadedAt)}
                </p>
                <a
                  href={`/hr/candidates/${candidate.id}/resume`}
                  className={`${BTN_PRIMARY} mt-4 w-full`}
                >
                  Download Resume
                </a>
              </>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">No résumé uploaded yet.</p>
            )}
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">
              Profile Completion
            </h2>
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                  style={{ width: `${profile?.profileCompletion ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-zinc-200">
                {profile?.profileCompletion ?? 0}% complete
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
