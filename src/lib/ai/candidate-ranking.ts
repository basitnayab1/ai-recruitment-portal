import type {
  InterviewDifficulty,
  ResumeAnalysis,
  ResumeRecommendation,
} from "@/lib/ai/types";
import { buildMatchReasons } from "@/lib/hr/job-candidates-ranking";
import { blendRankingScore } from "@/lib/hr/skill-match";

export type CandidateRankingInput = {
  jobTitle: string;
  jobDescription: string;
  candidates: Array<{
    candidateId: string;
    applicationId: string;
    fullName: string;
    resumeAnalysis: ResumeAnalysis | null;
    interviewRecommendation: ResumeRecommendation | null;
    interviewDifficulty: InterviewDifficulty | null;
  }>;
};

export type CandidateRankingEntry = {
  candidateId: string;
  rank: number;
  score: number;
  reason: string;
};

/**
 * Ranks candidates for a job from cached AI résumé analysis.
 * Highest overallScore = Rank 1. Pure function — no Groq calls.
 */
export function rankCandidates(input: CandidateRankingInput): CandidateRankingEntry[] {
  const scored = input.candidates
    .filter((candidate) => candidate.resumeAnalysis !== null)
    .map((candidate) => {
      const analysis = candidate.resumeAnalysis as ResumeAnalysis;
      const hasSkillSignal =
        (analysis.matchedSkills?.length ?? 0) + (analysis.missingSkills?.length ?? 0) >
          0 ||
        (analysis.skillMatch ?? 0) > 0;
      const score = blendRankingScore(
        analysis.overallScore ?? analysis.score,
        analysis.skillMatch ?? 0,
        hasSkillSignal
      );
      const reasonParts = [
        `Overall ${score}/100`,
        hasSkillSignal ? `Skill match ${analysis.skillMatch ?? 0}%` : null,
        analysis.recommendationLabel || analysis.recommendation,
        ...(analysis.matchedSkills?.length
          ? analysis.matchedSkills.slice(0, 2).map((s) => `Matched: ${s}`)
          : buildMatchReasons(analysis, 3)),
      ].filter(Boolean);

      return {
        candidateId: candidate.candidateId,
        score,
        confidence: analysis.confidence,
        reason: reasonParts.join("; "),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.confidence - a.confidence ||
        a.candidateId.localeCompare(b.candidateId)
    );

  return scored.map((entry, index) => ({
    candidateId: entry.candidateId,
    rank: index + 1,
    score: entry.score,
    reason: entry.reason,
  }));
}
