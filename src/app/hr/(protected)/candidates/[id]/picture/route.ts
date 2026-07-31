import { NextResponse } from "next/server";
import { requireHRUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { downloadHRProfilePicture } from "@/lib/hr/profile-picture-download";

type Params = { id: string };

const CACHE_CONTROL = "private, max-age=3600, stale-while-revalidate=86400";

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  await requireHRUser();
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidate_profile_pictures")
    .select("storage_path, mime_type")
    .eq("candidate_id", id)
    .maybeSingle();

  if (error) {
    console.error("[hr/candidates/picture] Failed to load profile picture row.", {
      candidateId: id,
      message: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });
  }

  const { storage_path: storagePath, mime_type: mimeType } = data as {
    storage_path: string;
    mime_type: string;
  };

  const result = await downloadHRProfilePicture(storagePath, {
    source: "candidates",
    resourceId: id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const buffer = Buffer.from(await result.data.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType || result.mimeType,
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
