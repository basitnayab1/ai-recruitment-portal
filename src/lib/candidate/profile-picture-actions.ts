"use server";

import { revalidatePath } from "next/cache";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  getCandidateProfilePicture,
  PROFILE_PICTURE_BUCKET,
} from "@/lib/candidate/profile-picture-data";
import {
  isAllowedProfilePictureFile,
  MAX_PROFILE_PICTURE_SIZE_BYTES,
} from "@/lib/candidate/profile-picture-constants";
import { processProfilePicture } from "@/lib/candidate/profile-picture-process";

export type UploadProfilePictureState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

export type DeleteProfilePictureState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(-100) || "profile-picture.webp";
}

export async function uploadProfilePicture(
  _prevState: UploadProfilePictureState,
  formData: FormData
): Promise<UploadProfilePictureState> {
  const profile = await requireCandidateUser();

  const file = formData.get("picture");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Please choose a profile picture to upload." };
  }
  if (file.size > MAX_PROFILE_PICTURE_SIZE_BYTES) {
    return { status: "error", message: "Profile picture must be smaller than 5 MB." };
  }
  if (!isAllowedProfilePictureFile(file)) {
    return { status: "error", message: "Please upload a JPG, PNG, or WEBP image." };
  }

  const processed = await processProfilePicture(file);
  if (!processed) {
    return {
      status: "error",
      message: "We couldn't process that image. Please try a different JPG, PNG, or WEBP file.",
    };
  }

  const supabase = await createClient();
  const existing = await getCandidateProfilePicture(profile.id);
  const storagePath = `${profile.id}/${Date.now()}-${sanitizeFileName(processed.fileName)}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_PICTURE_BUCKET)
    .upload(storagePath, processed.buffer, {
      contentType: processed.mimeType,
      upsert: false,
    });

  if (uploadError) {
    return { status: "error", message: uploadError.message };
  }

  const { error: dbError } = await supabase.from("candidate_profile_pictures").upsert(
    {
      candidate_id: profile.id,
      storage_path: storagePath,
      file_name: processed.fileName,
      file_size: processed.fileSize,
      mime_type: processed.mimeType,
      uploaded_at: new Date().toISOString(),
    },
    { onConflict: "candidate_id" }
  );

  if (dbError) {
    await supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([storagePath]);
    return { status: "error", message: dbError.message };
  }

  if (existing && existing.storagePath !== storagePath) {
    await supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([existing.storagePath]);
  }

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate");
  revalidatePath("/candidate/profile/picture");

  return {
    status: "success",
    message: existing ? "Profile picture updated." : "Profile picture uploaded.",
  };
}

export async function deleteProfilePicture(
  _prevState: DeleteProfilePictureState,
  _formData: FormData
): Promise<DeleteProfilePictureState> {
  void _prevState;
  void _formData;
  const profile = await requireCandidateUser();

  const existing = await getCandidateProfilePicture(profile.id);
  if (!existing) {
    return { status: "error", message: "No profile picture found to remove." };
  }

  const supabase = await createClient();

  const { error: dbError } = await supabase
    .from("candidate_profile_pictures")
    .delete()
    .eq("candidate_id", profile.id);

  if (dbError) {
    return {
      status: "error",
      message: "Something went wrong removing your profile picture. Please try again.",
    };
  }

  await supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([existing.storagePath]);

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate");
  revalidatePath("/candidate/profile/picture");

  return { status: "success", message: "Profile picture removed." };
}
