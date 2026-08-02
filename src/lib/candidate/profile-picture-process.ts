import "server-only";

import {
  ALLOWED_PROFILE_PICTURE_MIME_TYPES,
  PROFILE_PICTURE_MAX_DIMENSION,
  type AllowedProfilePictureMimeType,
} from "@/lib/candidate/profile-picture-constants";

export type ProcessedProfilePicture = {
  buffer: Buffer;
  mimeType: AllowedProfilePictureMimeType;
  fileName: string;
  fileSize: number;
};

function extensionForMimeType(mimeType: AllowedProfilePictureMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

function normalizeMimeType(file: File): AllowedProfilePictureMimeType | null {
  if ((ALLOWED_PROFILE_PICTURE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return file.type as AllowedProfilePictureMimeType;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "webp") {
    return "image/webp";
  }

  return null;
}

/**
 * Resize and normalize profile pictures before upload. Large images are
 * scaled down to fit within PROFILE_PICTURE_MAX_DIMENSION while preserving
 * aspect ratio. JPEG/PNG inputs are converted to WebP for smaller storage.
 */
export async function processProfilePicture(file: File): Promise<ProcessedProfilePicture | null> {
  const sourceMimeType = normalizeMimeType(file);
  if (!sourceMimeType) {
    return null;
  }

  // Lazy-load sharp so unrelated server actions on the profile page are not
  // crashed by a broken native sharp binary at module-eval time. Catch load
  // failures too — an uncaught sharp DLOPEN error can kill the Next.js
  // process and surface as "Failed to fetch" on later Server Actions.
  try {
    const sharp = (await import("sharp")).default;

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    let pipeline = sharp(inputBuffer, { failOn: "none" }).rotate();

    const metadata = await pipeline.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (width > PROFILE_PICTURE_MAX_DIMENSION || height > PROFILE_PICTURE_MAX_DIMENSION) {
      pipeline = pipeline.resize(PROFILE_PICTURE_MAX_DIMENSION, PROFILE_PICTURE_MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const buffer = await pipeline.webp({ quality: 85 }).toBuffer();
    const mimeType: AllowedProfilePictureMimeType = "image/webp";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-picture";
    const sanitizedBaseName =
      baseName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "profile-picture";

    return {
      buffer,
      mimeType,
      fileName: `${sanitizedBaseName}.${extensionForMimeType(mimeType)}`,
      fileSize: buffer.byteLength,
    };
  } catch (error) {
    console.error("[candidate/profile-picture-process] sharp processing failed:", error);
    return null;
  }
}
