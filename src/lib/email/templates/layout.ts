import "server-only";

export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmailLayout({
  appName,
  title,
  bodyHtml,
}: {
  appName: string;
  title: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:#18181b;color:#ffffff;font-size:18px;font-weight:600;">
                ${escapeHtml(appName)}
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;">
                This is an automated message from ${escapeHtml(appName)}. Please do not reply directly to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderDetailsTable(rows: { label: string; value: string }[]): string {
  const items = rows
    .map(
      (row) => `<tr>
        <td style="padding:8px 0;color:#71717a;width:140px;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:8px 0;color:#18181b;vertical-align:top;">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 0;">${items}</table>`;
}
