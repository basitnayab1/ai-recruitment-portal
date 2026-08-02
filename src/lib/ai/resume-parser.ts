import "server-only";

import { createHash } from "node:crypto";
import mammoth from "mammoth";
import { extractText } from "unpdf";
import { RESUME_BUCKET } from "@/lib/candidate/resume-data";
import { createAdminClient } from "@/lib/supabase/admin";

// unpdf may call Math.sumPrecise; polyfill when the runtime lacks it.
declare global {
  interface Math {
    sumPrecise(values: Iterable<number>): number;
  }
}

if (typeof Math.sumPrecise !== "function") {
  Math.sumPrecise = function sumPrecise(values: Iterable<number>): number {
    let total = 0;
    for (const value of values) total += Number(value) || 0;
    return total;
  };
}

export class ResumeParseError extends Error {
  override name = "ResumeParseError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

type ResumeFormat = "pdf" | "docx" | "txt";

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TXT_MIME = "text/plain";

/** SHA-256 hex digest of raw resume bytes — used to detect re-uploads and cache hits. */
export function computeResumeHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function detectResumeFormat(mimeType: string, fileName: string): ResumeFormat {
  const normalizedMime = mimeType.trim().toLowerCase();
  const lowerName = fileName.trim().toLowerCase();

  if (normalizedMime === PDF_MIME || lowerName.endsWith(".pdf")) {
    return "pdf";
  }
  if (normalizedMime === DOCX_MIME || lowerName.endsWith(".docx")) {
    return "docx";
  }
  if (normalizedMime === TXT_MIME || lowerName.endsWith(".txt")) {
    return "txt";
  }

  throw new ResumeParseError(
    `Unsupported resume format (${fileName}). Supported formats: PDF, DOCX, TXT.`
  );
}

/** Downloads a résumé object from the private Storage bucket (service-role). */
export async function downloadResumeBuffer(storagePath: string): Promise<Buffer> {
  const trimmedPath = storagePath.trim();
  if (!trimmedPath) {
    throw new ResumeParseError("Missing storage path for this résumé.");
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.storage.from(RESUME_BUCKET).download(trimmedPath);

  if (error || !data) {
    throw new ResumeParseError(error?.message ?? "Could not download the résumé file.", {
      cause: error,
    });
  }

  return Buffer.from(await data.arrayBuffer());
}

/**
 * Extracts plain text from an in-memory résumé file.
 * Supports PDF (unpdf), DOCX (mammoth), and UTF-8 TXT.
 */
export async function parseResumeBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const format = detectResumeFormat(mimeType, fileName);

  let text: string;

  try {
    if (format === "pdf") {
      const { text: merged } = await extractText(new Uint8Array(buffer), { mergePages: true });
      text = Array.isArray(merged) ? merged.join("\n") : String(merged ?? "");
    } else if (format === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf-8");
    }
  } catch (error) {
    throw new ResumeParseError("Could not read text from this résumé file.", { cause: error });
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    throw new ResumeParseError("No readable text was found in this résumé file.");
  }

  return normalized;
}

/**
 * Downloads a stored résumé and returns extracted text plus a content hash.
 * Intended for server-side AI analysis after HR authorization checks.
 */
export async function parseResumeFromStorage(
  storagePath: string,
  mimeType: string,
  fileName: string
): Promise<{ text: string; hash: string }> {
  const buffer = await downloadResumeBuffer(storagePath);
  const hash = computeResumeHash(buffer);
  const text = await parseResumeBuffer(buffer, mimeType, fileName);
  return { text, hash };
}
