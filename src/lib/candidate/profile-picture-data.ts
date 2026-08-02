import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_PICTURE_BUCKET } from "@/lib/candidate/profile-picture-constants";

export type CandidateProfilePicture = {
  candidateId: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
};

type CandidateProfilePictureRow = {
  candidate_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
};

function mapRow(row: CandidateProfilePictureRow): CandidateProfilePicture {
  return {
    candidateId: row.candidate_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    uploadedAt: row.uploaded_at,
  };
}

export const getCandidateProfilePicture = cache(
  async (candidateId: string): Promise<CandidateProfilePicture | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("candidate_profile_pictures")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (error) {
      console.error("[profile-picture-data] Failed to load profile picture:", error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapRow(data as CandidateProfilePictureRow);
  }
);

/**
 * Returns the set of candidate ids that currently have a profile picture on file.
 */
export async function getCandidateIdsWithProfilePictures(
  candidateIds: string[]
): Promise<Set<string>> {
  if (candidateIds.length === 0) {
    return new Set();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidate_profile_pictures")
    .select("candidate_id")
    .in("candidate_id", candidateIds);

  if (error) {
    console.error("[profile-picture-data] Failed to load picture index:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => (row as { candidate_id: string }).candidate_id));
}

export { PROFILE_PICTURE_BUCKET };
