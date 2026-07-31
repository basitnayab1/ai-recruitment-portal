import { NextResponse } from "next/server";
import { requireHRUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createHRResumeSignedUrl } from "@/lib/hr/resume-download";

type Params = { id: string };

/**
 * Streams a candidate's résumé (from `candidate_resumes`) to HR/admin staff
 * via a short-lived signed URL. `storage_path` is read through the HR
 * user's authenticated session — never from the client. The signed URL is
 * minted with the server-only admin client after that check.
 */
export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  await requireHRUser();
  const { id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("candidate_resumes")
    .select("storage_path, file_name")
    .eq("candidate_id", id)
    .maybeSingle();

  if (error) {
    console.error("[hr/candidates/resume] Failed to load candidate_resumes row.", {
      candidateId: id,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Résumé not found." }, { status: 404 });
  }

  const { storage_path: storagePath, file_name: fileName } = data as {
    storage_path: string;
    file_name: string;
  };

  const signed = await createHRResumeSignedUrl(storagePath, fileName, {
    source: "candidates",
    resourceId: id,
  });

  if (!signed.ok) {
    return NextResponse.json({ error: signed.message }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
