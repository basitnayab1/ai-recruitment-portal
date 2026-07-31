import "server-only";

import { formatEmailFrom, getEmailConfig } from "@/lib/email/config";
import { getResendClient } from "@/lib/email/transport";
import type { EmailContent } from "@/lib/email/templates/layout";

export type SendEmailInput = {
  to: string | string[];
  content: EmailContent;
  context: string;
};

/**
 * Sends a single email through Resend. Never throws — failures are logged
 * and the caller's main workflow continues unaffected.
 */
export async function sendEmail({ to, content, context }: SendEmailInput): Promise<void> {
  const config = getEmailConfig();
  const recipients = (Array.isArray(to) ? to : [to]).map((email) => email.trim()).filter(Boolean);

  if (recipients.length === 0) {
    console.warn(`[email] Skipped send (${context}): no recipients.`);
    return;
  }

  if (!config.enabled) {
    console.warn(`[email] Skipped send (${context}): Resend is not configured.`, {
      recipients,
      subject: content.subject,
    });
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn(`[email] Skipped send (${context}): Resend client unavailable.`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: formatEmailFrom(config),
      to: recipients,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (error) {
      console.error(`[email] Failed to send (${context}).`, {
        recipients,
        subject: content.subject,
        error: error.message,
        name: error.name,
      });
    }
  } catch (error) {
    console.error(`[email] Failed to send (${context}).`, {
      recipients,
      subject: content.subject,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
