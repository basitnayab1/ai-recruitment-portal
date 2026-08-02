import type { CandidateProfile } from "@/lib/candidate-auth/dal";
import type { CandidateProfileDetails } from "@/lib/candidate/profile-details";

export type ProfileCompletionField = {
  label: string;
  completed: boolean;
};

export type ProfileCompletion = {
  percentage: number;
  completedFields: number;
  totalFields: number;
  fields: ProfileCompletionField[];
};

function hasValue(value: string | number | null | undefined): boolean {
  if (typeof value === "number") return true;
  return Boolean(value && value.trim().length > 0);
}

/**
 * Calculates profile completion across both `candidate_profiles` (core
 * identity: name/email, plus phone as a fallback) and
 * `candidate_profile_details` (extended fields).
 *
 * Kept in a non-`server-only` module so Server Actions can import it without
 * pulling the heavier dashboard data layer into the action module graph.
 */
export function getProfileCompletion(
  profile: CandidateProfile,
  details: Partial<CandidateProfileDetails> | null
): ProfileCompletion {
  const fields: ProfileCompletionField[] = [
    { label: "Full Name", completed: hasValue(profile.fullName) },
    { label: "Email", completed: hasValue(profile.email) },
    { label: "Phone", completed: hasValue(details?.phone ?? profile.phone) },
    { label: "CNIC", completed: hasValue(details?.cnic) },
    { label: "Date of Birth", completed: hasValue(details?.dateOfBirth) },
    { label: "Gender", completed: hasValue(details?.gender) },
    { label: "Country", completed: hasValue(details?.country) },
    { label: "Province", completed: hasValue(details?.province) },
    { label: "City", completed: hasValue(details?.city) },
    { label: "Address", completed: hasValue(details?.address) },
    { label: "Current Job Title", completed: hasValue(details?.currentJobTitle) },
    { label: "Years of Experience", completed: hasValue(details?.yearsOfExperience) },
    { label: "Highest Qualification", completed: hasValue(details?.highestQualification) },
    { label: "Current Company", completed: hasValue(details?.currentCompany) },
    { label: "Expected Salary", completed: hasValue(details?.expectedSalary) },
    { label: "Notice Period", completed: hasValue(details?.noticePeriod) },
    { label: "LinkedIn URL", completed: hasValue(details?.linkedinUrl) },
    { label: "Portfolio URL", completed: hasValue(details?.portfolioUrl) },
    { label: "GitHub URL", completed: hasValue(details?.githubUrl) },
  ];
  const completedFields = fields.filter((field) => field.completed).length;
  const totalFields = fields.length;

  return {
    percentage: Math.round((completedFields / totalFields) * 100),
    completedFields,
    totalFields,
    fields,
  };
}
