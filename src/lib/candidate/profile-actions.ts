"use server";

import { revalidatePath } from "next/cache";
import { requireCandidateUser } from "@/lib/candidate-auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getProfileCompletion } from "@/lib/candidate/profile-completion";
import {
  isGender,
  isHighestQualification,
  isNoticePeriod,
  parseSkillsList,
  type CandidateProfileDetails,
} from "@/lib/candidate/profile-details";

export type UpdateProfileState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const LOG = "[candidate/profile-actions]";

/**
 * Server Action backing the "Save Profile" form on /candidate/profile.
 * Only updates columns that already exist on `candidate_profiles`
 * (full_name, phone). Email is never accepted from the form.
 */
export async function updateCandidateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  try {
    console.log(`${LOG} updateCandidateProfile: request received`);
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

    console.log(`${LOG} updateCandidateProfile: updating candidate_profiles`, {
      candidateId: profile.id,
      hasPhone: Boolean(phone),
    });

    const { error } = await supabase
      .from("candidate_profiles")
      .update({ full_name: fullName, phone })
      .eq("id", profile.id);

    if (error) {
      console.error(`${LOG} updateCandidateProfile supabase error:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return {
        status: "error",
        message: error.message || "Something went wrong saving your profile. Please try again.",
      };
    }

    revalidatePath("/candidate/profile");
    revalidatePath("/candidate");

    console.log(`${LOG} updateCandidateProfile: success`, { candidateId: profile.id });
    return { status: "success", message: "Profile updated successfully." };
  } catch (error) {
    // Preserve Next.js redirect() from requireCandidateUser (auth gate).
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error(`${LOG} updateCandidateProfile unexpected error:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected error while saving profile.";
    return { status: "error", message };
  }
}

export type UpdateProfileDetailsState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

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

function mapProfileDetailsSaveError(message: string): string {
  if (/skills|current_salary|schema cache|Could not find the/i.test(message)) {
    return (
      "Database is missing profile skills columns. " +
      "Run supabase/migrations/027_candidate_profile_skills_salary.sql in the Supabase SQL Editor, then try again. " +
      `(${message})`
    );
  }
  return message || "Something went wrong saving your profile. Please try again.";
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Server Action backing the extended profile form on /candidate/profile.
 * Persists professional fields + required skills. Returns a success state
 * (does NOT redirect) so useActionState never surfaces "Failed to fetch"
 * from a post-save redirect RSC fetch.
 */
export async function updateCandidateProfileDetails(
  _prevState: UpdateProfileDetailsState,
  formData: FormData
): Promise<UpdateProfileDetailsState> {
  try {
    console.log(`${LOG} updateCandidateProfileDetails: request received`);
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
    const skillsRaw = formData.get("skills");
    const skills = parseSkillsList(skillsRaw);

    console.log(`${LOG} parsed skills`, {
      raw: typeof skillsRaw === "string" ? skillsRaw.slice(0, 200) : skillsRaw,
      count: skills.length,
      skills: skills.slice(0, 20),
    });

    if (skills.length < 1) {
      return { status: "error", message: "At least one skill is required." };
    }

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
    const currentSalary = parseNonNegativeOrNull(formData.get("currentSalary"));
    if (currentSalary === "invalid") {
      return { status: "error", message: "Current salary must be a positive number." };
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
      currentSalary,
      expectedSalary,
      noticePeriod: noticePeriodRaw && isNoticePeriod(noticePeriodRaw) ? noticePeriodRaw : null,
      skills,
      linkedinUrl,
      portfolioUrl,
      githubUrl,
    };

    const completion = getProfileCompletion(profile, pendingDetails);
    const payload = {
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
      current_salary: currentSalary,
      expected_salary: expectedSalary,
      notice_period: pendingDetails.noticePeriod,
      skills,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      github_url: githubUrl,
      profile_completion: completion.percentage,
      updated_at: new Date().toISOString(),
    };

    console.log(`${LOG} upsert start`, {
      candidateId: profile.id,
      skillsCount: skills.length,
      profileCompletion: completion.percentage,
    });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidate_profile_details")
      .upsert(payload, { onConflict: "candidate_id" })
      .select("candidate_id, skills, current_salary, profile_completion")
      .single();

    if (error) {
      console.error(`${LOG} upsert failed:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return {
        status: "error",
        message: mapProfileDetailsSaveError(error.message),
      };
    }

    console.log(`${LOG} upsert ok`, {
      candidateId: (data as { candidate_id?: string } | null)?.candidate_id,
      savedSkills: (data as { skills?: string[] } | null)?.skills,
    });

    revalidatePath("/candidate/profile");
    revalidatePath("/candidate");
    revalidatePath("/hr/candidates");

    return {
      status: "success",
      message: "Profile saved successfully. Your skills are now available to recruiters and AI matching.",
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error(`${LOG} updateCandidateProfileDetails unexpected error:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected error while saving profile.";
    return { status: "error", message };
  }
}
