// Shared candidate-profile-details types/constants, safe to import from both
// Server and Client Components (no secrets, no server-only APIs). Mirrors
// the split already used for jobs (see src/lib/hr/jobs.ts vs jobs-data.ts).

export const GENDERS = ["male", "female", "other", "prefer_not_to_say"] as const;
export type Gender = (typeof GENDERS)[number];

export function isGender(value: string): value is Gender {
  return (GENDERS as readonly string[]).includes(value);
}

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

export const HIGHEST_QUALIFICATIONS = [
  "high_school",
  "associate",
  "bachelors",
  "masters",
  "phd",
  "other",
] as const;
export type HighestQualification = (typeof HIGHEST_QUALIFICATIONS)[number];

export function isHighestQualification(value: string): value is HighestQualification {
  return (HIGHEST_QUALIFICATIONS as readonly string[]).includes(value);
}

export const HIGHEST_QUALIFICATION_LABELS: Record<HighestQualification, string> = {
  high_school: "High School",
  associate: "Associate Degree",
  bachelors: "Bachelor's Degree",
  masters: "Master's Degree",
  phd: "PhD",
  other: "Other",
};

export const NOTICE_PERIODS = [
  "immediate",
  "1_week",
  "2_weeks",
  "1_month",
  "2_months",
  "3_months_plus",
] as const;
export type NoticePeriod = (typeof NOTICE_PERIODS)[number];

export function isNoticePeriod(value: string): value is NoticePeriod {
  return (NOTICE_PERIODS as readonly string[]).includes(value);
}

export const NOTICE_PERIOD_LABELS: Record<NoticePeriod, string> = {
  immediate: "Immediate",
  "1_week": "1 Week",
  "2_weeks": "2 Weeks",
  "1_month": "1 Month",
  "2_months": "2 Months",
  "3_months_plus": "3+ Months",
};

export type CandidateProfileDetails = {
  candidateId: string;
  phone: string | null;
  cnic: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  country: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  currentJobTitle: string | null;
  yearsOfExperience: number | null;
  highestQualification: HighestQualification | null;
  currentCompany: string | null;
  expectedSalary: number | null;
  noticePeriod: NoticePeriod | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  profileCompletion: number;
  updatedAt: string;
};
