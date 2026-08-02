"use server";

import { generateHREmail } from "@/lib/ai/email-generator";
import {
  EmailGeneratorError,
  isEmailTone,
  isEmailType,
  type EmailGeneratorInput,
  type GeneratedEmail,
} from "@/lib/ai/types";
import { requireHRUser } from "@/lib/auth/dal";
import { getEmailConfig } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { sanitizeEmailHeader } from "@/lib/security/untrusted-text";
import { createClient } from "@/lib/supabase/server";

export type GenerateHREmailState =
  | { status: "success"; draft: GeneratedEmail }
  | { status: "error"; message: string }
  | undefined;

export type SendHREmailDraftState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

function defaultCompanyName(): string {
  return process.env.APP_NAME?.trim() || "AI Recruitment Portal";
}

function parseEmailGeneratorInput(formData: FormData): EmailGeneratorInput | { error: string } {
  const emailTypeRaw = String(formData.get("emailType") ?? "").trim();
  const toneRaw = String(formData.get("tone") ?? "professional").trim();

  if (!isEmailType(emailTypeRaw)) {
    return { error: "Invalid email type." };
  }

  const tone = isEmailTone(toneRaw) ? toneRaw : "professional";
  const candidateName = String(formData.get("candidateName") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim() || defaultCompanyName();

  if (!candidateName) {
    return { error: "Candidate name is required." };
  }
  if (!jobTitle) {
    return { error: "Job title is required." };
  }

  const interviewDate = String(formData.get("interviewDate") ?? "").trim();
  const interviewTime = String(formData.get("interviewTime") ?? "").trim();
  const interviewLocation = String(formData.get("interviewLocation") ?? "").trim();
  const hrNotes = String(formData.get("hrNotes") ?? "").trim();

  return {
    emailType: emailTypeRaw,
    tone,
    candidateName,
    jobTitle,
    companyName,
    interviewDate: interviewDate || null,
    interviewTime: interviewTime || null,
    interviewLocation: interviewLocation || null,
    hrNotes: hrNotes || null,
  };
}

function plainTextToHtml(text: string): string {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) {
    return `<p style="margin:0;">${escapeHtml(text.trim())}</p>`;
  }

  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;">${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
}

/**
 * Server Action: generate an HR email draft with Groq (does not send).
 */
export async function generateHREmailAction(
  _prevState: GenerateHREmailState,
  formData: FormData
): Promise<GenerateHREmailState> {
  try {
    const hr = await requireHRUser();

    const limit = checkRateLimit({
      key: rateLimitKey("hr-email-generate", hr.id),
      limit: 40,
      windowMs: 60 * 60 * 1000,
      message: "Email generation rate limit reached. Please try again later.",
    });
    if (!limit.ok) {
      return { status: "error", message: limit.message };
    }

    const parsed = parseEmailGeneratorInput(formData);
    if ("error" in parsed) {
      return { status: "error", message: parsed.error };
    }

    const draft = await generateHREmail(parsed);
    return { status: "success", draft };
  } catch (error) {
    if (error instanceof EmailGeneratorError) {
      return { status: "error", message: error.message };
    }

    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("GROQ_API_KEY")) {
      return {
        status: "error",
        message: "AI Email Assistant is not configured. Please set GROQ_API_KEY.",
      };
    }

    console.error("[hr/email-actions] Generate failed:", error);
    return { status: "error", message: "Email generation failed. Please try again." };
  }
}

/**
 * Server Action: send a reviewed email draft via the existing email transport.
 * Generation and sending are intentionally separate steps.
 *
 * Recipient is always loaded from the application row — never from client form fields.
 */
export async function sendHREmailDraftAction(
  _prevState: SendHREmailDraftState,
  formData: FormData
): Promise<SendHREmailDraftState> {
  try {
    const hr = await requireHRUser();

    const limit = checkRateLimit({
      key: rateLimitKey("hr-email-send", hr.id),
      limit: 30,
      windowMs: 60 * 60 * 1000,
      message: "Email send rate limit reached. Please try again later.",
    });
    if (!limit.ok) {
      return { status: "error", message: limit.message };
    }

    const subject = sanitizeEmailHeader(String(formData.get("subject") ?? ""), 200);
    const body = String(formData.get("body") ?? "").trim();
    const applicationId = String(formData.get("applicationId") ?? "").trim();

    if (!applicationId) {
      return { status: "error", message: "Missing application reference." };
    }
    if (!subject) {
      return { status: "error", message: "Email subject is required." };
    }
    if (!body) {
      return { status: "error", message: "Email body is required." };
    }
    if (body.length > 50_000) {
      return { status: "error", message: "Email body is too long." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("applications")
      .select("id, email, full_name")
      .eq("id", applicationId)
      .maybeSingle();

    if (error || !data) {
      return { status: "error", message: "Application not found." };
    }

    const row = data as { id: string; email: string; full_name: string };
    const candidateEmail = String(row.email ?? "").trim();
    if (!candidateEmail || !candidateEmail.includes("@")) {
      return { status: "error", message: "Application has no valid candidate email." };
    }

    const { appName } = getEmailConfig();
    const bodyHtml = plainTextToHtml(body);

    await sendEmail({
      to: candidateEmail,
      content: {
        subject,
        html: renderEmailLayout({ appName, title: subject, bodyHtml }),
        text: body,
      },
      context: `hr-email-draft-application-${applicationId}`,
    });

    return {
      status: "success",
      message: `Email sent to ${row.full_name || "the candidate"}.`,
    };
  } catch (error) {
    console.error("[hr/email-actions] Send failed:", error);
    return { status: "error", message: "Failed to send email. Please try again." };
  }
}
