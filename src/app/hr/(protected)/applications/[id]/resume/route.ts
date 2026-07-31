import { NextResponse } from "next/server";
import { requireHRUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createHRResumeSignedUrl } from "@/lib/hr/resume-download";

type Params = { id: string };

/**
 * Streams an applicant's résumé to HR/admin staff via a short-lived signed
 * URL. `cv_storage_path` is read through the HR user's authenticated session
 * (RLS: "HR and admin can manage applications") — never from the client.
 * The signed URL itself is minted with the server-only admin client after
 * that authorization check (see `createHRResumeSignedUrl`).
 */
export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  await requireHRUser();
  const { id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("cv_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[hr/applications/resume] Failed to load application cv_storage_path.", {
      applicationId: id,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const storagePath = (data as { cv_storage_path: string }).cv_storage_path;
  const fileName = storagePath.split("/").pop() || "resume.pdf";

  const signed = await createHRResumeSignedUrl(storagePath, fileName, {
    source: "applications",
    resourceId: id,
  });

  if (!signed.ok) {
    return NextResponse.json({ error: signed.message }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
