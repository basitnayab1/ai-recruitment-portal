"use server";

import { requireHRUser } from "@/lib/auth/dal";
import {
  buildApplicationsCsv,
  buildCandidatesCsv,
  buildInterviewsCsv,
} from "@/lib/hr/export/build-csv";

export type ExportCsvResult =
  | { ok: true; csv: string; filename: string }
  | { ok: false; error: string };

async function runExport(
  build: () => Promise<{ csv: string; filename: string }>
): Promise<ExportCsvResult> {
  await requireHRUser();

  try {
    const { csv, filename } = await build();
    return { ok: true, csv, filename };
  } catch (error) {
    console.error("[hr/export-actions] Export failed:", error);
    return { ok: false, error: "Export failed. Please try again." };
  }
}

export async function exportApplicationsCsvAction(): Promise<ExportCsvResult> {
  return runExport(buildApplicationsCsv);
}

export async function exportCandidatesCsvAction(): Promise<ExportCsvResult> {
  return runExport(buildCandidatesCsv);
}

export async function exportInterviewsCsvAction(): Promise<ExportCsvResult> {
  return runExport(buildInterviewsCsv);
}
