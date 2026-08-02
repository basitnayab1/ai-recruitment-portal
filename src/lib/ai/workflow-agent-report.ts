/**
 * AI Recruitment Workflow Agent — proactive hiring workflow answers
 * from live Supabase tool evidence only.
 */

import type { CopilotToolResult } from "@/lib/ai/hr-tools";
import { toHiringAssistantLabel } from "@/lib/ai/hiring-assistant-report";

export type InterviewAction = "Interview" | "Reject" | "Hold" | "Needs another review";

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

type AnalysisLike = {
  candidateName?: string | null;
  jobTitle?: string | null;
  overallScore?: number | null;
  score?: number | null;
  experienceScore?: number | null;
  educationScore?: number | null;
  skillMatch?: number | null;
  recommendationLabel?: string | null;
  recommendation?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  missingSkills?: string[];
  skills?: string[];
  experience?: string | null;
  education?: string | null;
  summary?: string | null;
  rank?: number | null;
};

function getAnalyses(results: CopilotToolResult[]): AnalysisLike[] {
  const analysis = results.find(
    (r) => r.tool === "searchResumeAnalysis" || r.tool === "searchAnalysis"
  );
  if (!analysis || !("analyses" in analysis) || !Array.isArray(analysis.analyses)) {
    return [];
  }
  return analysis.analyses as AnalysisLike[];
}

function getRankings(results: CopilotToolResult[]) {
  const ranking = results.find(
    (r) => r.tool === "searchAIRanking" || r.tool === "searchRanking"
  );
  if (!ranking || !("rankings" in ranking)) return [];
  return ranking.rankings;
}

function getApps(results: CopilotToolResult[]) {
  const apps = results.find((r) => r.tool === "searchApplications");
  if (!apps || !("applications" in apps) || !Array.isArray(apps.applications)) {
    return [];
  }
  return apps.applications;
}

function getPriorities(results: CopilotToolResult[]) {
  const p = results.find((r) => r.tool === "getInterviewPriority");
  if (!p || p.tool !== "getInterviewPriority") return [];
  return p.priorities ?? [];
}

function getGaps(results: CopilotToolResult[]) {
  const g = results.find((r) => r.tool === "analyzeSkillGaps");
  if (!g || g.tool !== "analyzeSkillGaps") return [];
  return g.candidates ?? [];
}

function getStats(results: CopilotToolResult[]) {
  const s = results.find((r) => r.tool === "getDashboardStats");
  if (!s || !("stats" in s)) return null;
  return s.stats;
}

function getAlerts(results: CopilotToolResult[]) {
  const a = results.find((r) => r.tool === "getSmartAlerts");
  if (!a || !("alerts" in a) || !Array.isArray(a.alerts)) return [];
  return a.alerts as Array<{ title?: string; message?: string; severity?: string }>;
}

function extractJob(message: string): string | null {
  const known = message.match(
    /\b(frontend developer|backend developer|full[- ]?stack developer|video editor|react developer|developer|designer|engineer|manager|analyst)\b/i
  );
  return known?.[1] ?? null;
}

function missingDataNote(results: CopilotToolResult[]): string[] {
  const notes: string[] = [];
  const analyses = getAnalyses(results);
  const rankings = getRankings(results);
  const apps = getApps(results);
  const jobs = results.find((r) => r.tool === "searchJobs");
  const interviews = results.find((r) => r.tool === "searchInterviews");
  const stats = getStats(results);

  if (!analyses.length) {
    notes.push(
      "No rows from `ai_resume_analysis` matched this ask — run AI Resume Analysis for applicants first."
    );
  }
  if (!rankings.length) {
    notes.push(
      "No rows from `ai_candidate_ranking` matched this ask — generate AI ranking for the job pipeline."
    );
  }
  if (!apps.length && results.some((r) => r.tool === "searchApplications")) {
    notes.push("No matching rows in `applications` for the current filters.");
  }
  if (
    jobs &&
    "jobs" in jobs &&
    Array.isArray(jobs.jobs) &&
    jobs.jobs.length === 0
  ) {
    notes.push("No matching rows in `jobs` (published openings may be empty).");
  }
  if (
    interviews &&
    "interviews" in interviews &&
    Array.isArray(interviews.interviews) &&
    interviews.interviews.length === 0
  ) {
    notes.push("No matching rows in `interviews` for the current filters.");
  }
  if (stats && stats.totalApplications === 0) {
    notes.push("`applications` table currently has 0 rows.");
  }
  if (stats && stats.totalCandidates === 0) {
    notes.push("`candidate_profiles` table currently has 0 rows.");
  }
  return notes;
}

function toInterviewAction(item: AnalysisLike): InterviewAction {
  const score = safeScore(item.overallScore ?? item.score);
  const label = toHiringAssistantLabel(
    item.recommendationLabel || item.recommendation,
    score
  );
  if (label === "Reject" || score < 50) return "Reject";
  if (label === "Strong Hire" || score >= 80) return "Interview";
  if (label === "Hire" || score >= 65) return "Interview";
  if (score >= 55) return "Needs another review";
  return "Hold";
}

function explainAction(action: InterviewAction, item: AnalysisLike): string {
  const score = safeScore(item.overallScore ?? item.score);
  const missing = (item.missingSkills ?? []).slice(0, 3).join(", ");
  switch (action) {
    case "Interview":
      return `Score ${score}/100 and recommendation “${item.recommendationLabel || item.recommendation || "—"}” support advancing to interview${missing ? `; probe: ${missing}` : ""}.`;
    case "Reject":
      return `Score ${score}/100 (and/or reject signals) does not clear the bar for this role${missing ? `; major gaps: ${missing}` : ""}.`;
    case "Hold":
      return `Score ${score}/100 is too weak to interview now — hold pending stronger pipeline need or updated analysis.`;
    case "Needs another review":
      return `Score ${score}/100 is mixed — have HR re-review the resume/analysis before scheduling${missing ? `; watch: ${missing}` : ""}.`;
  }
}

/** Detect workflow-agent questions (pipeline-level, not single-candidate hire). */
export function isWorkflowAgentQuestion(message: string): boolean {
  return /\b(shortlist candidates|show shortlisted|top candidates|best applicants|recommend top|recommend best applicants|who should we interview|interview first|compare( candidates?)?|compare .+ and|who is better|more suitable|side[- ]by[- ]side|hiring pipeline|recruitment summary|hiring dashboard|hiring summary|summarize hiring|biggest skill gaps|most common missing|strongest candidates|weakest candidates|needing attention|needs? another (interview|review)|who should be rejected|who should i hire|who is the (best|strongest)|strongest applicant|which candidate is best|best candidate)\b/i.test(
    message
  );
}

export function detectWorkflowKind(
  message: string
):
  | "shortlist"
  | "compare"
  | "interview_decision"
  | "pipeline"
  | "insights"
  | null {
  const lower = message.toLowerCase();
  if (
    /\b(compare|who is better|more suitable|side[- ]by[- ]side)\b/i.test(lower) ||
    (/\bwhich candidate is best\b/i.test(lower) && /\b(and|vs\.?|versus)\b/i.test(lower))
  ) {
    return "compare";
  }
  if (
    /\b(hiring pipeline|recruitment summary|hiring dashboard|hiring summary|summarize hiring|dashboard summary)\b/i.test(
      lower
    )
  ) {
    return "pipeline";
  }
  if (
    /\b(biggest skill gaps|most common missing|strongest candidates|weakest candidates|needing attention|candidates needing)\b/i.test(
      lower
    )
  ) {
    return "insights";
  }
  if (
    /\b(who should be rejected|needs? another (interview|review)|recommend (interview|reject|hold)|interview recommendation)\b/i.test(
      lower
    )
  ) {
    return "interview_decision";
  }
  if (
    /\b(shortlist|top candidates|best applicants|recommend top|recommend best|who should we interview|interview first|who should i hire|who is the (best|strongest)|strongest applicant|show shortlisted|which candidate is best|best candidate)\b/i.test(
      lower
    )
  ) {
    return "shortlist";
  }
  return null;
}

/** Exact missing-table notes for empty / thin tool context. */
export function describeMissingLiveTables(results: CopilotToolResult[]): string {
  const notes = missingDataNote(results);
  if (notes.length) return notes.map((n) => `• ${n}`).join("\n");
  return [
    "• No usable rows from `ai_resume_analysis`, `ai_candidate_ranking`, `applications`, `jobs`, `candidate_profiles`, or `interviews` for this ask.",
    "• Run AI Resume Analysis / AI ranking on applicants, then retry with a role or candidate name.",
  ].join("\n");
}

/** 1. Shortlisting */
export function formatShortlistWorkflow(
  message: string,
  results: CopilotToolResult[]
): string | null {
  const job = extractJob(message);
  let analyses = getAnalyses(results);
  const rankings = getRankings(results);
  const priorities = getPriorities(results);
  const gaps = getGaps(results);

  if (job) {
    const filtered = analyses.filter((a) =>
      (a.jobTitle ?? "").toLowerCase().includes(job.toLowerCase())
    );
    if (filtered.length) analyses = filtered;
  }

  // Merge ranking order when available
  const byName = new Map<string, AnalysisLike>();
  for (const a of analyses) {
    if (a.candidateName) byName.set(a.candidateName.toLowerCase(), a);
  }
  for (const r of rankings) {
    const key = (r.candidateName ?? "").toLowerCase();
    if (!key) continue;
    const existing = byName.get(key);
    if (existing) {
      existing.rank = r.rank ?? existing.rank;
      if (!existing.overallScore) existing.overallScore = r.score;
    }
  }

  const ordered = [...byName.values()].sort(
    (a, b) =>
      safeScore(b.overallScore ?? b.score) - safeScore(a.overallScore ?? a.score)
  );

  if (!ordered.length && !rankings.length) {
    const notes = missingDataNote(results);
    return [
      "## Recruitment Workflow — Shortlist",
      "",
      "I can’t shortlist yet because there is no usable AI ranking/analysis evidence.",
      ...notes.map((n) => `• ${n}`),
    ].join("\n");
  }

  const pool =
    ordered.length > 0
      ? ordered
      : rankings.map((r) => ({
          candidateName: r.candidateName,
          jobTitle: r.jobTitle,
          overallScore: r.score,
          score: r.score,
          rank: r.rank,
          strengths: [] as string[],
          missingSkills: [] as string[],
          weaknesses: [] as string[],
          recommendationLabel: null,
          recommendation: null,
          summary: r.reason ?? null,
        }));

  const top = pool.slice(0, 5);
  const lines = [
    "## Recruitment Workflow — Candidate Shortlist",
    job ? `**Role filter:** ${job}` : "**Role filter:** all matched analyses",
    "",
    "### Recommended shortlist",
  ];

  top.forEach((c, i) => {
    const name = c.candidateName ?? "Unknown";
    const score = safeScore(c.overallScore ?? c.score);
    const gap =
      gaps.find((g) => g.candidateName.toLowerCase().includes(name.toLowerCase())) ??
      null;
    const missing = gap?.missingSkills?.length
      ? gap.missingSkills
      : c.missingSkills ?? [];
    const priority =
      priorities.find((p) =>
        p.candidateName.toLowerCase().includes(name.toLowerCase())
      )?.priority ?? i + 1;

    lines.push("");
    lines.push(`#### ${i + 1}. ${name} — ${c.jobTitle ?? "role"}`);
    lines.push(
      `• **AI score:** ${score}/100${c.rank != null ? ` · Rank #${c.rank}` : ""} · **Interview priority:** #${priority}`
    );
    lines.push(
      `• **Why shortlisted:** ${
        (c.strengths ?? []).slice(0, 2).join("; ") ||
        c.summary ||
        `Top AI signal (${score}/100) among available analyses`
      }`
    );
    lines.push(
      `• **Missing skills:** ${
        missing.length ? missing.slice(0, 4).join("; ") : "None flagged in analysis"
      }`
    );
    lines.push(`• **Recommendation label:** ${c.recommendationLabel || c.recommendation || "—"}`);
  });

  if (priorities.length) {
    lines.push("", "### Interview first");
    lines.push(
      `Start with **${priorities[0]!.candidateName}** (${priorities[0]!.jobTitle}) — ${priorities[0]!.reason}`
    );
  }

  const notes = missingDataNote(results);
  if (notes.length) {
    lines.push("", "### Data coverage notes");
    lines.push(...notes.map((n) => `• ${n}`));
  }

  return lines.join("\n");
}

/** 2. Comparison */
export function formatComparisonWorkflow(
  message: string,
  results: CopilotToolResult[]
): string | null {
  const compare = results.find((r) => r.tool === "compareCandidates");
  const analyses = getAnalyses(results);

  if (
    (!compare || compare.tool !== "compareCandidates" || !compare.comparisonTable?.length) &&
    analyses.length < 2
  ) {
    return [
      "## Recruitment Workflow — Candidate Comparison",
      "",
      "I need at least two candidates with live `ai_resume_analysis` (or a `compareCandidates` result) to compare.",
      ...missingDataNote(results).map((n) => `• ${n}`),
      "",
      "Try: “Compare basitnayab6975 and HR Admin” or “Compare top 2 candidates”.",
    ].join("\n");
  }

  const rows =
    compare && compare.tool === "compareCandidates" && compare.comparisonTable.length
      ? compare.comparisonTable.map((row) => {
          const analysis = analyses.find((a) =>
            (a.candidateName ?? "")
              .toLowerCase()
              .includes(row.candidateName.toLowerCase())
          );
          return {
            name: row.candidateName,
            job: row.jobTitle,
            aiScore: safeScore(row.aiScore),
            skillMatch: safeScore(row.skillMatch),
            experience: analysis?.experience || row.experience || "—",
            education: analysis?.education || row.education || "—",
            experienceScore: safeScore(analysis?.experienceScore),
            educationScore: safeScore(analysis?.educationScore),
            skills: analysis?.skills ?? [],
            missing: analysis?.missingSkills ?? [],
            strengths: analysis?.strengths?.length
              ? analysis.strengths
              : row.strengths ?? [],
            weaknesses: analysis?.weaknesses?.length
              ? analysis.weaknesses
              : row.weaknesses ?? [],
            recommendation: row.recommendation,
            rank: row.rank,
          };
        })
      : analyses.slice(0, 2).map((a) => ({
          name: a.candidateName ?? "Unknown",
          job: a.jobTitle ?? "—",
          aiScore: safeScore(a.overallScore ?? a.score),
          skillMatch: safeScore(a.skillMatch),
          experience: a.experience || "—",
          education: a.education || "—",
          experienceScore: safeScore(a.experienceScore),
          educationScore: safeScore(a.educationScore),
          skills: a.skills ?? [],
          missing: a.missingSkills ?? [],
          strengths: a.strengths ?? [],
          weaknesses: a.weaknesses ?? [],
          recommendation: a.recommendationLabel || a.recommendation || "—",
          rank: a.rank,
        }));

  const better =
    (compare && compare.tool === "compareCandidates" && compare.betterCandidate) ||
    [...rows].sort((a, b) => b.aiScore - a.aiScore)[0]?.name;

  const lines = [
    "## Recruitment Workflow — Side-by-side Comparison",
    "",
    "| Dimension | " + rows.map((r) => r.name).join(" | ") + " |",
    "| --- | " + rows.map(() => "---").join(" | ") + " |",
    `| AI Score | ${rows.map((r) => `${r.aiScore}/100`).join(" | ")} |`,
    `| Skill match | ${rows.map((r) => `${r.skillMatch}/100`).join(" | ")} |`,
    `| Rank | ${rows.map((r) => r.rank ?? "—").join(" | ")} |`,
    `| Experience score | ${rows.map((r) => `${r.experienceScore}/100`).join(" | ")} |`,
    `| Education score | ${rows.map((r) => `${r.educationScore}/100`).join(" | ")} |`,
    `| Recommendation | ${rows.map((r) => r.recommendation).join(" | ")} |`,
    "",
  ];

  for (const r of rows) {
    lines.push(`### ${r.name} (${r.job})`);
    lines.push(`**Skills:** ${r.skills.slice(0, 6).join("; ") || "—"}`);
    lines.push(`**Experience:** ${r.experience}`);
    lines.push(`**Education:** ${r.education}`);
    lines.push(`**Missing skills:** ${r.missing.slice(0, 5).join("; ") || "None flagged"}`);
    lines.push(`**Strengths:** ${r.strengths.slice(0, 4).join("; ") || "—"}`);
    lines.push(`**Weaknesses:** ${r.weaknesses.slice(0, 4).join("; ") || "—"}`);
    lines.push("");
  }

  lines.push("### Verdict");
  lines.push(
    better
      ? `**${better}** is the stronger advance based on live AI score / skill match.`
      : "Insufficient separation between candidates on live scores."
  );
  if (
    compare &&
    compare.tool === "compareCandidates" &&
    compare.differences.length > 0
  ) {
    lines.push(...compare.differences.map((d) => `• ${d}`));
  }

  return lines.join("\n");
}

/** 3. Interview recommendations */
export function formatInterviewDecisionWorkflow(
  message: string,
  results: CopilotToolResult[]
): string | null {
  const analyses = getAnalyses(results);
  const wantReject = /\breject/i.test(message);
  const wantReview = /\banother (interview|review)\b/i.test(message);

  if (!analyses.length) {
    return [
      "## Recruitment Workflow — Interview Recommendations",
      "",
      "No `ai_resume_analysis` rows available to recommend Interview / Reject / Hold.",
      ...missingDataNote(results).map((n) => `• ${n}`),
    ].join("\n");
  }

  let pool = analyses.map((a) => ({
    item: a,
    action: toInterviewAction(a),
  }));

  if (wantReject) pool = pool.filter((p) => p.action === "Reject");
  if (wantReview) pool = pool.filter((p) => p.action === "Needs another review");

  if (!pool.length) {
    pool = analyses.map((a) => ({ item: a, action: toInterviewAction(a) }));
  }

  pool.sort(
    (a, b) =>
      safeScore(b.item.overallScore ?? b.item.score) -
      safeScore(a.item.overallScore ?? a.item.score)
  );

  const lines = [
    "## Recruitment Workflow — Interview Recommendations",
    "",
    "Actions use live analysis only: **Interview** · **Reject** · **Hold** · **Needs another review**.",
    "",
  ];

  for (const row of pool.slice(0, 8)) {
    const name = row.item.candidateName ?? "Unknown";
    const score = safeScore(row.item.overallScore ?? row.item.score);
    lines.push(`### ${name} — ${row.item.jobTitle ?? "role"}`);
    lines.push(`• **Action:** ${row.action}`);
    lines.push(`• **AI score:** ${score}/100`);
    lines.push(`• **Why:** ${explainAction(row.action, row.item)}`);
    if ((row.item.missingSkills ?? []).length) {
      lines.push(
        `• **Gaps to respect:** ${row.item.missingSkills!.slice(0, 4).join("; ")}`
      );
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

/** 4. Pipeline summary */
export function formatPipelineWorkflow(results: CopilotToolResult[]): string | null {
  const stats = getStats(results);
  const apps = getApps(results);
  const rankings = getRankings(results);
  const jobs = results.find((r) => r.tool === "searchJobs");
  const interviews = results.find((r) => r.tool === "searchInterviews");

  if (!stats && !apps.length) {
    return [
      "## Recruitment Workflow — Hiring Pipeline Summary",
      "",
      "Pipeline totals unavailable.",
      "• Missing `getDashboardStats` aggregates and/or `applications` rows.",
      ...missingDataNote(results).map((n) => `• ${n}`),
    ].join("\n");
  }

  const lines = [
    "## Recruitment Workflow — Hiring Pipeline Summary",
    "",
    "### Headline metrics (live Supabase)",
    `• **Total jobs:** ${stats?.totalJobs ?? "—"} (open/published: ${stats?.openJobs ?? "—"})`,
    `• **Total applications:** ${stats?.totalApplications ?? apps.length}`,
    `• **Total interviews:** ${stats?.totalInterviews ?? (interviews && "interviews" in interviews ? interviews.interviews.length : "—")}`,
    `• **Total shortlisted:** ${stats?.totalShortlisted ?? "—"} (\`applications.status = ai_shortlisted\`)`,
    `• **Total hired:** ${stats?.totalHired ?? "—"}`,
    `• **Total rejected:** ${stats?.totalRejected ?? "—"}`,
    `• **In interview stage:** ${stats?.totalInInterview ?? "—"}`,
    `• **Pending / HR review:** ${stats?.totalPendingReview ?? "—"}`,
    `• **Candidate profiles:** ${stats?.totalCandidates ?? "—"}`,
    "",
  ];

  if (jobs && "jobs" in jobs && Array.isArray(jobs.jobs) && jobs.jobs.length) {
    lines.push("### Open roles sample");
    for (const j of jobs.jobs.slice(0, 5)) {
      lines.push(`• ${j.title}${j.department ? ` (${j.department})` : ""} — ${j.status}`);
    }
    lines.push("");
  }

  if (rankings.length) {
    lines.push("### Top AI-ranked applicants right now");
    for (const r of rankings.slice(0, 5)) {
      lines.push(
        `• #${r.rank ?? "—"} **${r.candidateName}** — ${r.jobTitle} (${safeScore(r.score)}/100)`
      );
    }
    lines.push("");
  }

  if (apps.length) {
    const byStatus = new Map<string, number>();
    for (const a of apps) {
      byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
    }
    lines.push("### Recent applications status mix (sample)");
    for (const [status, count] of [...byStatus.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`• ${status}: ${count}`);
    }
  }

  const notes = missingDataNote(results);
  if (notes.length) {
    lines.push("", "### Data coverage notes");
    lines.push(...notes.map((n) => `• ${n}`));
  }

  return lines.join("\n");
}

/** 5. HR insights */
export function formatInsightsWorkflow(results: CopilotToolResult[]): string | null {
  const analyses = getAnalyses(results);
  const rankings = getRankings(results);
  const gaps = getGaps(results);
  const alerts = getAlerts(results);

  if (!analyses.length && !rankings.length && !gaps.length) {
    return [
      "## Recruitment Workflow — HR Insights",
      "",
      "Not enough live AI data for insights.",
      ...missingDataNote(results).map((n) => `• ${n}`),
    ].join("\n");
  }

  const skillFreq = new Map<string, number>();
  for (const g of gaps) {
    for (const skill of g.missingSkills ?? []) {
      const key = skill.trim();
      if (!key) continue;
      skillFreq.set(key, (skillFreq.get(key) ?? 0) + 1);
    }
  }
  for (const a of analyses) {
    for (const skill of a.missingSkills ?? []) {
      const key = skill.trim();
      if (!key) continue;
      skillFreq.set(key, (skillFreq.get(key) ?? 0) + 1);
    }
  }
  const commonMissing = [...skillFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const strongest = [...analyses].sort(
    (a, b) =>
      safeScore(b.overallScore ?? b.score) - safeScore(a.overallScore ?? a.score)
  );
  const weakest = [...analyses].sort(
    (a, b) =>
      safeScore(a.overallScore ?? a.score) - safeScore(b.overallScore ?? b.score)
  );

  const needingAttention = analyses.filter((a) => {
    const score = safeScore(a.overallScore ?? a.score);
    return (
      score >= 55 &&
      score < 75 &&
      ((a.missingSkills?.length ?? 0) >= 2 || (a.weaknesses?.length ?? 0) >= 2)
    );
  });

  const lines = [
    "## Recruitment Workflow — HR Insights",
    "",
    "### Biggest / most common missing skills",
  ];
  if (commonMissing.length) {
    lines.push(
      ...commonMissing.map(
        ([skill, count]) => `• **${skill}** — flagged for ${count} candidate(s)`
      )
    );
  } else {
    lines.push("• No missing-skill frequency could be computed from live analysis rows.");
  }

  lines.push("", "### Strongest candidates");
  if (strongest.length) {
    for (const c of strongest.slice(0, 3)) {
      lines.push(
        `• **${c.candidateName}** — ${c.jobTitle} (${safeScore(c.overallScore ?? c.score)}/100)`
      );
      if (c.strengths?.length) {
        lines.push(...bullets(c.strengths, 2));
      }
    }
  } else if (rankings.length) {
    for (const r of rankings.slice(0, 3)) {
      lines.push(
        `• **${r.candidateName}** — ${r.jobTitle} (${safeScore(r.score)}/100)`
      );
    }
  } else {
    lines.push("• No `ai_resume_analysis` / ranking rows available.");
  }

  lines.push("", "### Weakest candidates");
  if (weakest.length) {
    for (const c of weakest.slice(0, 3)) {
      lines.push(
        `• **${c.candidateName}** — ${c.jobTitle} (${safeScore(c.overallScore ?? c.score)}/100)`
      );
      if (c.missingSkills?.length) {
        lines.push(`  Gaps: ${c.missingSkills.slice(0, 3).join("; ")}`);
      }
    }
  } else {
    lines.push("• No low-score analysis rows available.");
  }

  lines.push("", "### Candidates needing attention");
  if (needingAttention.length) {
    for (const c of needingAttention.slice(0, 5)) {
      lines.push(
        `• **${c.candidateName}** (${safeScore(c.overallScore ?? c.score)}/100) — mixed signal; re-review before interview/reject.`
      );
    }
  } else {
    lines.push(
      "• No mid-score “attention” band candidates in the current analysis sample."
    );
  }

  if (alerts.length) {
    lines.push("", "### Smart alerts");
    for (const alert of alerts.slice(0, 5)) {
      lines.push(
        `• ${alert.title || "Alert"}${alert.message ? ` — ${alert.message}` : ""}`
      );
    }
  }

  return lines.join("\n");
}

/**
 * Route a workflow question to the correct formatter.
 */
export function formatWorkflowAgentReport(
  message: string,
  results: CopilotToolResult[]
): string | null {
  if (!isWorkflowAgentQuestion(message) && !detectWorkflowKind(message)) {
    return null;
  }

  const kind = detectWorkflowKind(message);
  switch (kind) {
    case "compare":
      return formatComparisonWorkflow(message, results);
    case "pipeline":
      return formatPipelineWorkflow(results);
    case "insights":
      return formatInsightsWorkflow(results);
    case "interview_decision":
      return formatInterviewDecisionWorkflow(message, results);
    case "shortlist":
      return formatShortlistWorkflow(message, results);
    default:
      return (
        formatShortlistWorkflow(message, results) ??
        formatPipelineWorkflow(results) ??
        formatInsightsWorkflow(results)
      );
  }
}
