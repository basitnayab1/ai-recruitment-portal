import "server-only";

import { cache } from "react";
import { getCandidateProfile } from "@/lib/candidate-auth/dal";
import { getHRProfile } from "@/lib/auth/dal";

export type LandingAuthState =
  | { kind: "guest" }
  | { kind: "candidate"; fullName: string }
  | { kind: "hr"; fullName: string };

/**
 * Resolves which portal (if any) the current visitor belongs to, for
 * landing-page navigation. HR and candidate sessions are independent;
 * if both ever existed, HR takes precedence for employer-facing CTAs.
 */
export const getLandingAuthState = cache(async (): Promise<LandingAuthState> => {
  const [hrProfile, candidateProfile] = await Promise.all([getHRProfile(), getCandidateProfile()]);

  if (hrProfile) {
    return { kind: "hr", fullName: hrProfile.fullName };
  }

  if (candidateProfile) {
    return { kind: "candidate", fullName: candidateProfile.fullName };
  }

  return { kind: "guest" };
});
