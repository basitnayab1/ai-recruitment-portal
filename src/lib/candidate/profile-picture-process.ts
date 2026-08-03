import "server-only";

import sharp from "sharp";
import {
  ALLOWED_PROFILE_PICTURE_MIME_TYPES,
  MAX_PROFILE_PICTURE_SIZE_BYTES,
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

function buildFileName(file: File, mimeType: AllowedProfilePictureMimeType): string {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-picture";
  const sanitizedBaseName =
    baseName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "profile-picture";
  return `${sanitizedBaseName}.${extensionForMimeType(mimeType)}`;
}

async function buildResizedWebp(
  inputBuffer: Buffer,
  maxDimension: number,
  quality: number
): Promise<Buffer> {
  let pipeline = sharp(inputBuffer, { failOn: "none" }).rotate();
  const metadata = await pipeline.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  // Existing resize behavior: fit inside PROFILE_PICTURE_MAX_DIMENSION (or a
  // smaller dimension when further compression is required).
  if (width > maxDimension || height > maxDimension) {
    pipeline = pipeline.resize(maxDimension, maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  return pipeline.webp({ quality }).toBuffer();
}

/**
 * Prepare a profile picture for upload.
 * - Images already ≤ 1 MB are returned as-is after a readability check.
 * - Larger images use the existing resize/WebP compression path (max dimension,
 *   then lower quality / smaller dimensions) until under the limit.
 */
export async function processProfilePicture(file: File): Promise<ProcessedProfilePicture | null> {
  const sourceMimeType = normalizeMimeType(file);
  if (!sourceMimeType) {
    return null;
  }

  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    const metadata = await sharp(inputBuffer, { failOn: "none" }).metadata();
    if (!metadata.width || !metadata.height) {
      return null;
    }

    // Already under the final size limit — upload without compression.
    if (inputBuffer.byteLength <= MAX_PROFILE_PICTURE_SIZE_BYTES) {
      return {
        buffer: inputBuffer,
        mimeType: sourceMimeType,
        fileName: buildFileName(file, sourceMimeType),
        fileSize: inputBuffer.byteLength,
      };
    }

    // Existing behavior for oversized originals: max-dimension resize + WebP quality 85.
    let buffer = await buildResizedWebp(inputBuffer, PROFILE_PICTURE_MAX_DIMENSION, 85);

    // If still over 1 MB, keep compressing until under the limit.
    if (buffer.byteLength > MAX_PROFILE_PICTURE_SIZE_BYTES) {
      for (const quality of [75, 65, 55, 45, 35, 25]) {
        buffer = await buildResizedWebp(inputBuffer, PROFILE_PICTURE_MAX_DIMENSION, quality);
        if (buffer.byteLength <= MAX_PROFILE_PICTURE_SIZE_BYTES) break;
      }
    }

    if (buffer.byteLength > MAX_PROFILE_PICTURE_SIZE_BYTES) {
      for (const dimension of [384, 256, 192, 128]) {
        buffer = await buildResizedWebp(inputBuffer, dimension, 25);
        if (buffer.byteLength <= MAX_PROFILE_PICTURE_SIZE_BYTES) break;
      }
    }

    const mimeType: AllowedProfilePictureMimeType = "image/webp";

    return {
      buffer,
      mimeType,
      fileName: buildFileName(file, mimeType),
      fileSize: buffer.byteLength,
    };
  } catch (error) {
    console.error("[candidate/profile-picture-process] sharp processing failed:", error);
    return null;
  }
}
