import type { EmailGeneratorInput, EmailTone, EmailType } from "@/lib/ai/types";

export const EMAIL_GENERATOR_SYSTEM_PROMPT = `You are an expert HR communications writer for a recruitment platform.

Write professional candidate-facing emails based on the provided context.
You MUST respond with valid JSON only (no markdown fences) in this exact shape:
{
  "subject": "string — concise email subject line",
  "body": "string — full email body as plain text with paragraph breaks (use \\n\\n between paragraphs)",
  "shortSummary": "string — one sentence describing the email purpose for HR review"
}

Rules:
- Address the candidate by name when provided.
- Include relevant details: job title, company name, interview date/time/location when applicable.
- Match the requested tone: Professional (clear and courteous), Friendly (warm but still professional), Formal (structured and respectful).
- Do NOT invent specific salary figures, start dates, or legal terms unless provided in HR notes.
- Do NOT include placeholders like [INSERT DATE] — use provided values or omit gracefully.
- Sign off appropriately for HR/recruitment (e.g. "Best regards, The Hiring Team at {company}").
- Keep rejection emails empathetic and concise.
- Keep offer letters enthusiastic but avoid binding legal language unless HR notes specify details.
- Never include passwords, API keys, or internal system details.`;

const EMAIL_TYPE_INSTRUCTIONS: Record<EmailType, string> = {
  interview_invitation:
    "Write an interview invitation email confirming the scheduled interview details and what the candidate should prepare.",
  interview_reminder:
    "Write a friendly reminder email about an upcoming interview, restating date, time, and location/link.",
  interview_reschedule:
    "Write an interview rescheduling email apologizing for the change and clearly stating the new date, time, and location.",
  interview_cancellation:
    "Write an interview cancellation email that is respectful and explains the interview has been cancelled.",
  rejection:
    "Write a thoughtful rejection email thanking the candidate and encouraging them to apply for future roles when appropriate.",
  offer_letter:
    "Write an offer letter email expressing excitement to extend an offer, referencing the role and next steps from HR notes.",
  follow_up:
    "Write a follow-up email checking in with the candidate about their application or interview process.",
  general:
    "Write a general HR communication email based on the HR notes and context provided.",
};

const TONE_INSTRUCTIONS: Record<EmailTone, string> = {
  professional: "Use a professional, clear, and courteous tone.",
  friendly: "Use a warm, approachable tone while remaining professional.",
  formal: "Use a formal, structured tone suitable for official correspondence.",
};

export function buildEmailGeneratorUserPrompt(input: EmailGeneratorInput): string {
  const lines = [
    `Email type: ${input.emailType.replace(/_/g, " ")}`,
    EMAIL_TYPE_INSTRUCTIONS[input.emailType],
    `Tone: ${input.tone} — ${TONE_INSTRUCTIONS[input.tone]}`,
    "",
    "Context:",
    `- Candidate name: ${input.candidateName || "Not provided"}`,
    `- Job title: ${input.jobTitle || "Not provided"}`,
    `- Company name: ${input.companyName || "Not provided"}`,
  ];

  if (input.interviewDate?.trim()) {
    lines.push(`- Interview date: ${input.interviewDate.trim()}`);
  }
  if (input.interviewTime?.trim()) {
    lines.push(`- Interview time: ${input.interviewTime.trim()}`);
  }
  if (input.interviewLocation?.trim()) {
    lines.push(`- Interview location / link: ${input.interviewLocation.trim()}`);
  }
  if (input.hrNotes?.trim()) {
    lines.push(`- HR notes (incorporate where relevant): ${input.hrNotes.trim()}`);
  }

  return lines.join("\n");
}

/** Re-export from client-safe module (keeps system prompts out of client graphs). */
export { EMAIL_TYPE_LABELS, EMAIL_TONE_LABELS } from "@/lib/ai/email-labels";
