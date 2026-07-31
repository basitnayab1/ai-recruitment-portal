import "server-only";

export type EmailConfig = {
  enabled: boolean;
  fromAddress: string;
  fromName: string;
  appName: string;
};

/**
 * Reads email configuration from environment variables. When `RESEND_API_KEY`
 * or `EMAIL_FROM` is missing, `enabled` is false and every send is skipped
 * (logged only) — the main application workflow is never blocked.
 */
export function getEmailConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const fromAddress = process.env.EMAIL_FROM?.trim() ?? "";

  return {
    enabled: Boolean(apiKey && fromAddress),
    fromAddress,
    fromName: process.env.EMAIL_FROM_NAME?.trim() || "AI Recruitment Portal",
    appName: process.env.APP_NAME?.trim() || "AI Recruitment Portal",
  };
}

export function formatEmailFrom(config: EmailConfig): string {
  return `"${config.fromName}" <${config.fromAddress}>`;
}
