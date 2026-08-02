import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHRUser } from "@/lib/auth/dal";
import { getApplicationNotes, getHRApplicationById } from "@/lib/hr/applications-data";
import { formatDate } from "@/lib/hr/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/hr/jobs";
import { NOTICE_PERIOD_LABELS, isNoticePeriod } from "@/lib/candidate/profile-details";
import { StatusBadge } from "@/components/hr/status-badge";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";
import { StatusUpdateForm } from "@/components/hr/applications/status-update-form";
import { AddNoteForm } from "@/components/hr/applications/add-note-form";
import { InterviewManagement } from "@/components/hr/applications/interview-management";
import { AIInterviewAssistantLazy } from "@/components/hr/ai-interview-assistant-lazy";
import { AIEmailAssistantCard } from "@/components/hr/email/ai-email-assistant-card";
import type { AIEmailContext } from "@/components/hr/email/ai-email-context";
import { getInterviewByApplicationId } from "@/lib/hr/interview-data";
import { resolveInterviewLocation } from "@/lib/hr/interviews";
import { getInterviewQuestionsByApplicationId } from "@/lib/hr/interview-questions-data";
import { BTN_PRIMARY, DETAIL_SECTION, PAGE_LINK_BACK, PAGE_TITLE } from "@/lib/ui/classes";
import { formatIsoDateUTC } from "@/lib/format/display-dates";

export const metadata: Metadata = {
  title: "Application Details | AI Recruitment Portal",
};

const salaryFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatSalary(value: number | null): string {
  return value === null ? "Not specified" : salaryFormatter.format(value);
}

function formatSalaryRange(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${salaryFormatter.format(min)} – ${salaryFormatter.format(max)}`;
  if (min !== null) return `From ${salaryFormatter.format(min)}`;
  if (max !== null) return `Up to ${salaryFormatter.format(max)}`;
  return "Not specified";
}

function formatNoticePeriod(value: string | null): string {
  if (!value) return "Not specified";
  return isNoticePeriod(value) ? NOTICE_PERIOD_LABELS[value] : value;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-400">{label}</dt>
      <dd className="mt-1 text-sm text-white">{value}</dd>
    </div>
  );
}

export default async function HRApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireHRUser();
  const { id } = await params;

  const application = await getHRApplicationById(id);
  if (!application) {
    notFound();
  }

  const notes = await getApplicationNotes(id);
  const interview = await getInterviewByApplicationId(id);
  const interviewQuestions = await getInterviewQuestionsByApplicationId(id);
  const minInterviewDate = formatIsoDateUTC();

  const interviewForClient = interview
    ? {
        id: interview.id,
        status: interview.status,
        interviewerName: interview.interviewerName,
        interviewType: interview.interviewType,
        meetingLink: interview.meetingLink,
        officeLocation: interview.officeLocation,
        interviewDate: interview.interviewDate,
        interviewTime: interview.interviewTime,
        timezone: interview.timezone,
        durationMinutes: interview.durationMinutes,
        notes: interview.notes,
      }
    : null;

  const emailContext: AIEmailContext = {
    applicationId: application.id,
    candidateName: application.fullName,
    candidateEmail: application.email,
    jobTitle: application.job?.title ?? "the open role",
    companyName: process.env.APP_NAME?.trim() || "AI Recruitment Portal",
    interviewDate: interview?.interviewDate,
    interviewTime: interview?.interviewTime,
    interviewLocation: interview
      ? resolveInterviewLocation(
          interview.interviewType,
          interview.meetingLink,
          interview.officeLocation
        )
      : undefined,
    hrNotes: interview?.notes ?? undefined,
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/hr/applications" className={PAGE_LINK_BACK}>
          ← Back to Applications
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <CandidateAvatar
            name={application.fullName}
            pictureSrc={application.pictureUrl}
            size="lg"
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={PAGE_TITLE}>
              {application.fullName}
            </h1>
            <StatusBadge status={application.status} />
          </div>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Applied for {application.job?.title ?? "Unknown role"} · {formatDate(application.submittedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">
              Candidate Information
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={application.fullName} />
              <Field label="Email" value={application.email} />
              <Field label="Phone" value={application.phone ?? "Not provided"} />
              <Field
                label="Current Position"
                value={
                  [application.currentPosition, application.currentCompany]
                    .filter(Boolean)
                    .join(" at ") || "Not provided"
                }
              />
              <Field
                label="Years of Experience"
                value={
                  application.yearsOfExperience === null
                    ? "Not provided"
                    : `${application.yearsOfExperience} ${application.yearsOfExperience === 1 ? "year" : "years"}`
                }
              />
              <Field
                label="LinkedIn"
                value={application.linkedinUrl ?? "Not provided"}
              />
              <Field
                label="Portfolio"
                value={application.portfolioUrl ?? "Not provided"}
              />
            </dl>
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">
              Professional Profile
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-zinc-400">Skills</p>
                {application.skills.length === 0 ? (
                  <p className="mt-1 text-sm text-zinc-400">No skills added yet.</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {application.skills.map((skill) => (
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
              <div>
                <p className="text-xs font-medium text-zinc-400">Education</p>
                {application.education.length === 0 ? (
                  <p className="mt-1 text-sm text-zinc-400">
                    No education records added yet.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-3 divide-y divide-zinc-100 dark:divide-zinc-900">
                    {application.education.map((entry) => (
                      <li key={entry.id} className="pt-3 first:pt-0">
                        <p className="text-sm font-medium text-white">
                          {entry.degree}
                          {entry.fieldOfStudy ? ` in ${entry.fieldOfStudy}` : ""}
                        </p>
                        <p className="text-sm text-zinc-200">
                          {entry.institutionName}
                        </p>
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
            </div>
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">Cover Letter</h2>
            {application.coverLetter ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                {application.coverLetter}
              </p>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">No cover letter provided.</p>
            )}
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">Job Information</h2>
            {application.job ? (
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Job Title" value={application.job.title} />
                <Field label="Department" value={application.job.department ?? "Not specified"} />
                <Field
                  label="Location"
                  value={
                    application.job.isRemote
                      ? [application.job.location, "Remote"].filter(Boolean).join(" · ")
                      : application.job.location ?? "Not specified"
                  }
                />
                <Field
                  label="Employment Type"
                  value={EMPLOYMENT_TYPE_LABELS[application.job.employmentType]}
                />
                <Field
                  label="Salary Range"
                  value={formatSalaryRange(application.job.salaryMin, application.job.salaryMax)}
                />
              </dl>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">
                This job posting is no longer available.
              </p>
            )}
          </div>

          <AIInterviewAssistantLazy
            applicationId={application.id}
            initialQuestions={interviewQuestions?.questions ?? null}
          />
        </div>

        <div className="space-y-6">
          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">Resume</h2>
            <a
              href={`/hr/applications/${application.id}/resume`}
              className={`${BTN_PRIMARY} w-full`}
            >
              Download Resume
            </a>
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">
              Application Details
            </h2>
            <dl className="mt-4 space-y-4">
              <Field label="Expected Salary" value={formatSalary(application.expectedSalary)} />
              <Field label="Notice Period" value={formatNoticePeriod(application.noticePeriod)} />
              <Field label="Submitted" value={formatDate(application.submittedAt)} />
              <div>
                <dt className="text-xs font-medium text-zinc-400">
                  Application Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={application.status} />
                </dd>
              </div>
            </dl>
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">
              Interview Management
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Schedule, edit, reschedule, or cancel interviews for this candidate.
            </p>
            <div className="mt-4">
              <InterviewManagement
                applicationId={application.id}
                interview={interviewForClient}
                emailContext={emailContext}
                minInterviewDate={minInterviewDate}
              />
            </div>
          </div>

          <div className={DETAIL_SECTION}>
            <AIEmailAssistantCard context={emailContext} />
          </div>

          <div className={DETAIL_SECTION}>
            <h2 className="text-base font-semibold text-white">
              Status Management
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Every change is recorded in this application&apos;s status history.
            </p>
            <div className="mt-4">
              <StatusUpdateForm
                applicationId={application.id}
                currentStatus={application.status}
                emailContext={emailContext}
                minInterviewDate={minInterviewDate}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={DETAIL_SECTION}>
        <h2 className="text-base font-semibold text-white">HR Notes</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Internal notes visible to HR/admin only — candidates never see these.
        </p>

        <div className="mt-4">
          <AddNoteForm applicationId={application.id} />
        </div>

        {notes.length > 0 ? (
          <ul className="mt-6 space-y-4 divide-y divide-zinc-100 dark:divide-zinc-900">
            {notes.map((note) => (
              <li key={note.id} className="pt-4 first:pt-0">
                <p className="whitespace-pre-wrap text-sm text-zinc-200">{note.note}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {note.authorName ?? "HR"} · {formatDate(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-zinc-400">No notes yet.</p>
        )}
      </div>
    </div>
  );
}
