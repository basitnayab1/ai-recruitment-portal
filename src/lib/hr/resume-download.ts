import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { RESUME_BUCKET } from "@/lib/candidate/resume-data";

export type HRResumeSignedUrlResult =
  | { ok: true; signedUrl: string }
  | { ok: false; message: string };

/**
 * Creates a short-lived signed download URL for a résumé stored in the
 * private "resumes" bucket. Intended ONLY for HR resume route handlers
 * that have already called `requireHRUser()` and resolved `storagePath`
 * from a DB row HR is allowed to read.
 *
 * Why the admin (service-role) client:
 * Résumé objects live under `${candidate_id}/…` and Storage RLS only
 * grants SELECT on a candidate's own folder to that candidate
 * (`auth.uid() = folder`). Even with an "HR and admin can view resume
 * files" policy (005), `createSignedUrl()` via the HR user's normal
 * authenticated session can still fail when that policy has not been
 * applied or when Storage evaluates access differently for signing.
 * Using the service-role client here — strictly server-side, only after
 * HR identity + DB authorization — does not expose the secret key and
 * does not weaken candidate-facing Storage rules.
 */
export async function createHRResumeSignedUrl(
  storagePath: string,
  fileName: string,
  context: { source: string; resourceId: string }
): Promise<HRResumeSignedUrlResult> {
  const trimmedPath = storagePath.trim();
  if (!trimmedPath) {
    return { ok: false, message: "Missing storage path for this résumé." };
  }

  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(trimmedPath, 300, { download: fileName });

  if (error || !data?.signedUrl) {
    console.error("[hr/resume-download] createSignedUrl failed.", {
      source: context.source,
      resourceId: context.resourceId,
      bucket: RESUME_BUCKET,
      storagePath: trimmedPath,
      fileName,
      message: error?.message ?? null,
      name: error?.name ?? null,
      statusCode: (error as { statusCode?: string | number } | null)?.statusCode ?? null,
      error: error ?? null,
    });
    return {
      ok: false,
      message: error?.message ?? "Could not generate a download link.",
    };
  }

  return { ok: true, signedUrl: data.signedUrl };
}
