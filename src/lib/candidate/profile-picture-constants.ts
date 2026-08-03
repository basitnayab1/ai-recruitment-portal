// Shared profile-picture constants — safe for Server and Client Components.

export const PROFILE_PICTURE_BUCKET = "profile-pictures";

export const MAX_PROFILE_PICTURE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export const ALLOWED_PROFILE_PICTURE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedProfilePictureMimeType = (typeof ALLOWED_PROFILE_PICTURE_MIME_TYPES)[number];

export const PROFILE_PICTURE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const PROFILE_PICTURE_MAX_DIMENSION = 512;

export function isAllowedProfilePictureMimeType(value: string): value is AllowedProfilePictureMimeType {
  return (ALLOWED_PROFILE_PICTURE_MIME_TYPES as readonly string[]).includes(value);
}

export function isAllowedProfilePictureFile(file: File): boolean {
  if (isAllowedProfilePictureMimeType(file.type)) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "webp";
}

export function hrCandidatePicturePath(candidateId: string): string {
  return `/hr/candidates/${candidateId}/picture`;
}

export const CANDIDATE_PROFILE_PICTURE_PATH = "/candidate/profile/picture";
