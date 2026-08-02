/**
 * Deterministic skill matching for jobs ↔ candidates.
 * Used by resume analysis / ranking when structured job skills exist.
 */

function normalizeSkill(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.+#]/g, " ").replace(/\s+/g, " ").trim();
}

function skillsOverlap(a: string, b: string): boolean {
  const left = normalizeSkill(a);
  const right = normalizeSkill(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 3 && right.includes(left)) return true;
  if (right.length >= 3 && left.includes(right)) return true;
  return false;
}

export type SkillMatchResult = {
  matchedSkills: string[];
  missingSkills: string[];
  skillMatchPercentage: number;
};

/** Compare required job skills against candidate/resume skills. */
export function computeSkillMatch(
  requiredSkills: string[],
  candidateSkills: string[]
): SkillMatchResult {
  const required = [
    ...new Set(requiredSkills.map((s) => s.trim()).filter(Boolean)),
  ];
  const candidate = [
    ...new Set(candidateSkills.map((s) => s.trim()).filter(Boolean)),
  ];

  if (required.length === 0) {
    return { matchedSkills: [], missingSkills: [], skillMatchPercentage: 0 };
  }

  const matchedSkills = required.filter((req) =>
    candidate.some((cand) => skillsOverlap(req, cand))
  );
  const missingSkills = required.filter(
    (req) => !matchedSkills.some((m) => skillsOverlap(m, req))
  );
  const skillMatchPercentage = Math.round(
    (matchedSkills.length / required.length) * 100
  );

  return { matchedSkills, missingSkills, skillMatchPercentage };
}

/** Blend overall AI score with structured skill match for ranking. */
export function blendRankingScore(
  overallScore: number,
  skillMatchPercentage: number,
  hasRequiredSkills: boolean
): number {
  if (!hasRequiredSkills) {
    return Math.max(0, Math.min(100, Math.round(overallScore)));
  }
  const blended = overallScore * 0.7 + skillMatchPercentage * 0.3;
  return Math.max(0, Math.min(100, Math.round(blended)));
}

/** Parse comma / newline skill lists from form or AI text. */
export function parseSkillsList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(/[\n,;|]+/)
        .map((s) => s.replace(/^•\s*/, "").trim())
        .filter(Boolean)
    ),
  ].slice(0, 40);
}

export { MASTER_SKILL_NAMES as SKILL_SUGGESTIONS } from "@/lib/shared/master-skills";
