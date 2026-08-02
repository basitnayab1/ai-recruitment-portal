import type { ResumeAnalysis } from "@/lib/ai/types";

export type RankedJobCandidate = {
  rank: number;
  applicationId: string;
  candidateId: string | null;
  fullName: string;
  matchScore: number;
  reasons: string[];
};

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"] as const;

export function rankMedal(rank: number): string {
  return MEDAL_EMOJIS[rank - 1] ?? `#${rank}`;
}

/**
 * Builds short bullet reasons from AI analysis — strengths first, then weaknesses.
 */
export function buildMatchReasons(analysis: ResumeAnalysis, maxItems = 5): string[] {
  const reasons: string[] = [];

  for (const strength of analysis.strengths) {
    if (reasons.length >= maxItems) break;
    const trimmed = strength.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("strong ") || lower.startsWith("excellent ") || lower.startsWith("proven ")) {
      reasons.push(trimmed);
    } else {
      reasons.push(`Strong ${trimmed}`);
    }
  }

  for (const weakness of analysis.weaknesses) {
    if (reasons.length >= maxItems) break;
    const trimmed = weakness.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith("weak ") ||
      lower.startsWith("limited ") ||
      lower.startsWith("no ") ||
      lower.startsWith("missing ")
    ) {
      reasons.push(trimmed);
    } else if (lower.includes("limited")) {
      reasons.push(trimmed);
    } else {
      reasons.push(`Weak ${trimmed}`);
    }
  }

  if (reasons.length < maxItems && analysis.experience.trim()) {
    const experience = analysis.experience.trim();
    const yearsMatch = experience.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (yearsMatch) {
      reasons.push(`${yearsMatch[1]} Years Experience`);
    } else if (experience.length <= 48) {
      reasons.push(experience);
    }
  }

  return reasons.slice(0, maxItems);
}
