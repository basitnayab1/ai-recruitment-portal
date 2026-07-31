import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { PROFILE_PICTURE_BUCKET } from "@/lib/candidate/profile-picture-constants";

export type HRProfilePictureResult =
  | { ok: true; data: Blob; mimeType: string }
  | { ok: false; message: string; status: 404 | 500 };

/**
 * Downloads a candidate profile picture from Storage for HR-facing routes
 * that have already verified HR access and resolved `storagePath` from DB.
 */
export async function downloadHRProfilePicture(
  storagePath: string,
  context: { source: string; resourceId: string }
): Promise<HRProfilePictureResult> {
  const trimmedPath = storagePath.trim();
  if (!trimmedPath) {
    return { ok: false, message: "Missing storage path for this profile picture.", status: 404 };
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.storage.from(PROFILE_PICTURE_BUCKET).download(trimmedPath);

  if (error || !data) {
    console.error("[hr/profile-picture-download] download failed.", {
      source: context.source,
      resourceId: context.resourceId,
      bucket: PROFILE_PICTURE_BUCKET,
      storagePath: trimmedPath,
      message: error?.message ?? null,
    });
    return {
      ok: false,
      message: error?.message ?? "Could not load profile picture.",
      status: 500,
    };
  }

  return { ok: true, data, mimeType: data.type || "image/webp" };
}
