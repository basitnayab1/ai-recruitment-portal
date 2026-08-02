/**
 * AI Hiring Assistant — structured recruiter report from live tool evidence.
 * Never invents scores, skills, or candidates.
 */

import type { CopilotToolResult } from "@/lib/ai/hr-tools";

export type HiringAssistantLabel = "Strong Hire" | "Hire" | "Maybe" | "Reject";

type AnalysisLike = {
  candidateName?: string | null;
  jobTitle?: string | null;
  overallScore?: number | null;
  score?: number | null;
  technicalScore?: number | null;
  experienceScore?: number | null;
  educationScore?: number | null;
  communicationScore?: number | null;
  skillMatch?: number | null;
  recommendationLabel?: string | null;
  recommendation?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  missingSkills?: string[];
  skills?: string[];
  summary?: string | null;
  experience?: string | null;
  education?: string | null;
  confidence?: number | null;
  rank?: number | null;
};

function safeScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function bullets(items: string[], limit = 6): string[] {
  return items
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((s) => `• ${s}`);
}

/** Map live labels/scores → the 4 assistant recommendation buckets. */
export function toHiringAssistantLabel(
  rawLabel: string | null | undefined,
  score: number
): HiringAssistantLabel {
  const label = (rawLabel ?? "").toLowerCase();
  if (
    label.includes("strong hire") ||
    label.includes("highly recommended") ||
    (score >= 85 && !label.includes("no hire") && !label.includes("reject"))
  ) {
    return "Strong Hire";
  }
  if (
    label.includes("do not hire") ||
    label.includes("no hire") ||
    label.includes("reject") ||
    label.includes("not recommended") ||
    score < 55
  ) {
    return "Reject";
  }
  if (
    label.includes("reservation") ||
    label.includes("maybe") ||
    label.includes("consider") ||
    (score >= 55 && score < 70)
  ) {
    return "Maybe";
  }
  if (label.includes("hire") || score >= 70) return "Hire";
  return "Maybe";
}

function extractJobFromMessage(message: string): string | null {
  const known = message.match(
    /\b(frontend developer|backend developer|full[- ]?stack developer|video editor|react developer|developer|designer|engineer|manager|analyst)\b/i
  );
  if (known?.[1]) return known[1];

  const m = message.match(
    /\b(?:for|as|against)\s+(?:the\s+)?([A-Za-z][A-Za-z0-9 /+#.-]{2,40}?)\s*(?:role|position|job|requirements)?\??$/i
  );
  const role = m?.[1]?.trim();
  if (!role || /^(this|that|the|him|her|them|candidate)$/i.test(role)) return null;
  if (/\b(role|job|requirements)\b/i.test(role) && role.split(/\s+/).length <= 2) {
    return null;
  }
  return role;
}

function extractScoreMention(message: string): number | null {
  const m = message.match(/\b(?:score(?:\s+is)?|scored)\s+(\d{1,3})\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function getAnalyses(results: CopilotToolResult[]): AnalysisLike[] {
  const analysis = results.find(
    (r) => r.tool === "searchResumeAnalysis" || r.tool === "searchAnalysis"
  );
  if (!analysis || !("analyses" in analysis) || !Array.isArray(analysis.analyses)) {
    return [];
  }
  return analysis.analyses as AnalysisLike[];
}

function getHire(results: CopilotToolResult[]) {
  return results.find((r) => r.tool === "getHiringRecommendation");
}

function getRisks(results: CopilotToolResult[]): string[] {
  const risk = results.find((r) => r.tool === "analyzeHiringRisks");
  if (risk && risk.tool === "analyzeHiringRisks" && risk.assessments?.length) {
    return risk.assessments[0]?.risks ?? [];
  }
  const hire = getHire(results);
  if (hire && "risks" in hire && Array.isArray(hire.risks)) {
    return hire.risks as string[];
  }
  return [];
}

function getJobRequirements(results: CopilotToolResult[]): string[] {
  const hire = getHire(results);
  if (hire && "jobRequirements" in hire && Array.isArray(hire.jobRequirements)) {
    return (hire.jobRequirements as string[]).filter(Boolean);
  }
  const jobs = results.find((r) => r.tool === "searchJobs");
  if (jobs && "jobs" in jobs && Array.isArray(jobs.jobs) && jobs.jobs[0]) {
    const job = jobs.jobs[0] as {
      title?: string;
      requirements?: string | null;
      description?: string | null;
    };
    const text = String(job.requirements ?? job.description ?? "").trim();
    if (!text) return job.title ? [`Open role on file: ${job.title}`] : [];
    return text
      .split(/\n|•|;|\|/)
      .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
      .filter((s) => s.length > 2)
      .slice(0, 8);
  }
  return [];
}

function getProfileYears(results: CopilotToolResult[], name: string): number | null {
  const profile = results.find((r) => r.tool === "getCandidateProfile");
  if (!profile || !("profiles" in profile) || !Array.isArray(profile.profiles)) {
    return null;
  }
  const hit =
    profile.profiles.find((p) =>
      p.fullName.toLowerCase().includes(name.toLowerCase())
    ) ?? profile.profiles[0];
  return hit?.yearsOfExperience ?? null;
}

/**
 * Pick the right analysis row when multiple candidates exist.
 * Priority: job title match → score mention → focus name → top AI score.
 */
export function selectHiringFocus(
  message: string,
  results: CopilotToolResult[],
  focusCandidate?: string | null
): AnalysisLike | null {
  const analyses = getAnalyses(results);
  const hire = getHire(results);

  if (hire && "candidateName" in hire && hire.candidateName) {
    const fromHire: AnalysisLike = {
      candidateName: hire.candidateName as string,
      jobTitle: (hire.jobTitle as string) ?? null,
      overallScore: hire.aiScore as number | null,
      score: hire.aiScore as number | null,
      recommendationLabel: (hire.recommendationLabel as string) ?? null,
      recommendation: (hire.recommendation as string) ?? null,
      strengths: Array.isArray(hire.strengths) ? (hire.strengths as string[]) : [],
      weaknesses: Array.isArray(hire.weaknesses) ? (hire.weaknesses as string[]) : [],
      missingSkills: Array.isArray(hire.missingSkills)
        ? (hire.missingSkills as string[])
        : [],
      skills: Array.isArray(hire.candidateSkills)
        ? (hire.candidateSkills as string[])
        : [],
      rank:
        hire.ranking && typeof hire.ranking === "object"
          ? ((hire.ranking as { rank?: number | null }).rank ?? null)
          : null,
      skillMatch: (hire.skillMatch as number) ?? null,
      summary: null,
      experience: null,
      education: null,
    };
    // Enrich with matching analysis row (experience/education/breakdown).
    const match = analyses.find((a) =>
      (a.candidateName ?? "")
        .toLowerCase()
        .includes(String(hire.candidateName).toLowerCase())
    );
    if (match) {
      return {
        ...fromHire,
        ...match,
        strengths: fromHire.strengths?.length ? fromHire.strengths : match.strengths,
        missingSkills: fromHire.missingSkills?.length
          ? fromHire.missingSkills
          : match.missingSkills,
        weaknesses: fromHire.weaknesses?.length
          ? fromHire.weaknesses
          : match.weaknesses,
      };
    }
    return fromHire;
  }

  const rankings = results.find(
    (r) => r.tool === "searchAIRanking" || r.tool === "searchRanking"
  );
  const rankingRows =
    rankings && "rankings" in rankings && Array.isArray(rankings.rankings)
      ? rankings.rankings
      : [];

  if (!analyses.length && rankingRows.length) {
    const top = [...rankingRows].sort(
      (a, b) => safeScore(b.score) - safeScore(a.score)
    )[0]!;
    return {
      candidateName: top.candidateName,
      jobTitle: top.jobTitle,
      overallScore: top.score,
      score: top.score,
      recommendationLabel: null,
      recommendation: null,
      strengths: [],
      weaknesses: [],
      missingSkills: [],
      skills: [],
      rank: top.rank,
      summary: top.reason,
      experience: null,
      education: null,
    };
  }

  if (!analyses.length) return null;

  const jobHint = extractJobFromMessage(message);
  const scoreHint = extractScoreMention(message);
  const nameHint = focusCandidate?.trim();

  let pool = [...analyses];

  if (nameHint && !/^(suitable|against|good|this|that)$/i.test(nameHint)) {
    const named = pool.filter((a) =>
      (a.candidateName ?? "").toLowerCase().includes(nameHint.toLowerCase())
    );
    if (named.length) pool = named;
  }

  if (jobHint) {
    const byJob = pool.filter((a) =>
      (a.jobTitle ?? "").toLowerCase().includes(jobHint.toLowerCase())
    );
    if (byJob.length) pool = byJob;
  }

  if (scoreHint != null) {
    pool = [...pool].sort(
      (a, b) =>
        Math.abs(safeScore(a.overallScore ?? a.score) - scoreHint) -
        Math.abs(safeScore(b.overallScore ?? b.score) - scoreHint)
    );
    return pool[0] ?? null;
  }

  pool.sort(
    (a, b) =>
      safeScore(b.overallScore ?? b.score) - safeScore(a.overallScore ?? a.score)
  );
  return pool[0] ?? null;
}

function prioritizeMissingSkills(missing: string[], weaknesses: string[]): string[] {
  // Weaknesses that mention a skill first, then remaining missing skills.
  const ranked: string[] = [];
  for (const skill of missing) {
    const tied = weaknesses.some((w) =>
      w.toLowerCase().includes(skill.toLowerCase().slice(0, 12))
    );
    if (tied) ranked.push(`${skill} (also flagged as a weakness)`);
    else ranked.push(skill);
  }
  return ranked;
}

function experienceAnalysis(
  item: AnalysisLike,
  years: number | null
): string {
  const score = safeScore(item.experienceScore);
  const text = (item.experience ?? "").trim();
  const parts: string[] = [];
  if (years != null) {
    parts.push(`${years} year${years === 1 ? "" : "s"} of experience on the candidate profile`);
  }
  parts.push(`experience dimension scored ${score}/100`);
  if (text) parts.push(text);
  else if (score >= 70) {
    parts.push("experience signals look adequate for the role based on the AI breakdown");
  } else if (score > 0) {
    parts.push("experience depth looks limited relative to the role requirements");
  } else {
    parts.push("no detailed experience narrative was stored in the resume analysis");
  }
  return parts.join(". ") + ".";
}

function educationAnalysis(item: AnalysisLike): string {
  const score = safeScore(item.educationScore);
  const text = (item.education ?? "").trim();
  if (text) {
    return `Education score ${score}/100. ${text}`;
  }
  if (score >= 70) {
    return `Education score ${score}/100 — credentials look sufficient on paper for this role.`;
  }
  if (score > 0) {
    return `Education score ${score}/100 — education fit is modest; validate relevance in interview.`;
  }
  return "No education narrative was stored in the resume analysis; rely on the profile and interview checks.";
}

function finalRecommendationText(
  label: HiringAssistantLabel,
  name: string,
  job: string,
  score: number
): string {
  switch (label) {
    case "Strong Hire":
      return `Advance **${name}** for **${job}** immediately. At **${score}/100**, schedule a focused technical interview and prepare an offer path if they clear it.`;
    case "Hire":
      return `Recommend moving **${name}** forward for **${job}**. Score **${score}/100** supports hiring after a structured interview that confirms the strengths above.`;
    case "Maybe":
      return `Hold a reserved shortlist for **${name}** on **${job}** (**${score}/100**). Interview only against the missing skills and risks — hire only if those clear.`;
    case "Reject":
      return `Do not advance **${name}** for **${job}** based on the current analysis (**${score}/100**). Reconsider only if a different role fits better or new evidence changes the score.`;
  }
}

/**
 * Detect hiring-assistant style questions.
 */
export function isHiringAssistantQuestion(message: string): boolean {
  return /\b(should i hire|would you recommend|good fit|why should i (hire|reject)|suitable for|against the job requirements|hiring recommendation|give a hiring recommendation|explain (the )?ai score|explain why the score|score is \d+|candidate'?s strengths|what are the strengths|what are (the |his |her |their )?weaknesses|which missing skills|missing skills matter|recommend this candidate|is this candidate)\b/i.test(
    message
  );
}

/**
 * Build the 8-section AI Hiring Assistant report from live tool results.
 */
export function formatHiringAssistantReport(
  message: string,
  results: CopilotToolResult[],
  focusCandidate?: string | null
): string | null {
  const item = selectHiringFocus(message, results, focusCandidate);
  if (!item?.candidateName) return null;

  const name = item.candidateName.trim();
  const jobHint = extractJobFromMessage(message);
  const job = (jobHint || item.jobTitle || "the role").trim();
  const score = safeScore(item.overallScore ?? item.score);
  const label = toHiringAssistantLabel(
    item.recommendationLabel || item.recommendation,
    score
  );
  const matchScore = safeScore(
    item.skillMatch != null && item.skillMatch > 0
      ? Math.round(score * 0.6 + safeScore(item.skillMatch) * 0.4)
      : score
  );

  const strengths = item.strengths?.length
    ? item.strengths
    : item.skills?.slice(0, 5) ?? [];
  const missing = prioritizeMissingSkills(
    item.missingSkills ?? [],
    item.weaknesses ?? []
  );
  const risks = getRisks(results);
  const years = getProfileYears(results, name);
  const requirements = getJobRequirements(results);
  const wantsRejectWhy = /\bwhy should i reject\b/i.test(message);
  const wantsCompareReqs = /\b(against the job requirements|job requirements)\b/i.test(
    message
  );
  const wantsScoreExplain =
    /\b(explain (the )?ai score|explain why the score|score is \d+)\b/i.test(message);

  const lines: string[] = [];
  lines.push(`## AI Hiring Assistant — ${name}`);
  lines.push(`**Role context:** ${job}${item.rank != null ? ` · Rank #${item.rank}` : ""}`);
  lines.push("");

  if (wantsRejectWhy && label !== "Reject") {
    lines.push(
      `You’re asking why to reject, but the live analysis does **not** support a reject for this candidate (current call: **${label}** at **${score}/100**). Here’s the full recommendation instead:`
    );
    lines.push("");
  }

  lines.push("### 1. Overall Recommendation");
  lines.push(`**${label}**`);
  lines.push("");

  lines.push("### 2. Match Score");
  lines.push(`**${matchScore}/100** overall match`);
  lines.push(
    `• AI resume score: ${score}/100 · Skill match: ${safeScore(item.skillMatch)}/100 · Technical: ${safeScore(item.technicalScore)}/100`
  );
  if (wantsScoreExplain) {
    lines.push(
      `• Why ${score}: driven by technical ${safeScore(item.technicalScore)}, experience ${safeScore(item.experienceScore)}, education ${safeScore(item.educationScore)}, communication ${safeScore(item.communicationScore)}, and skill match ${safeScore(item.skillMatch)}.`
    );
  }
  lines.push("");

  lines.push("### 3. Technical Strengths");
  if (strengths.length) lines.push(...bullets(strengths, 6));
  else lines.push("• No narrative strengths were stored in the resume analysis.");
  lines.push("");

  lines.push("### 4. Missing Skills");
  if (missing.length) {
    lines.push("Highest-impact gaps first:");
    lines.push(...bullets(missing, 6));
  } else {
    lines.push("• No major missing-skill flags in the current analysis.");
  }
  lines.push("");

  lines.push("### 5. Experience Analysis");
  lines.push(experienceAnalysis(item, years));
  lines.push("");

  lines.push("### 6. Education Analysis");
  lines.push(educationAnalysis(item));
  lines.push("");

  lines.push("### 7. Risk Factors");
  if (risks.length) lines.push(...bullets(risks, 6));
  else if ((item.weaknesses ?? []).length) {
    lines.push(...bullets(item.weaknesses ?? [], 4));
  } else {
    lines.push("• No elevated risk flags were returned from the hiring-risk analysis.");
  }
  lines.push("");

  if (wantsCompareReqs && requirements.length) {
    lines.push("### Job requirements comparison");
    lines.push("Requirements on file:");
    lines.push(...bullets(requirements, 6));
    if (item.skills?.length) {
      lines.push("", "Candidate skills from analysis:");
      lines.push(...bullets(item.skills, 6));
    }
    lines.push("");
  }

  lines.push("### 8. Final Recommendation");
  if (item.summary?.trim()) {
    lines.push(item.summary.trim());
    lines.push("");
  }
  lines.push(finalRecommendationText(label, name, job, score));

  return lines.join("\n");
}
