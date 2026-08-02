import "server-only";

import type { CopilotToolResult } from "@/lib/ai/hr-tools";
import {
  formatHiringAssistantReport,
  isHiringAssistantQuestion,
} from "@/lib/ai/hiring-assistant-report";
import {
  formatInterviewAssistantReport,
  isInterviewAssistantQuestion,
} from "@/lib/ai/interview-assistant-report";
import {
  formatWorkflowAgentReport,
  isWorkflowAgentQuestion,
} from "@/lib/ai/workflow-agent-report";
import {
  formatCommunicationAssistantReport,
  isCommunicationAssistantQuestion,
} from "@/lib/ai/communication-assistant-report";

function safeScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function bullets(items: string[], limit = 5): string[] {
  return items
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((s) => `• ${s}`);
}

type AnalysisRow = {
  candidateName?: string | null;
  jobTitle?: string | null;
  overallScore?: number | null;
  score?: number | null;
  recommendationLabel?: string | null;
  recommendation?: string | null;
  rank?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  missingSkills?: string[];
  skills?: string[];
  summary?: string | null;
  technicalScore?: number | null;
  experienceScore?: number | null;
  educationScore?: number | null;
  communicationScore?: number | null;
  skillMatch?: number | null;
  confidence?: number | null;
  profilePath?: string | null;
};

function getAnalyses(results: CopilotToolResult[]): AnalysisRow[] {
  const analysis = results.find(
    (r) => r.tool === "searchResumeAnalysis" || r.tool === "searchAnalysis"
  );
  if (!analysis || !("analyses" in analysis) || !Array.isArray(analysis.analyses)) {
    return [];
  }
  return analysis.analyses as AnalysisRow[];
}

function getRankings(results: CopilotToolResult[]) {
  const ranking = results.find(
    (r) => r.tool === "searchAIRanking" || r.tool === "searchRanking"
  );
  if (!ranking || !("rankings" in ranking)) return [];
  return ranking.rankings;
}

function getHire(results: CopilotToolResult[]) {
  return results.find((r) => r.tool === "getHiringRecommendation");
}

function getExplain(results: CopilotToolResult[]) {
  const explain = results.find((r) => r.tool === "explainAIDecision");
  if (!explain || explain.tool !== "explainAIDecision") return [];
  return explain.explanations ?? [];
}

function getGaps(results: CopilotToolResult[]) {
  const gaps = results.find((r) => r.tool === "analyzeSkillGaps");
  if (!gaps || gaps.tool !== "analyzeSkillGaps") return [];
  return gaps.candidates ?? [];
}

function getJobs(results: CopilotToolResult[]) {
  const jobs = results.find((r) => r.tool === "searchJobs");
  if (!jobs || !("jobs" in jobs) || !Array.isArray(jobs.jobs)) return [];
  return jobs.jobs as Array<{ title?: string }>;
}

function getApps(results: CopilotToolResult[]) {
  const apps = results.find((r) => r.tool === "searchApplications");
  if (!apps || !("applications" in apps) || !Array.isArray(apps.applications)) {
    return [];
  }
  return apps.applications as Array<{
    fullName?: string;
    jobTitle?: string;
    status?: string;
  }>;
}

function getProfiles(results: CopilotToolResult[]) {
  const profile = results.find((r) => r.tool === "getCandidateProfile");
  if (!profile || !("profiles" in profile) || !Array.isArray(profile.profiles)) {
    return [];
  }
  return profile.profiles.map((p) => ({
    fullName: p.fullName,
    yearsOfExperience: p.yearsOfExperience,
    skills: p.skills ?? [],
    location: p.location,
  }));
}

function primaryCandidate(results: CopilotToolResult[]): AnalysisRow | null {
  const hire = getHire(results);
  if (hire && "candidateName" in hire && hire.candidateName) {
    return {
      candidateName: hire.candidateName as string,
      jobTitle: (hire.jobTitle as string) ?? null,
      overallScore: hire.aiScore as number | null,
      score: hire.aiScore as number | null,
      recommendationLabel: (hire.recommendationLabel as string) ?? null,
      recommendation: (hire.recommendation as string) ?? null,
      rank: hire.ranking && typeof hire.ranking === "object"
        ? ((hire.ranking as { rank?: number | null }).rank ?? null)
        : null,
      strengths: Array.isArray(hire.strengths) ? (hire.strengths as string[]) : [],
      weaknesses: Array.isArray(hire.weaknesses) ? (hire.weaknesses as string[]) : [],
      missingSkills: Array.isArray(hire.missingSkills)
        ? (hire.missingSkills as string[])
        : [],
      skills: Array.isArray(hire.candidateSkills)
        ? (hire.candidateSkills as string[])
        : [],
      summary: null,
    };
  }
  return getAnalyses(results)[0] ?? null;
}

function scoreLabel(score: number): string {
  if (score >= 80) return "strong";
  if (score >= 65) return "solid mid-to-upper";
  if (score >= 45) return "mixed";
  return "weak";
}

function recommendationTone(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("strong hire") || lower === "hire") {
    return "I would advance this candidate";
  }
  if (lower.includes("reservation") || lower.includes("maybe")) {
    return "I would shortlist with reservations";
  }
  if (lower.includes("do not") || lower.includes("reject") || lower.includes("no hire")) {
    return "I would not advance this candidate right now";
  }
  return `The current recommendation is “${label}”`;
}

/** Ranking list — recruiter voice. */
export function formatRankingAnswer(results: CopilotToolResult[]): string | null {
  const rankings = getRankings(results);
  if (!rankings.length) return null;

  const lines = [
    "Here’s how the AI ranking currently stacks up:",
    "",
  ];
  for (const row of rankings.slice(0, 8)) {
    const name = row.candidateName?.trim() || "Unknown candidate";
    const job = row.jobTitle?.trim() || "the role";
    const score = safeScore(row.score);
    const rank = row.rank ?? "—";
    const reason = (row.reason ?? "").trim();
    lines.push(
      `${rank}. **${name}** for ${job} — **${score}/100**` +
        (reason ? `. ${reason}` : ".")
    );
  }
  const top = rankings[0];
  if (top) {
    lines.push(
      "",
      `If you’re prioritizing interviews, start with **${top.candidateName ?? "the top candidate"}** (${safeScore(top.score)}/100).`
    );
  }
  return lines.join("\n");
}

/** Resume summary / strengths / gaps — recruiter voice. */
export function formatResumeAnalysisAnswer(
  results: CopilotToolResult[],
  message = ""
): string | null {
  const analyses = getAnalyses(results);
  if (!analyses.length) return null;

  const lower = message.toLowerCase();
  const wantsStrengths = /\bstrengths?\b/i.test(lower);
  const wantsGaps =
    /\b(missing skills?|skills? are missing|gaps?|weaknesses?)\b/i.test(lower);
  const wantsSummary = /\b(summarize|summary|resume|cv)\b/i.test(lower);

  const item = analyses[0]!;
  const name = item.candidateName?.trim() || "This candidate";
  const job = item.jobTitle?.trim() || "the target role";
  const score = safeScore(item.overallScore ?? item.score);
  const label = item.recommendationLabel || item.recommendation || "Under review";
  const profile = getProfiles(results)[0];
  const app = getApps(results).find((a) =>
    (a.fullName ?? "").toLowerCase().includes(name.toLowerCase())
  );

  const lines: string[] = [];

  if (wantsStrengths && !wantsGaps) {
    lines.push(`**${name}**’s strongest signals for **${job}**:`);
    lines.push("");
    if (item.strengths?.length) lines.push(...bullets(item.strengths, 6));
    else if (item.skills?.length) {
      lines.push("The analysis doesn’t list narrative strengths, but these skills stand out:");
      lines.push(...bullets(item.skills, 6));
    } else {
      lines.push(
        `• Overall AI score is **${score}/100** (${scoreLabel(score)}), labeled **${label}**.`
      );
    }
    if (profile?.yearsOfExperience != null) {
      lines.push("", `Profile notes about **${profile.yearsOfExperience}** years of experience.`);
    }
    return lines.join("\n");
  }

  if (wantsGaps && !wantsStrengths) {
    const gaps = getGaps(results);
    const gapRow =
      gaps.find((g) =>
        g.candidateName.toLowerCase().includes(name.toLowerCase())
      ) ?? gaps[0];
    const missing = gapRow?.missingSkills?.length
      ? gapRow.missingSkills
      : item.missingSkills ?? [];
    const weaknesses = gapRow?.weaknesses?.length
      ? gapRow.weaknesses
      : item.weaknesses ?? [];

    lines.push(`Here’s what I’d probe before advancing **${name}** for **${job}**:`);
    lines.push("");
    if (missing.length) {
      lines.push("**Missing / under-evidenced skills**");
      lines.push(...bullets(missing, 8));
    }
    if (weaknesses.length) {
      lines.push("", "**Weak spots called out in the analysis**");
      lines.push(...bullets(weaknesses, 5));
    }
    if (!missing.length && !weaknesses.length) {
      lines.push(
        `The resume analysis doesn’t flag major missing skills. With a **${score}/100** score (${label}), I’d still run a focused technical screen to validate depth.`
      );
    }
    return lines.join("\n");
  }

  // Full summary (default)
  lines.push(
    wantsSummary
      ? `Here’s a recruiter summary of **${name}** against **${job}**:`
      : `Here’s my read on **${name}** for **${job}**:`
  );
  lines.push("");
  lines.push(
    `The AI resume analysis scores them at **${score}/100** (${scoreLabel(score)} match) with a recommendation of **${label}**.`
  );
  if (item.rank != null) {
    lines.push(`They currently sit at rank **#${item.rank}** in the AI ranking for this pipeline.`);
  }
  if (app?.status) {
    lines.push(`Application status on file: **${app.status}**.`);
  }
  if (profile?.yearsOfExperience != null || profile?.location) {
    lines.push(
      `Profile context: ${
        profile.yearsOfExperience != null
          ? `${profile.yearsOfExperience} years’ experience`
          : "experience not listed"
      }${profile.location ? `, based in ${profile.location}` : ""}.`
    );
  }
  if (item.summary?.trim()) {
    lines.push("", item.summary.trim());
  }
  if (item.strengths?.length) {
    lines.push("", "**What they’re strong on**");
    lines.push(...bullets(item.strengths, 5));
  }
  if (item.missingSkills?.length || item.weaknesses?.length) {
    lines.push("", "**Where I’d dig in interview**");
    lines.push(...bullets([...(item.missingSkills ?? []), ...(item.weaknesses ?? [])], 6));
  }
  lines.push(
    "",
    recommendationTone(String(label)) +
      (score >= 65
        ? " — worth a structured interview to confirm the paper strengths."
        : " — only interview if the role is hard to fill or they cover a scarce skill.")
  );
  return lines.join("\n");
}

/** AI score explanation — recruiter voice. */
export function formatExplainAnswer(
  results: CopilotToolResult[],
  message = ""
): string | null {
  const explanations = getExplain(results);
  const analyses = getAnalyses(results);
  const rankings = getRankings(results);

  const lowScoreAsk = message.match(/\b(?:only\s+|score\s+)?(\d{1,3})\b/i);
  const targetScore = lowScoreAsk ? Number(lowScoreAsk[1]) : null;
  const wantsLow =
    /\b(low|only|weak|poor|bad)\b/i.test(message) ||
    (targetScore != null && targetScore <= 30);

  let item =
    explanations[0] ??
    (analyses[0]
      ? {
          candidateName: analyses[0].candidateName ?? "Candidate",
          jobTitle: analyses[0].jobTitle ?? "the role",
          rank: analyses[0].rank ?? null,
          aiScore: safeScore(analyses[0].overallScore ?? analyses[0].score),
          recommendation:
            analyses[0].recommendationLabel || analyses[0].recommendation || "—",
          rankingReason:
            rankings.find((r) =>
              (r.candidateName ?? "")
                .toLowerCase()
                .includes((analyses[0]!.candidateName ?? "").toLowerCase())
            )?.reason ?? null,
          scoreBreakdown: {
            overallScore: safeScore(analyses[0].overallScore ?? analyses[0].score),
            technicalScore: analyses[0].technicalScore ?? 0,
            experienceScore: analyses[0].experienceScore ?? 0,
            educationScore: analyses[0].educationScore ?? 0,
            communicationScore: analyses[0].communicationScore ?? 0,
            skillMatch: analyses[0].skillMatch ?? 0,
            confidence: analyses[0].confidence ?? 0,
          },
          strengths: analyses[0].strengths ?? [],
          weaknesses: analyses[0].weaknesses ?? [],
          missingSkills: analyses[0].missingSkills ?? [],
          summary: analyses[0].summary ?? "",
          profilePath: analyses[0].profilePath ?? "",
        }
      : null);

  if (!item && explanations.length === 0) return null;

  if (explanations.length && wantsLow) {
    const ordered = [...explanations].sort((a, b) => {
      if (targetScore != null && Number.isFinite(targetScore)) {
        return (
          Math.abs(safeScore(a.aiScore) - targetScore) -
          Math.abs(safeScore(b.aiScore) - targetScore)
        );
      }
      return safeScore(a.aiScore) - safeScore(b.aiScore);
    });
    item = ordered[0]!;
  } else if (explanations.length) {
    item = explanations[0]!;
  } else if (wantsLow && analyses.length) {
    const lowest = [...analyses].sort(
      (a, b) =>
        safeScore(a.overallScore ?? a.score) - safeScore(b.overallScore ?? b.score)
    )[0]!;
    item = {
      candidateName: lowest.candidateName ?? "Candidate",
      jobTitle: lowest.jobTitle ?? "the role",
      rank: lowest.rank ?? null,
      aiScore: safeScore(lowest.overallScore ?? lowest.score),
      recommendation: lowest.recommendationLabel || lowest.recommendation || "—",
      rankingReason: null,
      scoreBreakdown: {
        overallScore: safeScore(lowest.overallScore ?? lowest.score),
        technicalScore: lowest.technicalScore ?? 0,
        experienceScore: lowest.experienceScore ?? 0,
        educationScore: lowest.educationScore ?? 0,
        communicationScore: lowest.communicationScore ?? 0,
        skillMatch: lowest.skillMatch ?? 0,
        confidence: lowest.confidence ?? 0,
      },
      strengths: lowest.strengths ?? [],
      weaknesses: lowest.weaknesses ?? [],
      missingSkills: lowest.missingSkills ?? [],
      summary: lowest.summary ?? "",
      profilePath: lowest.profilePath ?? "",
    };
  }

  if (!item) return null;

  const score = safeScore(item.aiScore);
  const name = item.candidateName;
  const job = item.jobTitle;
  const breakdown = item.scoreBreakdown;
  const lowest = [
    ["technical", safeScore(breakdown.technicalScore)],
    ["experience", safeScore(breakdown.experienceScore)],
    ["education", safeScore(breakdown.educationScore)],
    ["communication", safeScore(breakdown.communicationScore)],
    ["skill match", safeScore(breakdown.skillMatch)],
  ].sort((a, b) => Number(b[1]) - Number(a[1]));
  const weakest = [...lowest].sort((a, b) => Number(a[1]) - Number(b[1]))[0];

  const lines = [
    wantsLow
      ? `**${name}** scored **${score}/100** for **${job}** — here’s why that number is ${score <= 40 ? "low" : "where it is"}:`
      : `Here’s what drives **${name}**’s AI score of **${score}/100** for **${job}**:`,
    "",
    `Recommendation on file: **${item.recommendation}**${item.rank != null ? ` · Rank #${item.rank}` : ""}.`,
  ];

  if (item.rankingReason) {
    lines.push(`Ranking note: ${item.rankingReason}`);
  }

  lines.push(
    "",
    "**Score breakdown**",
    `• Technical ${safeScore(breakdown.technicalScore)} · Experience ${safeScore(breakdown.experienceScore)} · Education ${safeScore(breakdown.educationScore)} · Communication ${safeScore(breakdown.communicationScore)} · Skill match ${safeScore(breakdown.skillMatch)}`
  );

  if (weakest) {
    lines.push(
      "",
      `The softest dimension is **${weakest[0]}** (${weakest[1]}/100), which pulls the overall score down.`
    );
  }

  if (item.strengths?.length) {
    lines.push("", "**What’s carrying the score**");
    lines.push(...bullets(item.strengths, 4));
  }
  if (item.missingSkills?.length || item.weaknesses?.length) {
    lines.push("", "**What’s holding it back**");
    lines.push(
      ...bullets([...(item.missingSkills ?? []), ...(item.weaknesses ?? [])], 5)
    );
  }
  if (item.summary?.trim()) {
    lines.push("", item.summary.trim());
  }

  lines.push(
    "",
    score >= 70
      ? "Bottom line: the model sees a credible fit — interview to confirm depth, not to rediscover basics."
      : score >= 45
        ? "Bottom line: mixed signal. Shortlist only if you can interview against the specific gaps above."
        : "Bottom line: the analysis is signaling a poor fit for this role as written. Consider another role or a reject unless you have strong non-resume evidence."
  );

  return lines.join("\n");
}

/** Salary — recruiter voice. */
export function formatSalaryAnswer(results: CopilotToolResult[]): string | null {
  const salary = results.find((r) => r.tool === "getSalaryRecommendation");
  if (!salary || salary.tool !== "getSalaryRecommendation") return null;
  if (!salary.recommendations?.length) return null;

  const lines = ["Here’s the salary band I’d work from based on the live profile signals:", ""];
  for (const row of salary.recommendations.slice(0, 5)) {
    const band =
      row.low != null && row.recommended != null && row.maximum != null
        ? `${row.low.toLocaleString()} (low) → ${row.recommended.toLocaleString()} (target) → ${row.maximum.toLocaleString()} (stretch)`
        : row.recommended != null
          ? String(row.recommended.toLocaleString())
          : "not enough signal to quote a band";
    lines.push(`**${row.candidateName}** for ${row.jobTitle}: ${band}`);
    if (row.basis?.length) {
      lines.push(`• Basis: ${row.basis.slice(0, 2).join("; ")}`);
    }
    if (row.expectedSalary != null) {
      lines.push(`• Candidate expectation on file: ${row.expectedSalary.toLocaleString()}`);
    }
  }
  lines.push("", "Treat this as advisory — calibrate against your internal bands before offering.");
  return lines.join("\n");
}

/** Compare — recruiter voice. */
export function formatCompareAnswer(results: CopilotToolResult[]): string | null {
  const compare = results.find((r) => r.tool === "compareCandidates");
  if (!compare || compare.tool !== "compareCandidates") return null;
  if (!compare.comparisonTable?.length) return null;

  const lines = ["Here’s a side-by-side read of the candidates:", ""];
  for (const row of compare.comparisonTable) {
    lines.push(
      `**${row.candidateName || "Unknown"}** (${row.jobTitle || "role"}) — AI score **${safeScore(row.aiScore)}**, skill match **${safeScore(row.skillMatch)}**, rank ${row.rank ?? "—"}. Recommendation: ${row.recommendation || "—"}.`
    );
  }
  if (compare.betterCandidate) {
    lines.push(
      "",
      `If I had to choose one to advance first, I’d pick **${compare.betterCandidate}**.`
    );
  }
  if (compare.differences.length > 0) {
    lines.push("", ...compare.differences.map((d) => `• ${d}`));
  }
  return lines.join("\n");
}

function formatSkillGapAnswer(results: CopilotToolResult[], message = ""): string | null {
  return formatResumeAnalysisAnswer(results, message || "What skills are missing?");
}

function formatRoleFitAnswer(
  message: string,
  results: CopilotToolResult[]
): string | null {
  const isAlternateAsk = /\banother suitable (job|role)\b/i.test(message);
  const target = isAlternateAsk
    ? null
    : message.match(
        /\b(?:for|as|targeting role)\s+([A-Za-z][A-Za-z0-9 /+#.-]{2,60})/i
      )?.[1]?.trim() ?? null;

  const primary = primaryCandidate(results);
  if (!primary) return null;

  const name = primary.candidateName?.trim() || "This candidate";
  const currentJob = primary.jobTitle?.trim() || "their current matched role";
  const score = safeScore(primary.overallScore ?? primary.score);
  const label = primary.recommendationLabel || primary.recommendation || "Under review";
  const jobs = getJobs(results);
  const gaps = getGaps(results);
  const gapRow =
    gaps.find((g) => g.candidateName.toLowerCase().includes(name.toLowerCase())) ??
    gaps[0];
  const missing = gapRow?.missingSkills?.length
    ? gapRow.missingSkills
    : primary.missingSkills ?? [];

  const targetLabel = target && !/^(role|job)\.?$/i.test(target) ? target : null;
  const directFit =
    targetLabel &&
    (currentJob.toLowerCase().includes(targetLabel.toLowerCase()) ||
      targetLabel.toLowerCase().includes(currentJob.toLowerCase()) ||
      (targetLabel.toLowerCase().includes("frontend") &&
        /developer|react|next/i.test(currentJob)));

  const lines: string[] = [];

  if (targetLabel) {
    lines.push(`Would **${name}** fit **${targetLabel}**?`);
    lines.push("");
    if (directFit) {
      lines.push(
        `Yes — their strongest analysis is already against **${currentJob}** at **${score}/100** (${label}). That’s in the same family as ${targetLabel}, so I’d treat them as a serious shortlist for this role.`
      );
    } else {
      lines.push(
        `Cautiously. We don’t have a dedicated AI analysis for “${targetLabel}”; the best cached read is **${currentJob}** at **${score}/100** (${label}). I’d only move them if ${targetLabel} overlaps with the strengths below.`
      );
    }
  } else {
    lines.push(`Other roles I’d consider for **${name}**:`);
    lines.push("");
    lines.push(
      `Their best analysis today is **${currentJob}** (**${score}/100**, ${label}). Based on transferable strengths, look at adjacent open roles rather than forcing a poor-fit title.`
    );
  }

  if (primary.strengths?.length) {
    lines.push("", "**Transferable strengths**");
    lines.push(...bullets(primary.strengths, 4));
  }
  if (missing.length) {
    lines.push("", "**Gaps to respect**");
    lines.push(...bullets(missing, 5));
  }

  const alts = jobs
    .map((j) => j.title?.trim())
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .filter((t) => t.toLowerCase() !== currentJob.toLowerCase())
    .slice(0, 4);
  if (alts.length) {
    lines.push("", "**Open roles that may be a better / alternate fit**");
    lines.push(...bullets(alts, 4));
  }

  lines.push(
    "",
    directFit
      ? "Recommendation: shortlist for a focused interview on the target role."
      : "Recommendation: keep them in the Developer-track pipeline unless a hiring manager explicitly wants a stretch assignment."
  );

  return lines.join("\n");
}

function formatHireNarrative(results: CopilotToolResult[], message = ""): string | null {
  const hire = getHire(results);
  const primary = primaryCandidate(results);
  // Never invent a 0/100 "This candidate" narrative from an empty hire shell.
  if (!primary?.candidateName) {
    if (
      hire &&
      "formattedReport" in hire &&
      typeof hire.formattedReport === "string" &&
      hire.formattedReport.trim() &&
      hire.candidateName
    ) {
      return hire.formattedReport;
    }
    return null;
  }

  const name = primary.candidateName.trim();
  const job = primary.jobTitle?.trim() || "the role";
  const score = safeScore(primary.overallScore ?? primary.score);
  const label =
    (hire && "recommendationLabel" in hire && hire.recommendationLabel
      ? String(hire.recommendationLabel)
      : null) ||
    primary.recommendationLabel ||
    primary.recommendation ||
    "Under review";
  const wantsShortlist = /\bshortlist\b/i.test(message);

  const strengths = primary.strengths ?? [];
  const missing = primary.missingSkills ?? [];
  const weaknesses = primary.weaknesses ?? [];
  const interviewFocus =
    hire && "interviewFocus" in hire && Array.isArray(hire.interviewFocus)
      ? (hire.interviewFocus as string[])
      : [];
  const apps = getApps(results);
  const app = apps.find((a) =>
    (a.fullName ?? "").toLowerCase().includes(name.toLowerCase())
  );

  const lines: string[] = [];

  if (wantsShortlist) {
    lines.push(
      score >= 65
        ? `Yes — I’d **shortlist ${name}** for **${job}**.`
        : `I would **not shortlist ${name}** for **${job}** yet.`
    );
    lines.push("");
    lines.push(
      `AI resume score **${score}/100** (${scoreLabel(score)}), recommendation **${label}**${primary?.rank != null ? `, rank #${primary.rank}` : ""}.`
    );
    if (app?.status) lines.push(`Current application status: **${app.status}**.`);
    if (strengths.length) {
      lines.push("", "**Why shortlist**");
      lines.push(...bullets(strengths, 4));
    }
    if (missing.length || weaknesses.length) {
      lines.push("", "**Conditions / risks**");
      lines.push(...bullets([...missing, ...weaknesses], 5));
    }
    return lines.join("\n");
  }

  // Default hire advice
  lines.push(
    `${recommendationTone(String(label))} — **${name}** for **${job}** (AI score **${score}/100**, ${scoreLabel(score)} fit).`
  );
  lines.push("");
  if (primary?.rank != null) {
    lines.push(`They are rank **#${primary.rank}** in the current AI ranking.`);
  }
  if (app?.status) {
    lines.push(`Application status: **${app.status}**.`);
  }
  if (strengths.length) {
    lines.push("", "**Why this makes sense**");
    lines.push(...bullets(strengths, 5));
  }
  if (missing.length || weaknesses.length) {
    lines.push("", "**What to validate before offering**");
    lines.push(...bullets([...missing, ...weaknesses], 5));
  }
  if (interviewFocus.length) {
    lines.push("", "**Interview focus**");
    lines.push(...bullets(interviewFocus, 5));
  }
  if (hire && "finalVerdict" in hire && typeof hire.finalVerdict === "string" && hire.finalVerdict.trim()) {
    lines.push("", hire.finalVerdict.trim());
  } else {
    lines.push(
      "",
      score >= 80
        ? "Next step: technical interview, then offer discussion if they clear it."
        : score >= 60
          ? "Next step: structured interview against the gaps above — hire only if those clear."
          : "Next step: do not advance unless you have a specific business reason to override the analysis."
    );
  }

  return lines.join("\n");
}

/**
 * Prefer recruiter-style answers built from live tool JSON so ranking/resume
 * responses succeed even when the Groq answer model is unavailable.
 */
export function formatDeterministicToolAnswer(
  message: string,
  results: CopilotToolResult[]
): string | null {
  const lower = message.toLowerCase();

  // AI Interview Assistant — personalized Q packs (before hire narrative).
  if (isInterviewAssistantQuestion(message)) {
    const interview = formatInterviewAssistantReport(message, results);
    if (interview) return interview;
    return [
      "I couldn’t build a personalized interview pack from live resume analysis for that ask.",
      "Name the candidate (or open their hiring thread), ensure AI Resume Analysis exists, then try again — for example: “Generate interview questions for basitnayab6975”.",
    ].join("\n");
  }

  // AI Recruitment Communication Assistant — live emails / invitations / letters.
  if (isCommunicationAssistantQuestion(message)) {
    const communication = formatCommunicationAssistantReport(message, results);
    if (communication) return communication;
  }

  // AI Recruitment Workflow Agent — shortlist / compare / pipeline / insights.
  if (isWorkflowAgentQuestion(message)) {
    const workflow = formatWorkflowAgentReport(message, results);
    if (workflow) return workflow;
  }

  // Structured AI Hiring Assistant report (8 sections) for hire/fit/score questions.
  if (
    isHiringAssistantQuestion(message) &&
    !isInterviewAssistantQuestion(message) &&
    !isWorkflowAgentQuestion(message)
  ) {
    const assistant = formatHiringAssistantReport(message, results);
    if (assistant) return assistant;
  }

  const wantsHire =
    /\b(should i hire|hiring recommendation|worth interviewing|interview focus|provide interview|shortlist)\b/i.test(
      lower
    );
  const wantsRoleFit =
    /\b(role fit|assess fit|fit of|targeting role|recommend .+ for|would (he|she|they) fit|suitable (job|role)|another suitable|recommend another|open jobs and resume analysis)\b/i.test(
      lower
    );
  const wantsRanking =
    /\b(ranking|leaderboard|top ranked|who (is|are) (the )?best|highest score)\b/i.test(
      lower
    ) && !/\bexplain\b/i.test(lower);
  const wantsResume =
    /\b(resume|cv|analysis|analyze|strengths|weaknesses|missing skills|skills? are missing|summarize)\b/i.test(
      lower
    );
  const wantsCompare =
    /\b(compare|difference|versus|vs\.?|which candidate is better|who is better)\b/i.test(
      lower
    );
  const wantsExplain =
    /\b(explain|why|score|breakdown|score low|only \d+)\b/i.test(lower);
  const wantsSalary = /\bsalary|compensation|offer\b/i.test(lower);
  const wantsGaps = /\b(missing skills|skill gaps?|skills? are missing)\b/i.test(
    lower
  );

  if (wantsRoleFit) {
    const roleFit = formatRoleFitAnswer(message, results);
    if (roleFit) return roleFit;
  }
  if (wantsSalary) {
    const salary = formatSalaryAnswer(results);
    if (salary) return salary;
  }
  if (wantsCompare) {
    const compare = formatCompareAnswer(results);
    if (compare) return compare;
  }
  if (wantsGaps) {
    const gaps = formatSkillGapAnswer(results, message);
    if (gaps) return gaps;
  }
  if (wantsExplain && !wantsHire) {
    const explain = formatExplainAnswer(results, message);
    if (explain) return explain;
  }
  if (wantsHire) {
    const hire = formatHireNarrative(results, message);
    if (hire) return hire;
  }
  if (wantsRanking) {
    const ranking = formatRankingAnswer(results);
    if (ranking) return ranking;
  }
  if (wantsResume) {
    const resume = formatResumeAnalysisAnswer(results, message);
    if (resume) return resume;
  }

  return (
    formatHireNarrative(results, message) ??
    formatRoleFitAnswer(message, results) ??
    formatExplainAnswer(results, message) ??
    formatResumeAnalysisAnswer(results, message) ??
    formatCompareAnswer(results) ??
    formatRankingAnswer(results) ??
    formatSalaryAnswer(results)
  );
}

/** Safe JSON for Groq — never throws; strips non-serializable values. */
export function safeStringifyContext(value: unknown): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(value, (_key, v) => {
      if (typeof v === "bigint") return v.toString();
      if (typeof v === "number" && !Number.isFinite(v)) return null;
      if (v && typeof v === "object") {
        if (seen.has(v as object)) return "[Circular]";
        seen.add(v as object);
      }
      return v;
    });
  } catch (error) {
    console.error("[ai/copilot] JSON.stringify(context) failed:", error);
    throw new Error(
      `Failed to serialize Copilot context for Groq: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error }
    );
  }
}
