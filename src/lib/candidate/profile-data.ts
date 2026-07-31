import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isGender,
  isHighestQualification,
  isNoticePeriod,
  type CandidateProfileDetails,
} from "@/lib/candidate/profile-details";

// Row shape returned by Supabase. Manually typed since DB types have not
// been generated yet (`supabase gen types typescript`); see the same note
// in `src/lib/candidate-auth/dal.ts`.
type CandidateProfileDetailsRow = {
  candidate_id: string;
  phone: string | null;
  cnic: string | null;
  date_of_birth: string | null;
  gender: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  current_job_title: string | null;
  years_of_experience: number | null;
  highest_qualification: string | null;
  current_company: string | null;
  expected_salary: number | null;
  notice_period: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  profile_completion: number;
  updated_at: string;
};

/**
 * Loads the caller's own extended profile details (candidate_profile_details),
 * using the caller's own authenticated Supabase session (RLS: `auth.uid() =
 * candidate_id`) — never the service-role key, so a candidate can only ever
 * read their own row.
 *
 * Returns `null` both when the candidate hasn't saved their details yet
 * (no row exists — not an error) and if a query error occurs.
 */
export async function getCandidateProfileDetails(
  candidateId: string
): Promise<CandidateProfileDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("candidate_profile_details")
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (error) {
    console.error("[profile-data] Failed to load candidate profile details:", error.message);
    return null;
  }
  if (!data) {
    return null;
  }

  const row = data as CandidateProfileDetailsRow;

  return {
    candidateId: row.candidate_id,
    phone: row.phone,
    cnic: row.cnic,
    dateOfBirth: row.date_of_birth,
    gender: row.gender && isGender(row.gender) ? row.gender : null,
    country: row.country,
    province: row.province,
    city: row.city,
    address: row.address,
    currentJobTitle: row.current_job_title,
    yearsOfExperience: row.years_of_experience,
    highestQualification:
      row.highest_qualification && isHighestQualification(row.highest_qualification)
        ? row.highest_qualification
        : null,
    currentCompany: row.current_company,
    expectedSalary: row.expected_salary,
    noticePeriod: row.notice_period && isNoticePeriod(row.notice_period) ? row.notice_period : null,
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    githubUrl: row.github_url,
    profileCompletion: row.profile_completion,
    updatedAt: row.updated_at,
  };
}
