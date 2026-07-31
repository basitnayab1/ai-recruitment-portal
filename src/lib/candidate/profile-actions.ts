"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getProfileCompletion } from "@/lib/candidate/dashboard-data";
import {
  isGender,
  isHighestQualification,
  isNoticePeriod,
  type CandidateProfileDetails,
} from "@/lib/candidate/profile-details";

export type UpdateProfileState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;

/**
 * Server Action backing the "Save Profile" form on /candidate/profile.
 * Only updates columns that already exist on `candidate_profiles`
 * (full_name, phone) — headline/LinkedIn/portfolio are not persisted since
 * no such columns exist yet (see ProfessionalInfoCard). Email is never
 * accepted from the form; it is immutable here.
 *
 * Re-verifies the caller via `requireCandidateUser()` and writes through
 * the caller's own RLS-scoped session (never the service-role key), so a
 * candidate can only ever update their own row.
 */
export async function updateCandidateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const profile = await requireCandidateUser();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneRaw.length > 0 ? phoneRaw : null;

  if (!fullName) {
    return { status: "error", message: "Full name is required." };
  }
  if (fullName.length > 200) {
    return { status: "error", message: "Full name must be under 200 characters." };
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    return { status: "error", message: "Please enter a valid phone number." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("candidate_profiles")
    .update({ full_name: fullName, phone })
    .eq("id", profile.id);

  if (error) {
    return {
      status: "error",
      message: "Something went wrong saving your profile. Please try again.",
    };
  }

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate");

  return { status: "success", message: "Profile updated successfully." };
}

export type UpdateProfileDetailsState = { status: "error"; message: string } | undefined;

const URL_PATTERN = /^https?:\/\/.+/i;
const CNIC_PATTERN = /^\d{5}-?\d{7}-?\d{1}$/;

function trimmedOrNull(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str.length > 0 ? str : null;
}

/** Returns the parsed non-negative number, `null` if left blank, or `"invalid"`. */
function parseNonNegativeOrNull(value: FormDataEntryValue | null): number | null | "invalid" {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const num = Number(str);
  if (!Number.isFinite(num) || num < 0) return "invalid";
  return num;
}

/**
 * Server Action backing the extended "Additional Details" form on
 * /candidate/profile (candidate_profile_details — see
 * supabase/migrations/003_candidate_profile_details.sql). Computes and
 * persists `profile_completion` on every save via the same
 * `getProfileCompletion()` used for display, so the stored snapshot never
 * drifts from what candidates actually see.
 *
 * Re-verifies the caller via `requireCandidateUser()` and writes through
 * the caller's own RLS-scoped session (never the service-role key), so a
 * candidate can only ever upsert their own row. On success, redirects back
 * to the dashboard per spec rather than returning a success state.
 */
export async function updateCandidateProfileDetails(
  _prevState: UpdateProfileDetailsState,
  formData: FormData
): Promise<UpdateProfileDetailsState> {
  const profile = await requireCandidateUser();

  const phone = trimmedOrNull(formData.get("phone"));
  const cnic = trimmedOrNull(formData.get("cnic"));
  const dateOfBirth = trimmedOrNull(formData.get("dateOfBirth"));
  const genderRaw = trimmedOrNull(formData.get("gender"));
  const country = trimmedOrNull(formData.get("country"));
  const province = trimmedOrNull(formData.get("province"));
  const city = trimmedOrNull(formData.get("city"));
  const address = trimmedOrNull(formData.get("address"));
  const currentJobTitle = trimmedOrNull(formData.get("currentJobTitle"));
  const highestQualificationRaw = trimmedOrNull(formData.get("highestQualification"));
  const currentCompany = trimmedOrNull(formData.get("currentCompany"));
  const noticePeriodRaw = trimmedOrNull(formData.get("noticePeriod"));
  const linkedinUrl = trimmedOrNull(formData.get("linkedinUrl"));
  const portfolioUrl = trimmedOrNull(formData.get("portfolioUrl"));
  const githubUrl = trimmedOrNull(formData.get("githubUrl"));

  if (cnic && !CNIC_PATTERN.test(cnic)) {
    return { status: "error", message: "Please enter a valid CNIC (e.g. 12345-1234567-1)." };
  }
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      return { status: "error", message: "Please enter a valid date of birth." };
    }
  }
  if (genderRaw && !isGender(genderRaw)) {
    return { status: "error", message: "Please select a valid gender option." };
  }
  if (highestQualificationRaw && !isHighestQualification(highestQualificationRaw)) {
    return { status: "error", message: "Please select a valid highest qualification." };
  }
  if (noticePeriodRaw && !isNoticePeriod(noticePeriodRaw)) {
    return { status: "error", message: "Please select a valid notice period." };
  }
  for (const [label, url] of [
    ["LinkedIn", linkedinUrl],
    ["Portfolio", portfolioUrl],
    ["GitHub", githubUrl],
  ] as const) {
    if (url && !URL_PATTERN.test(url)) {
      return {
        status: "error",
        message: `Please enter a valid ${label} URL (starting with http:// or https://).`,
      };
    }
  }

  const yearsOfExperience = parseNonNegativeOrNull(formData.get("yearsOfExperience"));
  if (yearsOfExperience === "invalid") {
    return { status: "error", message: "Years of experience must be a positive number." };
  }
  const expectedSalary = parseNonNegativeOrNull(formData.get("expectedSalary"));
  if (expectedSalary === "invalid") {
    return { status: "error", message: "Expected salary must be a positive number." };
  }

  const pendingDetails: Partial<CandidateProfileDetails> = {
    phone,
    cnic,
    dateOfBirth,
    gender: genderRaw && isGender(genderRaw) ? genderRaw : null,
    country,
    province,
    city,
    address,
    currentJobTitle,
    yearsOfExperience,
    highestQualification:
      highestQualificationRaw && isHighestQualification(highestQualificationRaw)
        ? highestQualificationRaw
        : null,
    currentCompany,
    expectedSalary,
    noticePeriod: noticePeriodRaw && isNoticePeriod(noticePeriodRaw) ? noticePeriodRaw : null,
    linkedinUrl,
    portfolioUrl,
    githubUrl,
  };

  const completion = getProfileCompletion(profile, pendingDetails);

  const supabase = await createClient();
  const { error } = await supabase.from("candidate_profile_details").upsert(
    {
      candidate_id: profile.id,
      phone,
      cnic,
      date_of_birth: dateOfBirth,
      gender: pendingDetails.gender,
      country,
      province,
      city,
      address,
      current_job_title: currentJobTitle,
      years_of_experience: yearsOfExperience,
      highest_qualification: pendingDetails.highestQualification,
      current_company: currentCompany,
      expected_salary: expectedSalary,
      notice_period: pendingDetails.noticePeriod,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      github_url: githubUrl,
      profile_completion: completion.percentage,
    },
    { onConflict: "candidate_id" }
  );

  if (error) {
    return {
      status: "error",
      message: "Something went wrong saving your profile. Please try again.",
    };
  }

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate");
  redirect("/candidate?updated=1");
}
