import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { normalizeResumeAnalysis } from "@/lib/ai/types";
import { sanitizeSearchTerm } from "@/lib/hr/search/constants";
import { logCopilotDebug } from "@/lib/ai/copilot-debug";

type AnySupabase = SupabaseClient;

async function getSupabase(client?: AnySupabase): Promise<AnySupabase> {
  if (client) return client;
  return (await createClient()) as unknown as AnySupabase;
}

function clampLimit(n: number | undefined, fallback = 10, max = 20): number {
  if (!n || !Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(n)));
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export type ComparisonRow = {
  candidateName: string;
  candidateId: string;
  jobTitle: string;
  aiScore: number;
  experience: string;
  education: string;
  skillMatch: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  rank: number | null;
  profilePath: string;
};

export type HiringDecision = "Hire" | "Maybe" | "Reject";

export type StructuredHireLabel =
  | "Strong Hire"
  | "Hire with Reservations"
  | "Do Not Hire";

export type HiringRecommendationResult = {
  tool: "getHiringRecommendation";
  count: number;
  decision: HiringDecision | null;
  /** UI label for the structured report */
  recommendationLabel: StructuredHireLabel | null;
  candidateName: string | null;
  jobTitle: string | null;
  aiScore: number | null;
  skillMatch: number | null;
  overallMatch: number | null;
  recommendation: string | null;
  ranking: { rank: number | null; reason: string | null } | null;
  strengths: string[];
  weaknesses: string[];
  candidateSkills: string[];
  missingSkills: string[];
  jobRequirements: string[];
  riskLevel: "Low" | "Medium" | "High" | null;
  risks: string[];
  interviewFocus: string[];
  reasons: string[];
  reasoning: string[];
  finalVerdict: string | null;
  /** Deterministic markdown report — prefer this over free-form generation */
  formattedReport: string | null;
  unavailable: string[];
  evidence: ComparisonRow | null;
};

export type SkillGapResult = {
  tool: "analyzeSkillGaps";
  count: number;
  mode: "missing" | "knows" | "lacks" | "weak";
  skill: string | null;
  candidates: Array<{
    candidateName: string;
    jobTitle: string;
    aiScore: number;
    missingSkills: string[];
    skills: string[];
    weaknesses: string[];
    profilePath: string;
  }>;
};

export type InterviewPriorityResult = {
  tool: "getInterviewPriority";
  count: number;
  priorities: Array<{
    priority: number;
    candidateName: string;
    jobTitle: string;
    aiScore: number;
    recommendation: string;
    reason: string;
    profilePath: string;
  }>;
};

export type SalaryRecommendationResult = {
  tool: "getSalaryRecommendation";
  count: number;
  recommendations: Array<{
    candidateName: string;
    jobTitle: string;
    experienceYears: number | null;
    expectedSalary: number | null;
    low: number | null;
    recommended: number | null;
    maximum: number | null;
    currencyNote: string;
    basis: string[];
    profilePath: string;
  }>;
};

export type RiskAnalysisResult = {
  tool: "analyzeHiringRisks";
  count: number;
  assessments: Array<{
    candidateName: string;
    jobTitle: string;
    riskLevel: "Low" | "Medium" | "High";
    risks: string[];
    aiScore: number | null;
    confidence: number | null;
    profilePath: string;
  }>;
};

export type ExplainDecisionResult = {
  tool: "explainAIDecision";
  count: number;
  explanations: Array<{
    candidateName: string;
    jobTitle: string;
    rank: number | null;
    aiScore: number;
    recommendation: string;
    rankingReason: string | null;
    scoreBreakdown: {
      overallScore: number;
      technicalScore: number;
      experienceScore: number;
      educationScore: number;
      communicationScore: number;
      skillMatch: number;
      confidence: number;
    };
    strengths: string[];
    weaknesses: string[];
    missingSkills: string[];
    summary: string;
    profilePath: string;
  }>;
};

export type DecisionReportResult = {
  tool: "generateDecisionReport";
  count: number;
  reports: Array<{
    candidateSummary: string;
    candidateName: string;
    jobTitle: string;
    strengths: string[];
    weaknesses: string[];
    aiScore: number;
    skillMatch: number;
    interviewRecommendation: string;
    riskLevel: "Low" | "Medium" | "High";
    risks: string[];
    finalRecommendation: HiringDecision;
    recommendationLabel: string;
    profilePath: string;
  }>;
};

export type CompareDecisionResult = {
  tool: "compareCandidates";
  count: number;
  comparisonTable: ComparisonRow[];
  differences: string[];
  betterCandidate: string | null;
};

type AnalysisBundle = {
  candidateId: string;
  candidateName: string;
  applicationId: string | null;
  jobTitle: string;
  analysis: ReturnType<typeof normalizeResumeAnalysis>;
  rank: number | null;
  rankingReason: string | null;
  yearsOfExperience: number | null;
  expectedSalary: number | null;
  noticePeriod: string | null;
  currentPosition: string | null;
  profileSkills: string[];
  applicationStatus: string | null;
  hasResume: boolean;
  profileCompletionHints: string[];
};

async function loadAnalysisBundles(
  supabase: AnySupabase,
  opts: {
    names?: string[];
    jobQuery?: string;
    topN?: number;
    orderAscending?: boolean;
  } = {}
): Promise<AnalysisBundle[]> {
  const topN = clampLimit(opts.topN, 10, 30);

  const { data, error } = await supabase
    .from("ai_resume_analysis")
    .select(
      `
      candidate_id,
      application_id,
      job_title,
      score,
      recommendation,
      analysis_json,
      candidate_profiles ( full_name )
    `
    )
    .order("score", { ascending: Boolean(opts.orderAscending) })
    .limit(topN * 3);

  logCopilotDebug("Database Queries", {
    tool: "hiring-decision-load",
    table: "ai_resume_analysis",
    rows: data?.length ?? 0,
    error: error?.message ?? null,
  });

  if (error) {
    throw new Error(`[hiring-decision] analysis query failed: ${error.message}`);
  }

  type Row = {
    candidate_id: string;
    application_id: string | null;
    job_title: string;
    analysis_json: unknown;
    candidate_profiles: { full_name: string } | { full_name: string }[] | null;
  };

  const names = (opts.names ?? []).map((n) => n.toLowerCase());
  const jobQuery = opts.jobQuery?.trim().toLowerCase();

  let rows = (data ?? []) as Row[];
  if (names.length > 0) {
    rows = rows.filter((row) => {
      const profile = Array.isArray(row.candidate_profiles)
        ? row.candidate_profiles[0]
        : row.candidate_profiles;
      const name = (profile?.full_name ?? "").toLowerCase();
      return names.some((n) => name.includes(n));
    });
  }
  if (jobQuery) {
    rows = rows.filter((row) => row.job_title.toLowerCase().includes(jobQuery));
  }

  rows = rows.slice(0, topN);
  if (rows.length === 0) return [];

  const candidateIds = [...new Set(rows.map((r) => r.candidate_id))];
  const applicationIds = rows
    .map((r) => r.application_id)
    .filter((id): id is string => typeof id === "string");

  const [rankingRes, appRes, resumeRes, detailsRes] = await Promise.all([
    supabase
      .from("ai_candidate_ranking")
      .select("candidate_id, rank, reason, score, jobs ( title )")
      .in("candidate_id", candidateIds),
    applicationIds.length > 0
      ? supabase
          .from("applications")
          .select(
            "id, candidate_id, years_of_experience, expected_salary, notice_period, current_position, status, full_name"
          )
          .in("id", applicationIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("candidate_resumes").select("candidate_id").in("candidate_id", candidateIds),
    supabase
      .from("candidate_profile_details")
      .select("candidate_id, years_of_experience, current_job_title, phone, city, skills")
      .in("candidate_id", candidateIds),
  ]);

  logCopilotDebug("Database Queries", {
    tool: "hiring-decision-enrich",
    rankingRows: rankingRes.data?.length ?? 0,
    applicationRows: appRes.data?.length ?? 0,
    resumeRows: resumeRes.data?.length ?? 0,
  });

  const rankByCandidate = new Map<string, { rank: number; reason: string }>();
  for (const r of rankingRes.data ?? []) {
    const typed = r as { candidate_id: string; rank: number; reason: string };
    const existing = rankByCandidate.get(typed.candidate_id);
    if (!existing || typed.rank < existing.rank) {
      rankByCandidate.set(typed.candidate_id, { rank: typed.rank, reason: typed.reason });
    }
  }

  const appById = new Map<string, Record<string, unknown>>();
  for (const a of appRes.data ?? []) {
    const typed = a as { id: string };
    appById.set(typed.id, a as Record<string, unknown>);
  }

  const resumeSet = new Set(
    (resumeRes.data ?? []).map((r) => (r as { candidate_id: string }).candidate_id)
  );

  const detailsById = new Map<string, Record<string, unknown>>();
  for (const d of detailsRes.data ?? []) {
    const typed = d as { candidate_id: string };
    detailsById.set(typed.candidate_id, d as Record<string, unknown>);
  }

  return rows.map((row) => {
    const profile = Array.isArray(row.candidate_profiles)
      ? row.candidate_profiles[0]
      : row.candidate_profiles;
    const analysis = normalizeResumeAnalysis(row.analysis_json);
    const app = row.application_id ? appById.get(row.application_id) : undefined;
    const details = detailsById.get(row.candidate_id);
    const ranking = rankByCandidate.get(row.candidate_id);

    const years =
      toNumber(app?.years_of_experience) ?? toNumber(details?.years_of_experience);
    const hints: string[] = [];
    if (!details?.phone) hints.push("Missing phone on profile");
    if (!details?.city) hints.push("Missing city on profile");
    if (!resumeSet.has(row.candidate_id)) hints.push("No resume on file");

    return {
      candidateId: row.candidate_id,
      candidateName: profile?.full_name ?? "Unknown candidate",
      applicationId: row.application_id,
      jobTitle: row.job_title,
      analysis,
      rank: ranking?.rank ?? null,
      rankingReason: ranking?.reason ?? null,
      yearsOfExperience: years,
      expectedSalary: toNumber(app?.expected_salary),
      noticePeriod: typeof app?.notice_period === "string" ? app.notice_period : null,
      currentPosition:
        typeof app?.current_position === "string"
          ? app.current_position
          : typeof details?.current_job_title === "string"
            ? details.current_job_title
            : null,
      profileSkills: Array.isArray(details?.skills)
        ? (details.skills as unknown[])
            .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
            .map((s) => s.trim())
        : [],
      applicationStatus: typeof app?.status === "string" ? app.status : null,
      hasResume: resumeSet.has(row.candidate_id),
      profileCompletionHints: hints,
    };
  });
}

function toComparisonRow(bundle: AnalysisBundle): ComparisonRow {
  return {
    candidateName: bundle.candidateName,
    candidateId: bundle.candidateId,
    jobTitle: bundle.jobTitle,
    aiScore: bundle.analysis.overallScore,
    experience: bundle.analysis.experience,
    education: bundle.analysis.education,
    skillMatch: bundle.analysis.skillMatch,
    strengths: bundle.analysis.strengths,
    weaknesses: bundle.analysis.weaknesses,
    recommendation: bundle.analysis.recommendationLabel || bundle.analysis.recommendation,
    rank: bundle.rank,
    profilePath: `/hr/candidates/${bundle.candidateId}`,
  };
}

function decisionFromAnalysis(analysis: ReturnType<typeof normalizeResumeAnalysis>): HiringDecision {
  const label = (analysis.recommendationLabel || analysis.recommendation).toLowerCase();
  if (
    label.includes("strong hire") ||
    label.includes("highly recommended") ||
    analysis.overallScore >= 85
  ) {
    return "Hire";
  }
  if (
    label.includes("no hire") ||
    label.includes("not recommended") ||
    label.includes("reject") ||
    analysis.overallScore < 55
  ) {
    return "Reject";
  }
  return "Maybe";
}

function computeRisks(bundle: AnalysisBundle): {
  riskLevel: "Low" | "Medium" | "High";
  risks: string[];
} {
  const risks: string[] = [];
  const analysis = bundle.analysis;

  if (analysis.missingSkills.length >= 3) {
    risks.push(`Missing skills: ${analysis.missingSkills.slice(0, 5).join(", ")}`);
  } else if (analysis.missingSkills.length > 0) {
    risks.push(`Missing skills: ${analysis.missingSkills.join(", ")}`);
  }

  if ((bundle.yearsOfExperience ?? 99) < 2) {
    risks.push("Low experience (under 2 years)");
  }

  if (analysis.confidence < 60) {
    risks.push(`Low AI confidence (${analysis.confidence}/100)`);
  }

  if (!bundle.hasResume) {
    risks.push("Weak/incomplete resume file");
  }

  if (bundle.profileCompletionHints.length > 0) {
    risks.push(`Incomplete profile: ${bundle.profileCompletionHints.join("; ")}`);
  }

  if (bundle.noticePeriod === "3_months_plus" || bundle.noticePeriod === "2_months") {
    risks.push(`Long notice period (${bundle.noticePeriod.replace(/_/g, " ")})`);
  }

  // Heuristic job-hopping signal from experience text
  const exp = analysis.experience.toLowerCase();
  if (
    /\b(job hop|frequent changes|many short|short tenures|changed jobs? often)\b/.test(exp) ||
    /\b(\d+)\s*months?\b/.test(exp) && /\b(multiple|several|many)\b/.test(exp)
  ) {
    risks.push("Possible job hopping pattern in experience summary");
  }

  if (analysis.overallScore < 50) {
    risks.push("Low overall AI score");
  }

  let riskLevel: "Low" | "Medium" | "High" = "Low";
  if (risks.length >= 4 || analysis.overallScore < 50) riskLevel = "High";
  else if (risks.length >= 2 || analysis.overallScore < 70) riskLevel = "Medium";

  return { riskLevel, risks };
}

function salaryBand(bundle: AnalysisBundle): {
  low: number | null;
  recommended: number | null;
  maximum: number | null;
  basis: string[];
} {
  const years = bundle.yearsOfExperience ?? 0;
  const skillMatch = bundle.analysis.skillMatch;
  const score = bundle.analysis.overallScore;
  const expected = bundle.expectedSalary;

  // Baseline bands from experience level (generic market heuristic, not invented per-person facts)
  let base = 40000;
  let level = "junior";
  if (years >= 8 || score >= 90) {
    base = 110000;
    level = "senior";
  } else if (years >= 4 || score >= 75) {
    base = 75000;
    level = "mid";
  } else if (years >= 2) {
    base = 55000;
    level = "mid-junior";
  }

  const skillFactor = 0.9 + (skillMatch / 100) * 0.25;
  const scoreFactor = 0.9 + (score / 100) * 0.2;
  const recommended = Math.round(base * skillFactor * scoreFactor);

  // Anchor around expected salary when present (live application data)
  let anchored = recommended;
  if (expected != null && expected > 0) {
    anchored = Math.round(expected * 0.95 + recommended * 0.05);
  }

  const low = Math.round(anchored * 0.88);
  const maximum = Math.round(anchored * 1.15);

  return {
    low,
    recommended: anchored,
    maximum,
    basis: [
      `Job level inferred as ${level}`,
      `Years of experience: ${years || "unknown"}`,
      `Skill match: ${skillMatch}/100`,
      `AI overall score: ${score}/100`,
      expected != null ? `Candidate expected salary: ${expected}` : "No expected salary on application",
    ],
  };
}

/** 1. Candidate comparison table */
export async function compareCandidatesDecision(
  params: { names?: string[]; topN?: number; jobQuery?: string } = {},
  client?: AnySupabase
): Promise<CompareDecisionResult> {
  const supabase = await getSupabase(client);
  let names = (params.names ?? []).map((n) => n.trim()).filter(Boolean);

  // "Compare top 2" — no names provided
  if (names.length === 0) {
    const top = await loadAnalysisBundles(supabase, {
      topN: params.topN ?? 2,
      jobQuery: params.jobQuery,
    });
    const table = top.map(toComparisonRow);
    const differences = buildDifferences(table);
    return {
      tool: "compareCandidates",
      count: table.length,
      comparisonTable: table,
      differences,
      betterCandidate: table[0]?.candidateName ?? null,
    };
  }

  const bundles = await loadAnalysisBundles(supabase, {
    names,
    topN: Math.max(names.length * 2, 4),
    jobQuery: params.jobQuery,
  });

  // Keep first match per requested name order
  const ordered: AnalysisBundle[] = [];
  for (const name of names) {
    const hit = bundles.find((b) =>
      b.candidateName.toLowerCase().includes(name.toLowerCase())
    );
    if (hit && !ordered.some((o) => o.candidateId === hit.candidateId)) {
      ordered.push(hit);
    }
  }

  const table = ordered.map(toComparisonRow);
  return {
    tool: "compareCandidates",
    count: table.length,
    comparisonTable: table,
    differences: buildDifferences(table),
    betterCandidate: pickBetter(table),
  };
}

function buildDifferences(table: ComparisonRow[]): string[] {
  if (table.length < 2) return [];
  const [a, b] = table;
  const diffs: string[] = [];
  diffs.push(
    `AI Score: ${a.candidateName} ${a.aiScore} vs ${b.candidateName} ${b.aiScore}`
  );
  diffs.push(
    `Skill Match: ${a.candidateName} ${a.skillMatch} vs ${b.candidateName} ${b.skillMatch}`
  );
  diffs.push(
    `Recommendation: ${a.candidateName} (${a.recommendation}) vs ${b.candidateName} (${b.recommendation})`
  );
  return diffs;
}

function pickBetter(table: ComparisonRow[]): string | null {
  if (table.length === 0) return null;
  return [...table].sort((x, y) => y.aiScore - x.aiScore || y.skillMatch - x.skillMatch)[0]
    ?.candidateName;
}

function toStructuredHireLabel(
  decision: HiringDecision,
  analysis: ReturnType<typeof normalizeResumeAnalysis>
): StructuredHireLabel {
  const label = (analysis.recommendationLabel || analysis.recommendation).toLowerCase();
  if (
    decision === "Hire" &&
    (label.includes("strong") || label.includes("highly") || analysis.overallScore >= 85) &&
    analysis.missingSkills.length <= 1
  ) {
    return "Strong Hire";
  }
  if (decision === "Reject") return "Do Not Hire";
  return "Hire with Reservations";
}

function recommendationEmoji(label: StructuredHireLabel): string {
  if (label === "Strong Hire") return "✅";
  if (label === "Do Not Hire") return "❌";
  return "🟡";
}

async function loadJobRequirements(
  supabase: AnySupabase,
  jobTitle: string | null,
  jobQuery?: string
): Promise<{ requirements: string[]; jobTitle: string | null; found: boolean }> {
  const q = sanitizeSearchTerm(jobQuery || jobTitle || "");
  if (!q) return { requirements: [], jobTitle: null, found: false };

  const { data, error } = await supabase
    .from("jobs")
    .select("title, requirements, description")
    .or(`title.ilike.%${q}%,department.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data?.length) {
    return { requirements: [], jobTitle: null, found: false };
  }

  type JobRow = { title: string; requirements: string | null; description: string | null };
  const rows = data as JobRow[];
  const exact =
    rows.find((j) => j.title.toLowerCase() === q.toLowerCase()) ??
    rows.find((j) => j.title.toLowerCase().includes(q.toLowerCase())) ??
    rows[0]!;

  const reqText = (exact.requirements || "").trim();
  const requirements = reqText
    ? reqText
        .split(/\n|•|;|\|/)
        .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
        .filter((s) => s.length > 2)
        .slice(0, 12)
    : [];

  return { requirements, jobTitle: exact.title, found: true };
}

function buildInterviewFocus(missingSkills: string[], weaknesses: string[]): string[] {
  const focus: string[] = [];
  for (const skill of missingSkills.slice(0, 5)) {
    focus.push(
      `Walk me through a recent project where you used ${skill} — what did you own end-to-end?`
    );
  }
  for (const weakness of weaknesses.slice(0, 3)) {
    focus.push(`How have you addressed this in the last 6–12 months: ${weakness}?`);
  }
  if (focus.length === 0) {
    focus.push(
      "Describe a production feature you shipped end-to-end and how you measured success.",
      "How do you debug a failing deployment under time pressure?",
      "What would you own in the first 90 days in this role?"
    );
  }
  return focus;
}

function buildFinalVerdict(input: {
  candidateName: string;
  jobTitle: string | null;
  label: StructuredHireLabel;
  overallMatch: number;
  strengths: string[];
  missingSkills: string[];
  riskLevel: "Low" | "Medium" | "High";
  rank: number | null;
  unavailable: string[];
}): string {
  const role = input.jobTitle ?? "the target role";
  const p1 = `${input.candidateName} is assessed as **${input.label}** for ${role} with an overall match of ${input.overallMatch}%. This verdict is derived only from cached resume analysis${input.rank != null ? `, AI ranking (rank #${input.rank})` : ""}, and available job requirement data.`;

  const strengthText =
    input.strengths.length > 0
      ? `Supporting evidence includes: ${input.strengths.slice(0, 4).join("; ")}.`
      : "The analysis did not list narrative strengths, so lean on the overall score and skill match.";
  const gapText =
    input.missingSkills.length > 0
      ? `Key gaps to validate in interview: ${input.missingSkills.slice(0, 4).join(", ")}.`
      : "No major missing-skill flags were recorded — still validate depth in interview.";
  const p2 = `${strengthText} ${gapText} Risk level from available signals is **${input.riskLevel}**.`;

  const p3 =
    input.unavailable.length > 0
      ? `Some secondary inputs were thin (${input.unavailable.join("; ")}), but the recommendation above is still based on the resume analysis that exists. Re-run AI evaluation only if you need fresher evidence.`
      : input.label === "Strong Hire"
        ? `Proceed to a focused technical interview, then an offer discussion if interview performance confirms the strengths above.`
        : input.label === "Do Not Hire"
          ? `Do not advance this candidate unless new evidence changes the resume analysis or ranking data.`
          : `Move forward only with reservations: use the interview focus questions to validate gaps before any offer.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}

function formatHiringRecommendationReport(input: {
  label: StructuredHireLabel;
  overallMatch: number | null;
  reasons: string[];
  missingSkills: string[];
  riskLevel: "Low" | "Medium" | "High" | null;
  interviewFocus: string[];
  finalVerdict: string;
  unavailable: string[];
  candidateName: string | null;
  jobTitle: string | null;
}): string {
  const lines: string[] = [];
  lines.push("## Hiring Recommendation");
  if (input.candidateName) lines.push(`**Candidate:** ${input.candidateName}`);
  if (input.jobTitle) lines.push(`**Role:** ${input.jobTitle}`);
  lines.push("");
  lines.push("### Recommendation");
  lines.push(`${recommendationEmoji(input.label)} ${input.label}`);
  lines.push("");
  lines.push("### Overall Match");
  lines.push(
    input.overallMatch != null
      ? `${input.overallMatch}%`
      : "Not scored yet — use qualitative signals below"
  );
  lines.push("");
  lines.push("### Reasons");
  if (input.reasons.length === 0) {
    lines.push("• Resume analysis did not provide separate reason bullets; rely on score and recommendation.");
  } else {
    for (const r of input.reasons) lines.push(`• ${r}`);
  }
  lines.push("");
  lines.push("### Missing Skills");
  if (input.missingSkills.length === 0) {
    lines.push("• No major missing-skill flags in the current analysis");
  } else {
    for (const s of input.missingSkills) lines.push(`• ${s}`);
  }
  lines.push("");
  lines.push("### Risk Assessment");
  lines.push(input.riskLevel ?? "Not enough risk signals to grade — treat as Medium until interviewed");
  lines.push("");
  lines.push("### Interview Focus");
  for (const q of input.interviewFocus) lines.push(`• ${q}`);
  lines.push("");
  lines.push("### Final Verdict");
  lines.push(input.finalVerdict);
  if (input.unavailable.length > 0) {
    lines.push("");
    lines.push("### Notes on thin inputs");
    for (const u of input.unavailable) lines.push(`• ${u}`);
  }
  return lines.join("\n");
}

/** 2. Structured hiring recommendation (evidence from Supabase only). */
export async function getHiringRecommendation(
  params: { candidateQuery?: string; jobQuery?: string } = {},
  client?: AnySupabase
): Promise<HiringRecommendationResult> {
  const supabase = await getSupabase(client);
  const query = sanitizeSearchTerm(params.candidateQuery ?? "");
  const bundles = await loadAnalysisBundles(supabase, {
    names: query ? [query] : undefined,
    jobQuery: params.jobQuery,
    topN: query ? 5 : 1,
  });

  const empty = (): HiringRecommendationResult => ({
    tool: "getHiringRecommendation",
    count: 0,
    decision: null,
    recommendationLabel: null,
    candidateName: null,
    jobTitle: null,
    aiScore: null,
    skillMatch: null,
    overallMatch: null,
    recommendation: null,
    ranking: null,
    strengths: [],
    weaknesses: [],
    candidateSkills: [],
    missingSkills: [],
    jobRequirements: [],
    riskLevel: null,
    risks: [],
    interviewFocus: [],
    reasons: [],
    reasoning: [],
    finalVerdict: null,
    formattedReport: null,
    unavailable: [
      "Resume analysis",
      "AI ranking",
      "Job requirements",
      "Candidate skills",
      "Missing skills",
      "Strengths",
      "Weaknesses",
    ],
    evidence: null,
  });

  const bundle = bundles[0];
  if (!bundle) {
    const report = formatHiringRecommendationReport({
      label: "Do Not Hire",
      overallMatch: null,
      reasons: [],
      missingSkills: [],
      riskLevel: null,
      interviewFocus: [
        "Unavailable — no resume analysis rows were found for this candidate/role.",
      ],
      finalVerdict:
        "No hiring recommendation can be produced because resume analysis data was unavailable in Supabase. Run AI resume evaluation for this application first.",
      unavailable: [
        "Resume analysis",
        "AI ranking",
        "Job requirements",
        "Candidate skills",
        "Missing skills",
        "Strengths",
        "Weaknesses",
      ],
      candidateName: query || null,
      jobTitle: params.jobQuery ?? null,
    });
    return { ...empty(), formattedReport: report };
  }

  const unavailable: string[] = [];
  const decision = decisionFromAnalysis(bundle.analysis);
  const recommendationLabel = toStructuredHireLabel(decision, bundle.analysis);
  const { riskLevel, risks } = computeRisks(bundle);

  const jobInfo = await loadJobRequirements(
    supabase,
    bundle.jobTitle,
    params.jobQuery
  );
  if (!jobInfo.found) unavailable.push("Job requirements (no matching job row)");
  if (bundle.rank == null) unavailable.push("AI ranking (no rank row for this candidate)");
  if (bundle.analysis.strengths.length === 0) unavailable.push("Strengths");
  if (bundle.analysis.weaknesses.length === 0) unavailable.push("Weaknesses");
  if (bundle.analysis.missingSkills.length === 0) unavailable.push("Missing skills");
  if (bundle.analysis.skills.length === 0) unavailable.push("Candidate skills");

  const strengths = bundle.analysis.strengths;
  const weaknesses = bundle.analysis.weaknesses;
  const missingSkills = bundle.analysis.missingSkills;
  const candidateSkills = [
    ...new Set([...bundle.profileSkills, ...bundle.analysis.skills]),
  ];
  const overallMatch = Math.round(
    (bundle.analysis.overallScore * 0.6 + bundle.analysis.skillMatch * 0.4)
  );

  const reasons: string[] = [];
  for (const s of strengths.slice(0, 6)) reasons.push(s);
  if (bundle.analysis.skillMatch > 0) {
    reasons.push(`Skill match score: ${bundle.analysis.skillMatch}/100`);
  }
  if (bundle.rank != null) {
    reasons.push(`AI ranking position: #${bundle.rank}${bundle.rankingReason ? ` (${bundle.rankingReason})` : ""}`);
  }
  if (reasons.length === 0 && bundle.analysis.summary) {
    reasons.push(bundle.analysis.summary);
  }

  const interviewFocus = buildInterviewFocus(missingSkills, weaknesses);
  const jobTitle = jobInfo.jobTitle ?? bundle.jobTitle;
  const finalVerdict = buildFinalVerdict({
    candidateName: bundle.candidateName,
    jobTitle,
    label: recommendationLabel,
    overallMatch,
    strengths,
    missingSkills,
    riskLevel,
    rank: bundle.rank,
    unavailable,
  });

  const reasoning: string[] = [
    `Overall AI score: ${bundle.analysis.overallScore}/100`,
    `Skill match: ${bundle.analysis.skillMatch}/100`,
    `Structured recommendation: ${recommendationLabel}`,
    ...reasons.slice(0, 4),
  ];

  const formattedReport = formatHiringRecommendationReport({
    label: recommendationLabel,
    overallMatch,
    reasons,
    missingSkills,
    riskLevel,
    interviewFocus,
    finalVerdict,
    unavailable,
    candidateName: bundle.candidateName,
    jobTitle,
  });

  return {
    tool: "getHiringRecommendation",
    count: 1,
    decision,
    recommendationLabel,
    candidateName: bundle.candidateName,
    jobTitle,
    aiScore: bundle.analysis.overallScore,
    skillMatch: bundle.analysis.skillMatch,
    overallMatch,
    recommendation: bundle.analysis.recommendationLabel || bundle.analysis.recommendation,
    ranking: { rank: bundle.rank, reason: bundle.rankingReason },
    strengths,
    weaknesses,
    candidateSkills,
    missingSkills,
    jobRequirements: jobInfo.requirements,
    riskLevel,
    risks,
    interviewFocus,
    reasons,
    reasoning,
    finalVerdict,
    formattedReport,
    unavailable,
    evidence: toComparisonRow(bundle),
  };
}

/** 4. Skill gap / skill search */
export async function analyzeSkillGaps(
  params: {
    mode?: "missing" | "knows" | "lacks" | "weak";
    skill?: string;
    candidateQuery?: string;
    jobQuery?: string;
    topN?: number;
  } = {},
  client?: AnySupabase
): Promise<SkillGapResult> {
  const supabase = await getSupabase(client);
  const mode = params.mode ?? "missing";
  const skill = sanitizeSearchTerm(params.skill ?? "").toLowerCase();
  const bundles = await loadAnalysisBundles(supabase, {
    names: params.candidateQuery ? [params.candidateQuery] : undefined,
    jobQuery: params.jobQuery,
    topN: clampLimit(params.topN, 20, 40),
  });

  const filtered = bundles.filter((b) => {
    const skills = b.analysis.skills.map((s) => s.toLowerCase());
    const missing = b.analysis.missingSkills.map((s) => s.toLowerCase());
    if (mode === "knows" && skill) {
      return skills.some((s) => s.includes(skill) || skill.includes(s));
    }
    if (mode === "lacks" && skill) {
      return (
        missing.some((s) => s.includes(skill) || skill.includes(s)) ||
        !skills.some((s) => s.includes(skill) || skill.includes(s))
      );
    }
    if (mode === "weak") {
      return b.analysis.weaknesses.length > 0 || b.analysis.overallScore < 65;
    }
    // missing
    return b.analysis.missingSkills.length > 0;
  });

  return {
    tool: "analyzeSkillGaps",
    count: filtered.length,
    mode,
    skill: skill || null,
    candidates: filtered.map((b) => ({
      candidateName: b.candidateName,
      jobTitle: b.jobTitle,
      aiScore: b.analysis.overallScore,
      missingSkills: b.analysis.missingSkills,
      skills: b.analysis.skills,
      weaknesses: b.analysis.weaknesses,
      profilePath: `/hr/candidates/${b.candidateId}`,
    })),
  };
}

/** 5. Interview priority list */
export async function getInterviewPriority(
  params: { jobQuery?: string; topN?: number } = {},
  client?: AnySupabase
): Promise<InterviewPriorityResult> {
  const supabase = await getSupabase(client);
  const bundles = await loadAnalysisBundles(supabase, {
    jobQuery: params.jobQuery,
    topN: clampLimit(params.topN, 10, 20),
  });

  const eligible = bundles
    .filter((b) => {
      const decision = decisionFromAnalysis(b.analysis);
      return decision === "Hire" || decision === "Maybe" || b.analysis.overallScore >= 60;
    })
    .sort(
      (a, b) =>
        b.analysis.overallScore - a.analysis.overallScore ||
        b.analysis.skillMatch - a.analysis.skillMatch
    );

  return {
    tool: "getInterviewPriority",
    count: eligible.length,
    priorities: eligible.map((b, index) => ({
      priority: index + 1,
      candidateName: b.candidateName,
      jobTitle: b.jobTitle,
      aiScore: b.analysis.overallScore,
      recommendation: b.analysis.recommendationLabel || b.analysis.recommendation,
      reason:
        b.rankingReason ||
        `Score ${b.analysis.overallScore}, skill match ${b.analysis.skillMatch}`,
      profilePath: `/hr/candidates/${b.candidateId}`,
    })),
  };
}

/** 6. Salary recommendation */
export async function getSalaryRecommendation(
  params: { candidateQuery?: string; jobQuery?: string; topN?: number } = {},
  client?: AnySupabase
): Promise<SalaryRecommendationResult> {
  const supabase = await getSupabase(client);
  const bundles = await loadAnalysisBundles(supabase, {
    names: params.candidateQuery ? [params.candidateQuery] : undefined,
    jobQuery: params.jobQuery,
    topN: clampLimit(params.topN, 5, 15),
  });

  return {
    tool: "getSalaryRecommendation",
    count: bundles.length,
    recommendations: bundles.map((b) => {
      const band = salaryBand(b);
      return {
        candidateName: b.candidateName,
        jobTitle: b.jobTitle,
        experienceYears: b.yearsOfExperience,
        expectedSalary: b.expectedSalary,
        low: band.low,
        recommended: band.recommended,
        maximum: band.maximum,
        currencyNote: "Figures are advisory bands derived from live profile/application signals.",
        basis: band.basis,
        profilePath: `/hr/candidates/${b.candidateId}`,
      };
    }),
  };
}

/** 7. Risk analysis */
export async function analyzeHiringRisks(
  params: { candidateQuery?: string; jobQuery?: string; topN?: number } = {},
  client?: AnySupabase
): Promise<RiskAnalysisResult> {
  const supabase = await getSupabase(client);
  const bundles = await loadAnalysisBundles(supabase, {
    names: params.candidateQuery ? [params.candidateQuery] : undefined,
    jobQuery: params.jobQuery,
    topN: clampLimit(params.topN, 10, 20),
  });

  return {
    tool: "analyzeHiringRisks",
    count: bundles.length,
    assessments: bundles.map((b) => {
      const { riskLevel, risks } = computeRisks(b);
      return {
        candidateName: b.candidateName,
        jobTitle: b.jobTitle,
        riskLevel,
        risks: risks.length > 0 ? risks : ["No major risks detected from available data"],
        aiScore: b.analysis.overallScore,
        confidence: b.analysis.confidence,
        profilePath: `/hr/candidates/${b.candidateId}`,
      };
    }),
  };
}

/** 8. Explain AI decision */
export async function explainAIDecision(
  params: { candidateQuery?: string; jobQuery?: string; topN?: number } = {},
  client?: AnySupabase
): Promise<ExplainDecisionResult> {
  const supabase = await getSupabase(client);
  const bundles = await loadAnalysisBundles(supabase, {
    names: params.candidateQuery ? [params.candidateQuery] : undefined,
    jobQuery: params.jobQuery,
    topN: clampLimit(params.topN, params.candidateQuery ? 5 : 3, 10),
  });

  // If no specific candidate, explain rank #1
  const selected =
    params.candidateQuery || bundles.length <= 3
      ? bundles
      : bundles.filter((b) => b.rank === 1).concat(bundles).slice(0, 3);

  return {
    tool: "explainAIDecision",
    count: selected.length,
    explanations: selected.map((b) => ({
      candidateName: b.candidateName,
      jobTitle: b.jobTitle,
      rank: b.rank,
      aiScore: b.analysis.overallScore,
      recommendation: b.analysis.recommendationLabel || b.analysis.recommendation,
      rankingReason: b.rankingReason,
      scoreBreakdown: {
        overallScore: b.analysis.overallScore,
        technicalScore: b.analysis.technicalScore,
        experienceScore: b.analysis.experienceScore,
        educationScore: b.analysis.educationScore,
        communicationScore: b.analysis.communicationScore,
        skillMatch: b.analysis.skillMatch,
        confidence: b.analysis.confidence,
      },
      strengths: b.analysis.strengths,
      weaknesses: b.analysis.weaknesses,
      missingSkills: b.analysis.missingSkills,
      summary: b.analysis.summary,
      profilePath: `/hr/candidates/${b.candidateId}`,
    })),
  };
}

/** 10. Full decision report */
export async function generateDecisionReport(
  params: { candidateQuery?: string; jobQuery?: string; topN?: number } = {},
  client?: AnySupabase
): Promise<DecisionReportResult> {
  const supabase = await getSupabase(client);
  const bundles = await loadAnalysisBundles(supabase, {
    names: params.candidateQuery ? [params.candidateQuery] : undefined,
    jobQuery: params.jobQuery,
    topN: clampLimit(params.topN, 3, 10),
  });

  return {
    tool: "generateDecisionReport",
    count: bundles.length,
    reports: bundles.map((b) => {
      const decision = decisionFromAnalysis(b.analysis);
      const { riskLevel, risks } = computeRisks(b);
      const interview =
        decision === "Hire"
          ? "Interview immediately — high priority"
          : decision === "Maybe"
            ? "Schedule interview after shortlist review"
            : "Do not prioritize for interview";

      return {
        candidateSummary:
          b.analysis.summary ||
          `${b.candidateName} evaluated for ${b.jobTitle} with AI score ${b.analysis.overallScore}.`,
        candidateName: b.candidateName,
        jobTitle: b.jobTitle,
        strengths: b.analysis.strengths,
        weaknesses: b.analysis.weaknesses,
        aiScore: b.analysis.overallScore,
        skillMatch: b.analysis.skillMatch,
        interviewRecommendation: interview,
        riskLevel,
        risks,
        finalRecommendation: decision,
        recommendationLabel: b.analysis.recommendationLabel || b.analysis.recommendation,
        profilePath: `/hr/candidates/${b.candidateId}`,
      };
    }),
  };
}

export type HiringDecisionToolResult =
  | CompareDecisionResult
  | HiringRecommendationResult
  | SkillGapResult
  | InterviewPriorityResult
  | SalaryRecommendationResult
  | RiskAnalysisResult
  | ExplainDecisionResult
  | DecisionReportResult;
