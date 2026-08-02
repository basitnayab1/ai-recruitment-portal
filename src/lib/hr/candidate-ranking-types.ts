/**
 * Client-safe ranking types — no server-only imports.
 * Shared by Server Components, Server Actions, and Client Components.
 */

import type { ResumeRecommendation } from "@/lib/ai/types";

export type StoredCandidateRanking = {
  id: string;
  jobId: string;
  candidateId: string;
  applicationId: string | null;
  fullName: string;
  rank: number;
  score: number;
  reason: string;
  recommendation: ResumeRecommendation | null;
  createdAt: string;
};

export type RefreshRankingResult = {
  rankings: StoredCandidateRanking[];
  rankedCount: number;
};
