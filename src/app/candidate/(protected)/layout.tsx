import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { getProfileCompletion } from "@/lib/candidate/dashboard-data";
import { getCandidateProfileDetails } from "@/lib/candidate/profile-data";
import { getCandidateProfilePicture } from "@/lib/candidate/profile-picture-data";
import { createCandidateProfilePictureSignedUrl } from "@/lib/candidate/profile-picture-urls";
import {
  getNotificationPreview,
  getUnreadNotificationCount,
} from "@/lib/notifications/data";
import { formatGreeting } from "@/lib/format/display-dates";
import { CandidateShell } from "@/components/candidate/candidate-shell";

export default async function CandidateProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireCandidateUser();

  const [details, picture, preview, unreadCount] = await Promise.all([
    getCandidateProfileDetails(profile.id),
    getCandidateProfilePicture(profile.id),
    getNotificationPreview(profile.id, "candidate"),
    getUnreadNotificationCount(profile.id, "candidate"),
  ]);

  const completion = getProfileCompletion(profile, details);
  const pictureUrl = picture
    ? await createCandidateProfilePictureSignedUrl(picture.storagePath, profile.id)
    : null;
  const greeting = formatGreeting();

  return (
    <CandidateShell
      fullName={profile.fullName}
      email={profile.email}
      completionPercentage={completion.percentage}
      pictureUrl={pictureUrl}
      greeting={greeting}
      notifications={{
        preview: preview.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          referenceId: n.referenceId,
          referenceType: n.referenceType,
          isRead: n.isRead,
          createdAt: n.createdAt,
        })),
        unreadCount,
      }}
    >
      {children}
    </CandidateShell>
  );
}
