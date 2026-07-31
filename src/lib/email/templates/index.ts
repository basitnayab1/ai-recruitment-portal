import type { EmailContent } from "@/lib/email/templates/layout";
import { escapeHtml, renderDetailsTable, renderEmailLayout } from "@/lib/email/templates/layout";

export function accountCreatedTemplate({
  appName,
  candidateName,
}: {
  appName: string;
  candidateName: string;
}): EmailContent {
  const subject = `Welcome to ${appName}`;
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Welcome, ${escapeHtml(candidateName)}!</h1>
    <p style="margin:0 0 16px;">Your candidate account has been created successfully.</p>
    <p style="margin:0;">You can sign in to complete your profile, upload your resume, and apply for open positions.</p>
    <p style="margin:16px 0 0;">If email verification is enabled for your account, please confirm your email address using the link sent separately before signing in.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({ appName, title: subject, bodyHtml }),
    text: [
      `Welcome, ${candidateName}!`,
      "",
      "Your candidate account has been created successfully.",
      "You can sign in to complete your profile, upload your resume, and apply for open positions.",
      "",
      "If email verification is enabled, please confirm your email using the separate verification message before signing in.",
    ].join("\n"),
  };
}

export function applicationSubmittedCandidateTemplate({
  appName,
  candidateName,
  jobTitle,
  applicationDate,
}: {
  appName: string;
  candidateName: string;
  jobTitle: string;
  applicationDate: string;
}): EmailContent {
  const subject = "Application Received";
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Application Received</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(candidateName)}, thank you for applying. We have received your application.</p>
    ${renderDetailsTable([
      { label: "Candidate", value: candidateName },
      { label: "Job Title", value: jobTitle },
      { label: "Application Date", value: applicationDate },
    ])}
    <p style="margin:16px 0 0;">Our recruitment team will review your application and update you on its status.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({ appName, title: subject, bodyHtml }),
    text: [
      "Application Received",
      "",
      `Hi ${candidateName}, thank you for applying. We have received your application.`,
      "",
      `Candidate: ${candidateName}`,
      `Job Title: ${jobTitle}`,
      `Application Date: ${applicationDate}`,
      "",
      "Our recruitment team will review your application and update you on its status.",
    ].join("\n"),
  };
}

export function applicationStatusChangedTemplate({
  appName,
  candidateName,
  jobTitle,
  statusLabel,
}: {
  appName: string;
  candidateName: string;
  jobTitle: string;
  statusLabel: string;
}): EmailContent {
  const subject = `Application Update: ${statusLabel}`;
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Application Status Updated</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(candidateName)}, the status of your application has been updated.</p>
    ${renderDetailsTable([
      { label: "Job Title", value: jobTitle },
      { label: "New Status", value: statusLabel },
    ])}
    <p style="margin:16px 0 0;">Sign in to your candidate portal to view the latest details.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({ appName, title: subject, bodyHtml }),
    text: [
      "Application Status Updated",
      "",
      `Hi ${candidateName}, the status of your application has been updated.`,
      "",
      `Job Title: ${jobTitle}`,
      `New Status: ${statusLabel}`,
      "",
      "Sign in to your candidate portal to view the latest details.",
    ].join("\n"),
  };
}

export function interviewScheduledTemplate({
  appName,
  candidateName,
  jobTitle,
  interviewerName,
  interviewTypeLabel,
  interviewDate,
  interviewTime,
  timezone,
  durationLabel,
  locationOrLink,
}: {
  appName: string;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  interviewTypeLabel: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  durationLabel: string;
  locationOrLink: string;
}): EmailContent {
  const subject = "Interview Scheduled";
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Interview Scheduled</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(candidateName)}, your interview has been scheduled for the following role.</p>
    ${renderDetailsTable([
      { label: "Job Title", value: jobTitle },
      { label: "Interviewer", value: interviewerName },
      { label: "Type", value: interviewTypeLabel },
      { label: "Date", value: interviewDate },
      { label: "Time", value: interviewTime },
      { label: "Time Zone", value: timezone },
      { label: "Duration", value: durationLabel },
      { label: "Location / Link", value: locationOrLink },
    ])}
    <p style="margin:16px 0 0;">Please arrive on time or join the meeting link a few minutes early. Sign in to your candidate portal to view full interview details.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({ appName, title: subject, bodyHtml }),
    text: [
      "Interview Scheduled",
      "",
      `Hi ${candidateName}, your interview has been scheduled for the following role.`,
      "",
      `Job Title: ${jobTitle}`,
      `Interviewer: ${interviewerName}`,
      `Type: ${interviewTypeLabel}`,
      `Date: ${interviewDate}`,
      `Time: ${interviewTime}`,
      `Time Zone: ${timezone}`,
      `Duration: ${durationLabel}`,
      `Location / Link: ${locationOrLink}`,
      "",
      "Sign in to your candidate portal to view full interview details.",
    ].join("\n"),
  };
}

export function interviewRescheduledTemplate({
  appName,
  candidateName,
  jobTitle,
  interviewerName,
  interviewTypeLabel,
  interviewDate,
  interviewTime,
  timezone,
  durationLabel,
  locationOrLink,
}: {
  appName: string;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  interviewTypeLabel: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  durationLabel: string;
  locationOrLink: string;
}): EmailContent {
  const subject = "Interview Rescheduled";
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Interview Rescheduled</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(candidateName)}, your interview details have been updated for the following role.</p>
    ${renderDetailsTable([
      { label: "Job Title", value: jobTitle },
      { label: "Interviewer", value: interviewerName },
      { label: "Type", value: interviewTypeLabel },
      { label: "New Date", value: interviewDate },
      { label: "New Time", value: interviewTime },
      { label: "Time Zone", value: timezone },
      { label: "Duration", value: durationLabel },
      { label: "Location / Link", value: locationOrLink },
    ])}
    <p style="margin:16px 0 0;">Please review the updated schedule in your candidate portal.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({ appName, title: subject, bodyHtml }),
    text: [
      "Interview Rescheduled",
      "",
      `Hi ${candidateName}, your interview details have been updated.`,
      "",
      `Job Title: ${jobTitle}`,
      `Interviewer: ${interviewerName}`,
      `New Date: ${interviewDate}`,
      `New Time: ${interviewTime}`,
      `Time Zone: ${timezone}`,
      `Location / Link: ${locationOrLink}`,
    ].join("\n"),
  };
}

export function interviewCancelledTemplate({
  appName,
  candidateName,
  jobTitle,
  interviewDate,
  interviewTime,
}: {
  appName: string;
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
}): EmailContent {
  const subject = "Interview Cancelled";
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Interview Cancelled</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(candidateName)}, your upcoming interview for the following role has been cancelled.</p>
    ${renderDetailsTable([
      { label: "Job Title", value: jobTitle },
      { label: "Date", value: interviewDate },
      { label: "Time", value: interviewTime },
    ])}
    <p style="margin:16px 0 0;">Our HR team will contact you if a new interview is scheduled.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({ appName, title: subject, bodyHtml }),
    text: [
      "Interview Cancelled",
      "",
      `Hi ${candidateName}, your upcoming interview has been cancelled.`,
      "",
      `Job Title: ${jobTitle}`,
      `Date: ${interviewDate}`,
      `Time: ${interviewTime}`,
    ].join("\n"),
  };
}

export function newApplicationHrTemplate({
  appName,
  candidateName,
  jobTitle,
  applicationDate,
}: {
  appName: string;
  candidateName: string;
  jobTitle: string;
  applicationDate: string;
}): EmailContent {
  const subject = `New Application: ${candidateName} — ${jobTitle}`;
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">New Application Submitted</h1>
    <p style="margin:0 0 16px;">A candidate has submitted a new job application.</p>
    ${renderDetailsTable([
      { label: "Candidate", value: candidateName },
      { label: "Job Title", value: jobTitle },
      { label: "Application Date", value: applicationDate },
    ])}
    <p style="margin:16px 0 0;">Sign in to the HR portal to review this application.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({ appName, title: subject, bodyHtml }),
    text: [
      "New Application Submitted",
      "",
      `Candidate: ${candidateName}`,
      `Job Title: ${jobTitle}`,
      `Application Date: ${applicationDate}`,
      "",
      "Sign in to the HR portal to review this application.",
    ].join("\n"),
  };
}
