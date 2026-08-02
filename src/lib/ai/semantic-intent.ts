/**
 * Semantic intent detection for the HR Copilot.
 *
 * Uses normalized text, tokenization, synonym expansion, weighted keywords,
 * fuzzy token matching, and semantic phrase groups — not exact string equality.
 */

export type CopilotIntent =
  | "candidates"
  | "applications"
  | "jobs"
  | "interviews"
  | "ai_ranking"
  | "resume_analysis"
  | "compare_candidates"
  | "hiring_recommendation"
  | "skill_gap"
  | "interview_priority"
  | "salary_recommendation"
  | "risk_analysis"
  | "ranking_explain"
  | "decision_report"
  | "dashboard_stats"
  | "candidate_profile"
  | "job_match"
  | "hire_advice"
  | "clarify"
  | "unknown";

/** Execute tools when confidence is above this (0–1 scale). */
export const SEMANTIC_INTENT_THRESHOLD = 0.6;

/** Synonym → canonical token. */
const SYNONYM_TO_CANONICAL: Record<string, string> = {
  cv: "resume",
  cvs: "resume",
  curriculum: "resume",
  vitae: "resume",
  resumes: "resume",
  résumés: "resume",
  résumé: "resume",
  applicant: "candidate",
  applicants: "candidate",
  candidate: "candidate",
  candidates: "candidate",
  people: "candidate",
  person: "candidate",
  vacancy: "job",
  vacancies: "job",
  opening: "job",
  openings: "job",
  position: "job",
  positions: "job",
  role: "job",
  roles: "job",
  posting: "job",
  postings: "job",
  jobs: "job",
  job: "job",
  application: "application",
  applications: "application",
  applied: "applied",
  apply: "applied",
  interview: "interview",
  interviews: "interview",
  meeting: "interview",
  meetings: "interview",
  ranking: "ranking",
  rankings: "ranking",
  rank: "ranking",
  ranked: "ranking",
  score: "score",
  scores: "score",
  scored: "score",
  scoring: "score",
  analyze: "analyze",
  analysing: "analyze",
  analyzing: "analyze",
  analysis: "analyze",
  analyse: "analyze",
  review: "review",
  reviewing: "review",
  reviewed: "review",
  evaluate: "evaluate",
  evaluating: "evaluate",
  evaluation: "evaluate",
  feedback: "feedback",
  summarize: "summarize",
  summary: "summarize",
  summarise: "summarize",
  rate: "rate",
  rating: "rate",
  strengths: "strengths",
  strength: "strengths",
  weaknesses: "weaknesses",
  weakness: "weaknesses",
  best: "best",
  top: "top",
  highest: "highest",
  strongest: "strongest",
  first: "first",
  recommend: "recommend",
  recommendation: "recommend",
  hire: "hire",
  hiring: "hire",
  hired: "hire",
  reject: "reject",
  rejection: "reject",
  rejected: "reject",
  suitable: "suitable",
  suitability: "suitable",
  qualified: "qualified",
  qualification: "qualified",
  fit: "fit",
  forward: "forward",
  good: "good",
  upcoming: "upcoming",
  scheduled: "scheduled",
  today: "today",
  todays: "today",
  recent: "recent",
  new: "new",
  open: "open",
  published: "open",
  active: "open",
  current: "current",
  list: "list",
  show: "show",
  display: "show",
  see: "show",
  view: "show",
  get: "show",
  give: "show",
  tell: "tell",
  check: "check",
  missing: "missing",
  lacks: "missing",
  compare: "compare",
  difference: "compare",
  differences: "compare",
  versus: "compare",
  vs: "compare",
  ai: "ai",
  number: "number",
  one: "one",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "this",
  "that",
  "these",
  "those",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "with",
  "from",
  "by",
  "as",
  "at",
  "it",
  "its",
  "me",
  "my",
  "you",
  "your",
  "we",
  "our",
  "can",
  "could",
  "would",
  "should",
  "please",
  "just",
  "about",
  "any",
  "some",
  "do",
  "does",
  "did",
  "how",
  "what",
  "which",
  "who",
  "whom",
  "where",
  "when",
  "i",
]);

export type SemanticPhrase = {
  /** Space-separated normalized phrase (canonical tokens preferred). */
  phrase: string;
  weight: number;
};

export type SemanticKeyword = {
  token: string;
  weight: number;
};

export type SemanticIntentDefinition = {
  intent: CopilotIntent;
  phrases: SemanticPhrase[];
  keywords: SemanticKeyword[];
  /** Optional: require at least one of these canonical tokens. */
  requireAny?: string[];
};

export type SemanticScore = {
  intent: CopilotIntent;
  /** 0–1 confidence */
  confidence: number;
  signals: string[];
};

export function normalizeText(message: string): string {
  return message
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9.+#/\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(normalized: string): string[] {
  if (!normalized) return [];
  return normalized
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

export function canonicalizeToken(token: string): string {
  return SYNONYM_TO_CANONICAL[token] ?? token;
}

export function expandTokens(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (const token of tokens) {
    out.add(token);
    out.add(canonicalizeToken(token));
  }
  return out;
}

/** Classic Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j]!;
  }
  return prev[b.length]!;
}

/**
 * Fuzzy token presence: exact, synonym-canonical, or small edit distance.
 * Returns match strength 0–1.
 */
export function fuzzyTokenScore(needle: string, haystack: Set<string>): number {
  const canonical = canonicalizeToken(needle);
  if (haystack.has(needle) || haystack.has(canonical)) return 1;

  let best = 0;
  for (const token of haystack) {
    const dist = Math.min(
      levenshtein(needle, token),
      levenshtein(canonical, canonicalizeToken(token))
    );
    const maxLen = Math.max(needle.length, token.length, 1);
    if (maxLen <= 3 && dist > 0) continue;
    if (dist === 1 && maxLen >= 4) best = Math.max(best, 0.85);
    if (dist === 2 && maxLen >= 7) best = Math.max(best, 0.7);
  }
  return best;
}

function phrasePresent(normalized: string, phrase: string): boolean {
  const target = normalizeText(phrase);
  if (!target) return false;
  if (normalized.includes(target)) return true;

  // Ordered match keeps stop-words (e.g. "for") so "best candidate" ≠ "best candidate for".
  // Do not synonym-collapse here — "list applicants" must not equal "list candidates".
  const phraseTokens = target.split(" ").filter(Boolean);
  const textTokens = normalized.split(" ").filter(Boolean);
  if (phraseTokens.length === 0) return false;

  let cursor = 0;
  for (const p of phraseTokens) {
    let found = false;
    for (let i = cursor; i < textTokens.length; i += 1) {
      const t = textTokens[i]!;
      const exact = t === p;
      const typo =
        p.length >= 4 && t.length >= 4 && levenshtein(p, t) === 1;
      if (exact || typo) {
        cursor = i + 1;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

/**
 * Core semantic intent catalog — many natural phrasings per intent.
 */
export const SEMANTIC_INTENT_CATALOG: SemanticIntentDefinition[] = [
  {
    intent: "resume_analysis",
    phrases: [
      { phrase: "analyze resume", weight: 1.0 },
      { phrase: "analyse resume", weight: 1.0 },
      { phrase: "resume analysis", weight: 1.0 },
      { phrase: "resume review", weight: 0.95 },
      { phrase: "review resume", weight: 0.95 },
      { phrase: "review cv", weight: 0.95 },
      { phrase: "check cv", weight: 0.9 },
      { phrase: "check resume", weight: 0.9 },
      { phrase: "evaluate resume", weight: 0.95 },
      { phrase: "resume evaluation", weight: 0.95 },
      { phrase: "how good is this resume", weight: 0.95 },
      { phrase: "is this resume good", weight: 0.95 },
      { phrase: "rate this resume", weight: 0.9 },
      { phrase: "rate resume", weight: 0.9 },
      { phrase: "summarize this resume", weight: 0.9 },
      { phrase: "summarize resume", weight: 0.9 },
      { phrase: "give feedback on this resume", weight: 0.95 },
      { phrase: "feedback on this resume", weight: 0.9 },
      { phrase: "tell me about this candidates resume", weight: 0.9 },
      { phrase: "candidate resume", weight: 0.75 },
      { phrase: "candidate analysis", weight: 0.85 },
      { phrase: "analysis report", weight: 0.8 },
      { phrase: "what are this candidates strengths", weight: 0.9 },
      { phrase: "candidate strengths", weight: 0.9 },
      { phrase: "what are the weaknesses", weight: 0.85 },
      { phrase: "candidate weaknesses", weight: 0.9 },
      { phrase: "show strengths", weight: 0.8 },
      { phrase: "show weaknesses", weight: 0.8 },
      { phrase: "missing skills", weight: 0.85 },
      { phrase: "show missing skills", weight: 0.9 },
      { phrase: "missing skills from the resume", weight: 0.95 },
      { phrase: "resume score", weight: 0.85 },
      { phrase: "resume recommendation", weight: 0.8 },
      { phrase: "recommendation", weight: 0.8 },
      { phrase: "ai recommendation", weight: 0.85 },
    ],
    keywords: [
      { token: "resume", weight: 0.35 },
      { token: "analyze", weight: 0.25 },
      { token: "review", weight: 0.2 },
      { token: "evaluate", weight: 0.2 },
      { token: "feedback", weight: 0.2 },
      { token: "summarize", weight: 0.15 },
      { token: "rate", weight: 0.15 },
      { token: "strengths", weight: 0.25 },
      { token: "weaknesses", weight: 0.25 },
      { token: "recommend", weight: 0.2 },
      { token: "good", weight: 0.1 },
    ],
    requireAny: [
      "resume",
      "analyze",
      "review",
      "evaluate",
      "strengths",
      "weaknesses",
      "feedback",
      "summarize",
      "rate",
      "recommend",
    ],
  },
  {
    intent: "ai_ranking",
    phrases: [
      { phrase: "highest ai score", weight: 1.0 },
      { phrase: "who has highest ai score", weight: 1.0 },
      { phrase: "who scored highest", weight: 0.95 },
      { phrase: "best candidate", weight: 0.9 },
      { phrase: "top candidate", weight: 0.9 },
      { phrase: "top candidates", weight: 0.9 },
      { phrase: "who ranked first", weight: 0.95 },
      { phrase: "who is number one", weight: 0.9 },
      { phrase: "number one", weight: 0.8 },
      { phrase: "show ranking", weight: 0.95 },
      { phrase: "show ai ranking", weight: 1.0 },
      { phrase: "ai ranking", weight: 1.0 },
      { phrase: "candidate ranking", weight: 0.95 },
      { phrase: "top ranked applicants", weight: 0.95 },
      { phrase: "best applicants", weight: 0.85 },
      { phrase: "top ai candidates", weight: 0.95 },
      { phrase: "who is strongest", weight: 0.9 },
      { phrase: "recommend the best candidate", weight: 0.9 },
      { phrase: "ai score", weight: 0.85 },
      { phrase: "ranking", weight: 0.75 },
    ],
    keywords: [
      { token: "ranking", weight: 0.35 },
      { token: "score", weight: 0.25 },
      { token: "best", weight: 0.2 },
      { token: "top", weight: 0.2 },
      { token: "highest", weight: 0.25 },
      { token: "strongest", weight: 0.25 },
      { token: "ai", weight: 0.15 },
      { token: "first", weight: 0.15 },
      { token: "recommend", weight: 0.1 },
    ],
    requireAny: ["ranking", "score", "best", "top", "highest", "strongest", "first", "ai"],
  },
  {
    intent: "applications",
    phrases: [
      { phrase: "applications", weight: 0.95 },
      { phrase: "application", weight: 0.9 },
      { phrase: "show applications", weight: 1.0 },
      { phrase: "application list", weight: 1.0 },
      { phrase: "applications list", weight: 1.0 },
      { phrase: "list applications", weight: 1.0 },
      { phrase: "recent applications", weight: 0.95 },
      { phrase: "new applications", weight: 0.95 },
      { phrase: "who applied", weight: 0.95 },
      { phrase: "list applicants", weight: 1.0 },
      { phrase: "candidates who applied", weight: 0.95 },
      { phrase: "pending applications", weight: 0.9 },
      { phrase: "rejected applications", weight: 0.9 },
    ],
    keywords: [
      { token: "application", weight: 0.4 },
      { token: "applied", weight: 0.35 },
      { token: "recent", weight: 0.1 },
      { token: "new", weight: 0.1 },
    ],
    requireAny: ["application", "applied"],
  },
  {
    intent: "candidates",
    phrases: [
      { phrase: "candidate list", weight: 1.0 },
      { phrase: "show candidates", weight: 1.0 },
      { phrase: "list candidates", weight: 1.0 },
      { phrase: "who are the candidates", weight: 0.95 },
      { phrase: "all applicants", weight: 0.9 },
      { phrase: "applicant list", weight: 0.9 },
      { phrase: "all candidates", weight: 0.95 },
      { phrase: "show applicants", weight: 0.85 },
    ],
    keywords: [
      { token: "candidate", weight: 0.4 },
      { token: "list", weight: 0.1 },
      { token: "show", weight: 0.1 },
    ],
    requireAny: ["candidate"],
  },
  {
    intent: "jobs",
    phrases: [
      { phrase: "jobs", weight: 0.95 },
      { phrase: "job", weight: 0.9 },
      { phrase: "show jobs", weight: 1.0 },
      { phrase: "open jobs", weight: 0.95 },
      { phrase: "job list", weight: 1.0 },
      { phrase: "jobs list", weight: 1.0 },
      { phrase: "developer jobs", weight: 0.95 },
      { phrase: "current openings", weight: 0.95 },
      { phrase: "vacancies", weight: 0.9 },
      { phrase: "positions", weight: 0.85 },
      { phrase: "published jobs", weight: 0.9 },
      { phrase: "active jobs", weight: 0.85 },
    ],
    keywords: [
      { token: "job", weight: 0.4 },
      { token: "open", weight: 0.15 },
      { token: "current", weight: 0.1 },
      { token: "developer", weight: 0.15 },
    ],
    requireAny: ["job"],
  },
  {
    intent: "interviews",
    phrases: [
      { phrase: "interview list", weight: 1.0 },
      { phrase: "upcoming interviews", weight: 1.0 },
      { phrase: "todays interviews", weight: 1.0 },
      { phrase: "today interviews", weight: 1.0 },
      { phrase: "scheduled interviews", weight: 1.0 },
      { phrase: "show interviews", weight: 0.95 },
      { phrase: "list interviews", weight: 0.95 },
    ],
    keywords: [
      { token: "interview", weight: 0.45 },
      { token: "upcoming", weight: 0.15 },
      { token: "scheduled", weight: 0.15 },
      { token: "today", weight: 0.15 },
    ],
    requireAny: ["interview"],
  },
  {
    intent: "compare_candidates",
    phrases: [
      { phrase: "compare candidates", weight: 1.0 },
      { phrase: "compare top 2 candidates", weight: 1.0 },
      { phrase: "compare top 2", weight: 0.95 },
      { phrase: "who is better", weight: 0.9 },
      { phrase: "which is better", weight: 0.9 },
      { phrase: "show differences", weight: 0.85 },
    ],
    keywords: [
      { token: "compare", weight: 0.55 },
      { token: "better", weight: 0.25 },
      { token: "differences", weight: 0.2 },
    ],
    requireAny: ["compare", "better"],
  },
  {
    intent: "hiring_recommendation",
    phrases: [
      { phrase: "should i hire this candidate", weight: 1.0 },
      { phrase: "should i hire this candidate for", weight: 1.0 },
      { phrase: "should i hire", weight: 0.95 },
      { phrase: "should we hire", weight: 0.95 },
      { phrase: "would you recommend hiring", weight: 0.95 },
      { phrase: "recommend hiring", weight: 0.9 },
      { phrase: "is this candidate suitable", weight: 0.95 },
      { phrase: "is this person a good fit", weight: 0.95 },
      { phrase: "good fit", weight: 0.85 },
      { phrase: "should we move forward", weight: 0.95 },
      { phrase: "move forward", weight: 0.85 },
      { phrase: "should we reject", weight: 0.95 },
      { phrase: "should i reject", weight: 0.95 },
      { phrase: "is he qualified", weight: 0.95 },
      { phrase: "is she qualified", weight: 0.95 },
      { phrase: "is this candidate qualified", weight: 0.95 },
      { phrase: "hire or reject", weight: 1.0 },
      { phrase: "hire this candidate", weight: 0.85 },
    ],
    keywords: [
      { token: "hire", weight: 0.45 },
      { token: "reject", weight: 0.4 },
      { token: "suitable", weight: 0.3 },
      { token: "qualified", weight: 0.3 },
      { token: "fit", weight: 0.25 },
      { token: "forward", weight: 0.2 },
      { token: "recommend", weight: 0.15 },
    ],
    requireAny: ["hire", "reject", "suitable", "qualified", "fit", "forward"],
  },
  {
    intent: "job_match",
    phrases: [
      { phrase: "best candidate for", weight: 1.0 },
      { phrase: "best candidates for", weight: 1.0 },
      { phrase: "who is the best for", weight: 0.95 },
      { phrase: "top matching", weight: 0.85 },
    ],
    keywords: [
      { token: "best", weight: 0.2 },
      { token: "for", weight: 0.1 },
    ],
    requireAny: ["best", "top"],
  },
  {
    intent: "skill_gap",
    phrases: [
      { phrase: "what skills are missing", weight: 1.0 },
      { phrase: "skill gap", weight: 0.95 },
      { phrase: "which candidates know", weight: 0.9 },
      { phrase: "who knows", weight: 0.8 },
    ],
    keywords: [
      { token: "missing", weight: 0.25 },
      { token: "skill", weight: 0.2 },
      { token: "skills", weight: 0.2 },
    ],
  },
  {
    intent: "interview_priority",
    phrases: [
      { phrase: "who should be interviewed first", weight: 1.0 },
      { phrase: "interview priority", weight: 0.95 },
      { phrase: "interview first", weight: 0.85 },
    ],
    keywords: [
      { token: "interview", weight: 0.2 },
      { token: "first", weight: 0.2 },
      { token: "priority", weight: 0.3 },
    ],
  },
  {
    intent: "salary_recommendation",
    phrases: [
      { phrase: "salary recommendation", weight: 1.0 },
      { phrase: "recommended salary", weight: 0.95 },
      { phrase: "salary range", weight: 0.9 },
      { phrase: "what salary", weight: 0.85 },
    ],
    keywords: [{ token: "salary", weight: 0.55 }],
    requireAny: ["salary"],
  },
  {
    intent: "risk_analysis",
    phrases: [
      { phrase: "risk analysis", weight: 1.0 },
      { phrase: "hiring risk", weight: 0.9 },
      { phrase: "any risks", weight: 0.85 },
    ],
    keywords: [{ token: "risk", weight: 0.45 }, { token: "risks", weight: 0.45 }],
    requireAny: ["risk", "risks"],
  },
  {
    intent: "ranking_explain",
    phrases: [
      { phrase: "why is candidate ranked first", weight: 1.0 },
      { phrase: "explain the ai decision", weight: 0.95 },
      { phrase: "explain score", weight: 0.85 },
      { phrase: "why ranked", weight: 0.85 },
    ],
    keywords: [
      { token: "why", weight: 0.2 },
      { token: "explain", weight: 0.3 },
      { token: "ranked", weight: 0.25 },
    ],
  },
  {
    intent: "decision_report",
    phrases: [
      { phrase: "decision report", weight: 1.0 },
      { phrase: "generate decision report", weight: 1.0 },
      { phrase: "hiring report", weight: 0.85 },
      { phrase: "full report", weight: 0.8 },
    ],
    keywords: [{ token: "report", weight: 0.4 }],
    requireAny: ["report"],
  },
];

function scoreDefinition(
  normalized: string,
  tokenSet: Set<string>,
  def: SemanticIntentDefinition
): SemanticScore {
  const signals: string[] = [];
  let raw = 0;
  let phraseHits = 0;

  for (const { phrase, weight } of def.phrases) {
    if (phrasePresent(normalized, phrase)) {
      raw += weight;
      phraseHits += 1;
      signals.push(`phrase:${phrase}`);
    }
  }

  for (const { token, weight } of def.keywords) {
    const match = fuzzyTokenScore(token, tokenSet);
    if (match >= 0.7) {
      raw += weight * match;
      signals.push(`kw:${token}:${match.toFixed(2)}`);
    }
  }

  if (def.requireAny && def.requireAny.length > 0) {
    const ok = def.requireAny.some((t) => fuzzyTokenScore(t, tokenSet) >= 0.85);
    if (!ok && phraseHits === 0) {
      return { intent: def.intent, confidence: 0, signals };
    }
  }

  // Softmax-ish compression into 0–1. Strong phrase hits push above threshold quickly.
  let confidence = 1 - Math.exp(-raw * 0.85);
  if (phraseHits >= 1) confidence = Math.max(confidence, 0.72);
  if (phraseHits >= 2) confidence = Math.max(confidence, 0.88);
  if (raw >= 1.2) confidence = Math.max(confidence, 0.9);

  // Domain penalties for known collisions
  if (def.intent === "candidates" && (normalized.includes("applied") || normalized.includes("application"))) {
    confidence *= 0.45;
    signals.push("penalty:application_domain");
  }
  if (def.intent === "ai_ranking" && /\bbest\b/.test(normalized) && /\bfor\b/.test(normalized)) {
    confidence *= 0.35;
    signals.push("penalty:job_match_for");
  }
  if (def.intent === "ai_ranking" && /\bcompare\b/.test(normalized)) {
    confidence *= 0.25;
    signals.push("penalty:compare_owns");
  }
  if (def.intent === "resume_analysis" && /^recommend(?:ation)?s?$/.test(normalized)) {
    confidence = Math.max(confidence, 0.75);
    signals.push("boost:recommendation_alone");
  }
  // Single-token domain words ("jobs", "applications")
  if (
    (def.intent === "jobs" || def.intent === "applications" || def.intent === "interviews") &&
    phraseHits >= 1 &&
    normalized.split(" ").length <= 2
  ) {
    confidence = Math.max(confidence, 0.8);
  }
  if (def.intent === "resume_analysis" && /\bshould i hire\b/.test(normalized)) {
    confidence *= 0.4;
    signals.push("penalty:hire_decision");
  }
  if (def.intent === "jobs" && /\binterview\b/.test(normalized)) {
    confidence *= 0.3;
  }
  if (def.intent === "skill_gap" && /\bmissing skills\b/.test(normalized) && !/\bwhat skills are missing\b|\bskill gap\b/.test(normalized)) {
    // Prefer resume_analysis for bare "missing skills"
    confidence *= 0.55;
    signals.push("penalty:bare_missing_skills");
  }

  return {
    intent: def.intent,
    confidence: Math.max(0, Math.min(1, confidence)),
    signals,
  };
}

export type SemanticDetectionResult = {
  intent: CopilotIntent;
  /** 0–1 */
  confidence: number;
  signals: string[];
  runnersUp: SemanticScore[];
};

/**
 * Score all catalog intents and return the best match.
 */
export function detectSemanticIntent(message: string): SemanticDetectionResult {
  const normalized = normalizeText(message);
  const tokens = tokenize(normalized);
  const tokenSet = expandTokens(tokens);

  // Special-case job_match: only when "best … for <role>" is explicit.
  const jobMatch =
    /\bbest (?:candidate|candidates|applicant|applicants)\s+for\b/.test(normalized) ||
    (/\bwho is the best\b/.test(normalized) && /\bfor\b/.test(normalized) && !/\bnumber one\b/.test(normalized));

  const scored = SEMANTIC_INTENT_CATALOG.map((def) => {
    const result = scoreDefinition(normalized, tokenSet, def);
    if (def.intent === "job_match") {
      if (jobMatch) {
        result.confidence = Math.max(result.confidence, 0.92);
        result.signals.push("special:best_for_role");
      } else {
        // Prevent bare "best candidate" from becoming job_match.
        result.confidence *= 0.15;
        result.signals.push("penalty:no_for_role");
      }
    }
    return result;
  })
    .filter((s) => s.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  const top = scored[0];
  if (!top) {
    return {
      intent: "clarify",
      confidence: 0,
      signals: [],
      runnersUp: [],
    };
  }

  const second = scored[1];
  let confidence = top.confidence;

  // Mild ambiguity dampening only when both are mediocre and very close.
  if (
    second &&
    second.confidence >= 0.55 &&
    confidence - second.confidence < 0.08 &&
    confidence < 0.85
  ) {
    confidence = Math.min(confidence, 0.58);
    top.signals.push(`ambiguous_with:${second.intent}`);
  }

  if (confidence < SEMANTIC_INTENT_THRESHOLD) {
    return {
      intent: "clarify",
      confidence,
      signals: top.signals,
      runnersUp: scored.slice(1, 3),
    };
  }

  return {
    intent: top.intent,
    confidence,
    signals: top.signals,
    runnersUp: scored.slice(1, 3),
  };
}
