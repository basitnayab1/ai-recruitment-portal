import type { EmailTone, EmailType } from "@/lib/ai/types";

/** Client-safe labels (no generator system prompts). */
export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  interview_invitation: "Interview Invitation",
  interview_reminder: "Interview Reminder",
  interview_reschedule: "Interview Reschedule",
  interview_cancellation: "Interview Cancellation",
  rejection: "Rejection Email",
  offer_letter: "Offer Letter",
  follow_up: "Follow-up Email",
  general: "General HR Communication",
};

export const EMAIL_TONE_LABELS: Record<EmailTone, string> = {
  professional: "Professional",
  friendly: "Friendly",
  formal: "Formal",
};
