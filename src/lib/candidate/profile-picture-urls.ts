import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_PICTURE_BUCKET } from "@/lib/candidate/profile-picture-constants";

/** Signed URLs for display — long enough for a page session, short enough to stay private. */
export const PROFILE_PICTURE_SIGNED_URL_TTL_SECONDS = 3600;

type StoragePathRow = {
  candidate_id: string;
  storage_path: string;
};

/**
 * Signed URL for the authenticated candidate's own picture (Storage RLS on
 * `${auth.uid()}/…`). Falls back to the admin client when the user session
 * cannot sign (same pattern as HR resume downloads).
 */
export async function createCandidateProfilePictureSignedUrl(
  storagePath: string
): Promise<string | null> {
  const trimmedPath = storagePath.trim();
  if (!trimmedPath) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(PROFILE_PICTURE_BUCKET)
    .createSignedUrl(trimmedPath, PROFILE_PICTURE_SIGNED_URL_TTL_SECONDS);

  if (!error && data?.signedUrl) {
    return data.signedUrl;
  }

  const supabaseAdmin = createAdminClient();
  const adminResult = await supabaseAdmin.storage
    .from(PROFILE_PICTURE_BUCKET)
    .createSignedUrl(trimmedPath, PROFILE_PICTURE_SIGNED_URL_TTL_SECONDS);

  if (adminResult.error || !adminResult.data?.signedUrl) {
    console.error("[profile-picture-urls] createSignedUrl failed.", {
      storagePath: trimmedPath,
      userMessage: error?.message ?? null,
      adminMessage: adminResult.error?.message ?? null,
    });
    return null;
  }

  return adminResult.data.signedUrl;
}

/**
 * Signed URL for HR display — always uses the server-only admin client after
 * HR authorization checks elsewhere (see src/lib/hr/resume-download.ts).
 */
export async function createHRProfilePictureSignedUrl(storagePath: string): Promise<string | null> {
  const trimmedPath = storagePath.trim();
  if (!trimmedPath) {
    return null;
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.storage
    .from(PROFILE_PICTURE_BUCKET)
    .createSignedUrl(trimmedPath, PROFILE_PICTURE_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("[profile-picture-urls] HR createSignedUrl failed.", {
      storagePath: trimmedPath,
      message: error?.message ?? null,
    });
    return null;
  }

  return data.signedUrl;
}

/**
 * Batch-resolve signed display URLs for many candidates (HR lists, activity log).
 */
export async function getHRProfilePictureSignedUrlsByCandidateIds(
  candidateIds: string[]
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(candidateIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidate_profile_pictures")
    .select("candidate_id, storage_path")
    .in("candidate_id", uniqueIds);

  if (error) {
    console.error("[profile-picture-urls] Failed to load storage paths:", error.message);
    return new Map();
  }

  const rows = (data ?? []) as StoragePathRow[];
  const entries = await Promise.all(
    rows.map(async (row) => {
      const signedUrl = await createHRProfilePictureSignedUrl(row.storage_path);
      return signedUrl ? ([row.candidate_id, signedUrl] as const) : null;
    })
  );

  return new Map(entries.filter((entry): entry is readonly [string, string] => entry !== null));
}

export async function getHRProfilePictureSignedUrlForCandidate(
  candidateId: string
): Promise<string | null> {
  const urls = await getHRProfilePictureSignedUrlsByCandidateIds([candidateId]);
  return urls.get(candidateId) ?? null;
}
