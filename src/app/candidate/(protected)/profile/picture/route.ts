import { NextResponse } from "next/server";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCandidateProfilePicture, PROFILE_PICTURE_BUCKET } from "@/lib/candidate/profile-picture-data";

const CACHE_CONTROL = "private, max-age=3600, stale-while-revalidate=86400";

export async function GET() {
  const profile = await requireCandidateUser();
  const picture = await getCandidateProfilePicture(profile.id);

  if (!picture) {
    return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.storage
    .from(PROFILE_PICTURE_BUCKET)
    .download(picture.storagePath);

  if (error || !data) {
    console.error("[candidate/profile/picture] download failed.", {
      candidateId: profile.id,
      message: error?.message ?? null,
    });
    return NextResponse.json({ error: "Could not load profile picture." }, { status: 500 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": picture.mimeType,
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
