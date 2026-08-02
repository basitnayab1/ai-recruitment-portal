"use server";

import { revalidatePath } from "next/cache";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getCandidateResume, RESUME_BUCKET } from "@/lib/candidate/resume-data";

export type UploadResumeState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

export type DeleteResumeState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const PDF_MIME_TYPE = "application/pdf";
const PDF_MAGIC = "%PDF-";

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const base = cleaned.slice(-100) || "resume.pdf";
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

// Some browsers/OSes report an empty or generic `file.type` for a PDF
// depending on how the file was created, so the extension is also checked
// as a fallback — the upload is still always stored with `contentType:
// "application/pdf"` regardless of what the browser reported.
function hasPdfExtensionAndMime(file: File): boolean {
  const nameOk = file.name.toLowerCase().endsWith(".pdf");
  const mimeOk = !file.type || file.type === PDF_MIME_TYPE || file.type === "application/octet-stream";
  return nameOk && mimeOk;
}

async function hasPdfMagicBytes(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const magic = String.fromCharCode(...header);
  return magic === PDF_MAGIC;
}

/**
 * Server Action backing the résumé upload form on /candidate/resume.
 * Uploads through the caller's own authenticated Supabase session (never
 * the service-role key) to the private "resumes" Storage bucket — RLS on
 * `storage.objects` (see 004 migration) only allows writing under the
 * caller's own `${candidate_id}/` folder, so a candidate can never
 * overwrite another candidate's file even if they guessed a path.
 *
 * Replacing an existing résumé uploads the new file first, then removes
 * the previous object only after the new `candidate_resumes` row is
 * safely recorded, to avoid ever leaving a candidate with no résumé on
 * file if something fails partway through.
 */
export async function uploadResume(
  _prevState: UploadResumeState,
  formData: FormData
): Promise<UploadResumeState> {
  const profile = await requireCandidateUser();

  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Please choose a resume file to upload." };
  }
  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return { status: "error", message: "Resume must be smaller than 5 MB." };
  }
  if (!hasPdfExtensionAndMime(file)) {
    return { status: "error", message: "Please upload a PDF file (.pdf)." };
  }
  if (!(await hasPdfMagicBytes(file))) {
    return {
      status: "error",
      message: "File content is not a valid PDF. Please upload a real PDF resume.",
    };
  }

  const safeFileName = sanitizeFileName(file.name);
  const supabase = await createClient();
  const existing = await getCandidateResume(profile.id);
  const storagePath = `${profile.id}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage.from(RESUME_BUCKET).upload(storagePath, file, {
    contentType: PDF_MIME_TYPE,
    upsert: false,
  });

  if (uploadError) {
    return {
      status: "error",
      message: uploadError.message,
    };
  }

  const { error: dbError } = await supabase.from("candidate_resumes").upsert(
    {
      candidate_id: profile.id,
      storage_path: storagePath,
      file_name: safeFileName,
      file_size: file.size,
      mime_type: PDF_MIME_TYPE,
      uploaded_at: new Date().toISOString(),
    },
    { onConflict: "candidate_id" }
  );

  if (dbError) {
    // Best-effort cleanup of the object we just uploaded but couldn't record.
    await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
    return {
      status: "error",
      message: dbError.message,
    };
  }

  if (existing && existing.storagePath !== storagePath) {
    await supabase.storage.from(RESUME_BUCKET).remove([existing.storagePath]);
  }

  revalidatePath("/candidate/resume");
  revalidatePath("/candidate");

  return { status: "success", message: "Resume uploaded successfully." };
}

/**
 * Server Action backing the "Delete" button on /candidate/resume. Deletes
 * the `candidate_resumes` row before removing the Storage object, so a
 * failure partway through can only ever leave an orphaned file (harmless)
 * rather than a DB row that points at a file that's already gone.
 */
export async function deleteResume(
  _prevState: DeleteResumeState,
  _formData: FormData
): Promise<DeleteResumeState> {
  void _prevState;
  void _formData;
  const profile = await requireCandidateUser();

  const existing = await getCandidateResume(profile.id);
  if (!existing) {
    return { status: "error", message: "No resume found to delete." };
  }

  const supabase = await createClient();

  const { error: dbError } = await supabase
    .from("candidate_resumes")
    .delete()
    .eq("candidate_id", profile.id);

  if (dbError) {
    return {
      status: "error",
      message: "Something went wrong deleting your resume. Please try again.",
    };
  }

  await supabase.storage.from(RESUME_BUCKET).remove([existing.storagePath]);

  revalidatePath("/candidate/resume");
  revalidatePath("/candidate");

  return { status: "success", message: "Resume deleted." };
}
