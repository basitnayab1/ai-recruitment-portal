import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const RESUME_BUCKET = "resumes";

export type CandidateResume = {
  candidateId: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
};

type CandidateResumeRow = {
  candidate_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
};

/**
 * Loads the caller's own résumé record (candidate_resumes — see
 * supabase/migrations/004_candidate_job_applications.sql), using the
 * caller's own authenticated session (RLS: `auth.uid() = candidate_id`).
 * Returns `null` when no résumé has been uploaded yet — not an error.
 */
export const getCandidateResume = cache(
  async (candidateId: string): Promise<CandidateResume | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("candidate_resumes")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as CandidateResumeRow;

    return {
      candidateId: row.candidate_id,
      storagePath: row.storage_path,
      fileName: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      uploadedAt: row.uploaded_at,
    };
  }
);

/**
 * Generates a short-lived signed URL for downloading the candidate's
 * current résumé, with `Content-Disposition: attachment` (via the
 * `download` option) so it saves under its original filename instead of
 * opening inline. The "resumes" bucket is private (see 004 migration), so
 * this is the only way to ever access it — never a public URL.
 */
export async function getResumeDownloadUrl(storagePath: string, fileName: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(storagePath, 300, { download: fileName });

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}
