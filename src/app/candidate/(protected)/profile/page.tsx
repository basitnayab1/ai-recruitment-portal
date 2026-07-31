import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { sanitizeNextPath } from "@/lib/candidate-auth/next-path";
import { getProfileCompletion } from "@/lib/candidate/dashboard-data";
import { getCandidateProfileDetails } from "@/lib/candidate/profile-data";
import { getCandidateProfilePicture } from "@/lib/candidate/profile-picture-data";
import { createCandidateProfilePictureSignedUrl } from "@/lib/candidate/profile-picture-urls";
import { ProfileDetailsForm } from "@/components/candidate/profile-details-form";
import { ProfileCompletionDetail } from "@/components/candidate/profile-completion-detail";
import { ProfilePictureManager } from "@/components/candidate/profile-picture-manager";
import { ProfileBanner } from "@/components/candidate/profile-banner";
import { ProfileForm } from "./profile-form";
import { ALERT_WARNING, DETAIL_SECTION, PAGE_STACK } from "@/lib/ui/classes";
import { MotionFadeIn } from "@/components/candidate/ui/motion-wrapper";

export const metadata: Metadata = {
  title: "My Profile | AI Recruitment Portal",
};

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; next?: string }>;
}) {
  const profile = await requireCandidateUser();
  const { notice, next } = await searchParams;
  const [details, picture] = await Promise.all([
    getCandidateProfileDetails(profile.id),
    getCandidateProfilePicture(profile.id),
  ]);
  const completion = getProfileCompletion(profile, details);
  const safeNext = next ? sanitizeNextPath(next, "") : "";
  const pictureUrl = picture
    ? await createCandidateProfilePictureSignedUrl(picture.storagePath)
    : null;

  return (
    <div className={PAGE_STACK}>
      <ProfileBanner
        fullName={profile.fullName}
        email={profile.email}
        pictureUrl={pictureUrl}
        completionPercentage={completion.percentage}
      />

      {notice === "apply_profile" ? (
        <div className={ALERT_WARNING}>
          <p>Please complete your profile before applying.</p>
          {safeNext ? (
            <Link
              href={safeNext}
              className="mt-2 inline-flex items-center gap-1.5 font-semibold text-amber-900 hover:underline dark:text-amber-200"
            >
              Back to job
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MotionFadeIn>
            <div className={DETAIL_SECTION}>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Your basic contact details and profile picture.
              </p>
              <div className="mt-6 space-y-8">
                <ProfilePictureManager
                  fullName={profile.fullName}
                  hasPicture={Boolean(picture)}
                  pictureUrl={pictureUrl}
                />
                <ProfileForm fullName={profile.fullName} email={profile.email} phone={profile.phone} />
              </div>
            </div>
          </MotionFadeIn>

          <MotionFadeIn delay={0.1}>
            <div className={DETAIL_SECTION}>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Additional Details
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Personal, professional, and online presence details recruiters use to evaluate your
                applications.
              </p>
              <div className="mt-6">
                <ProfileDetailsForm details={details} />
              </div>
            </div>
          </MotionFadeIn>
        </div>

        <MotionFadeIn delay={0.15}>
          <ProfileCompletionDetail completion={completion} />
        </MotionFadeIn>
      </div>
    </div>
  );
}
