/**
 * AI Interview Assistant — personalized interview questions from live
 * resume analysis, ranking, missing skills, job requirements, and experience.
 * Deterministic (no Groq required). Never invents candidate facts.
 */

import type { CopilotToolResult } from "@/lib/ai/hr-tools";
import { selectHiringFocus } from "@/lib/ai/hiring-assistant-report";

export type InterviewQuestionKind =
  | "technical"
  | "behavioral"
  | "hr"
  | "missing_skill"
  | "follow_up"
  | "mixed";

export type InterviewQuestionCard = {
  kind: InterviewQuestionKind;
  question: string;
  why: string;
  expectedAnswer: string;
  redFlags: string;
};

type Focus = NonNullable<ReturnType<typeof selectHiringFocus>>;

function safeScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function extractCount(message: string): number {
  const m = message.match(/\b(\d{1,2})\s+interview questions\b/i)
    ?? message.match(/\bgenerate\s+(\d{1,2})\b/i)
    ?? message.match(/\b(\d{1,2})\s+questions\b/i);
  if (!m) return 8;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return 8;
  return Math.min(15, Math.max(3, n));
}

function detectKind(message: string): InterviewQuestionKind {
  const lower = message.toLowerCase();
  if (/\bfollow[- ]?up\b/.test(lower)) return "follow_up";
  if (/\bbehavioral\b/.test(lower)) return "behavioral";
  if (/\bhr interview\b|\bhr questions\b/.test(lower)) return "hr";
  if (/\bmissing skills?\b/.test(lower)) return "missing_skill";
  if (/\btechnical\b/.test(lower)) return "technical";
  return "mixed";
}

function extractSkillTopics(message: string, focus: Focus): string[] {
  const known = [
    "react",
    "angular",
    "vue",
    "next.js",
    "nextjs",
    "typescript",
    "javascript",
    "node.js",
    "nodejs",
    "python",
    "sql",
    "aws",
    "docker",
    "kubernetes",
    "tailwind",
    "graphql",
    "java",
    "c#",
    ".net",
  ];
  const lower = message.toLowerCase();
  const fromMessage = known.filter((s) => {
    const re = new RegExp(`\\b${s.replace(".", "\\.")}\\b`, "i");
    return re.test(lower);
  });

  const fromMissing = (focus.missingSkills ?? []).slice(0, 6);
  const fromSkills = (focus.skills ?? []).slice(0, 4);
  const fromStrengths = (focus.strengths ?? [])
    .flatMap((s) =>
      known.filter((k) => s.toLowerCase().includes(k.replace(".js", "").replace(".", "")))
    )
    .slice(0, 3);

  const merged = [...fromMessage, ...fromMissing, ...fromSkills, ...fromStrengths];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of merged) {
    const key = item.trim();
    if (!key) continue;
    const norm = key.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(key);
  }
  return out;
}

function isSeniorAsk(message: string, years: number | null, score: number): boolean {
  if (/\bsenior\b/i.test(message)) return true;
  if (years != null && years >= 5) return true;
  if (score >= 85) return true;
  return false;
}

function getJobRequirements(results: CopilotToolResult[]): string[] {
  const hire = results.find((r) => r.tool === "getHiringRecommendation");
  if (hire && "jobRequirements" in hire && Array.isArray(hire.jobRequirements)) {
    return (hire.jobRequirements as string[]).filter(Boolean).slice(0, 8);
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

function card(
  kind: InterviewQuestionKind,
  question: string,
  why: string,
  expectedAnswer: string,
  redFlags: string
): InterviewQuestionCard {
  return { kind, question, why, expectedAnswer, redFlags };
}

function buildMissingSkillQuestions(
  focus: Focus,
  topics: string[],
  senior: boolean
): InterviewQuestionCard[] {
  const skills = topics.length
    ? topics
    : (focus.missingSkills ?? []).length
      ? (focus.missingSkills as string[])
      : [];

  return skills.slice(0, 6).map((skill) =>
    card(
      "missing_skill",
      senior
        ? `For ${focus.jobTitle ?? "this role"}, how have you led delivery that depended on ${skill}? Walk through architecture choices, trade-offs, and outcomes.`
        : `Your analysis flags a gap in **${skill}**. Tell me about the most relevant project where you used ${skill} — what did you personally implement?`,
      `The resume analysis lists **${skill}** as a missing or under-evidenced skill for **${focus.candidateName}** on **${focus.jobTitle}**. This question tests whether the gap is real or just poorly documented.`,
      senior
        ? `A concrete leadership example: scope, team size, ${skill} decisions, metrics (latency, reliability, delivery), and what they would change next time.`
        : `A specific project with their contribution, tools used for ${skill}, challenges faced, and a measurable result — not a tutorial-level explanation.`,
      `Vague buzzwords, cannot name APIs/libraries, blames others for all work, or admits zero hands-on exposure while claiming readiness for the role.`
    )
  );
}

function buildTechnicalQuestions(
  focus: Focus,
  topics: string[],
  senior: boolean,
  requirements: string[]
): InterviewQuestionCard[] {
  const name = focus.candidateName ?? "the candidate";
  const job = focus.jobTitle ?? "this role";
  const strengths = focus.strengths ?? [];
  const cards: InterviewQuestionCard[] = [];

  for (const topic of topics.slice(0, 4)) {
    cards.push(
      card(
        "technical",
        senior
          ? `${name}, how would you design a production ${topic} feature for a ${job} team — including testing, observability, and failure modes?`
          : `Walk me through a ${topic} feature you shipped that relates to the ${job} role. What was hard, and how did you verify it worked?`,
        topics.includes(topic) && (focus.missingSkills ?? []).some((m) =>
          m.toLowerCase().includes(topic.toLowerCase().slice(0, 5))
        )
          ? `**${topic}** appears in missing-skill signals for this candidate, so we need proof of practical depth.`
          : `**${topic}** is relevant to ${job} and should be validated against ${name}'s claimed experience (AI score ${safeScore(focus.overallScore ?? focus.score)}/100).`,
        `Clear architecture/flow, trade-offs, testing approach, and ownership of a real outcome — not a blog-post summary.`,
        `Cannot go beyond syntax trivia, no production stories, or contradicts skills listed in the analysis.`
      )
    );
  }

  if (strengths[0]) {
    cards.push(
      card(
        "technical",
        `Your analysis highlights: “${strengths[0]}”. Give a concrete example that proves this strength in a ${job} context.`,
        `We personalize from a documented strength so the interview validates resume claims instead of asking generic coding trivia.`,
        `A recent, specific story with constraints, their decisions, and impact (users, performance, delivery).`,
        `Cannot expand beyond the bullet, or the story does not match the claimed strength.`
      )
    );
  }

  if (requirements[0]) {
    cards.push(
      card(
        "technical",
        `One job requirement on file is: “${requirements[0]}”. How have you met this requirement in practice?`,
        `Interview questions should map to live job requirements, not a generic checklist.`,
        `Direct mapping from past work to the requirement, with tools and outcomes.`,
        `Dodges the requirement, or answers with unrelated experience.`
      )
    );
  }

  if (focus.experience?.trim()) {
    cards.push(
      card(
        "technical",
        `Based on your experience summary (“${focus.experience.trim().slice(0, 140)}${focus.experience.trim().length > 140 ? "…" : ""}”), what would you own in the first 90 days as a ${senior ? "senior " : ""}${job}?`,
        `Ties the question to this candidate’s experience narrative from resume analysis.`,
        `A realistic 30/60/90 plan grounded in their background and the role’s needs.`,
        `Generic onboarding speech with no link to their actual experience.`
      )
    );
  }

  return cards;
}

function buildBehavioralQuestions(focus: Focus, senior: boolean): InterviewQuestionCard[] {
  const name = focus.candidateName ?? "the candidate";
  const job = focus.jobTitle ?? "this role";
  const weaknesses = focus.weaknesses ?? [];
  const cards: InterviewQuestionCard[] = [];

  cards.push(
    card(
      "behavioral",
      `Tell me about a time you disagreed with a teammate on a ${job}-related technical decision. What happened, and what did you do?`,
      `Behavioral signal for collaboration under pressure — important given ${name}'s current AI recommendation (${focus.recommendationLabel || focus.recommendation || "under review"}).`,
      `STAR-style story with respectful conflict, data-based decision, and a clear outcome.`,
      `Blames everyone else, no self-reflection, or cannot recall a real conflict.`
    )
  );

  if (weaknesses[0]) {
    cards.push(
      card(
        "behavioral",
        `The analysis notes a weakness: “${weaknesses[0]}”. Describe a recent situation where this showed up and how you handled it.`,
        `Personalizes from a live weakness flag so we test growth, not a canned “tell me about a weakness” answer.`,
        `Honest ownership, concrete mitigation steps, and evidence of improvement.`,
        `Denies the weakness entirely, or only gives a humble-brag.`
      )
    );
  }

  cards.push(
    card(
      "behavioral",
      senior
        ? `Describe how you mentored or unblocked others while delivering under a tight deadline.`
        : `Describe a deadline you nearly missed. How did you communicate and recover?`,
      `Checks accountability and communication — dimensions that affect hire risk beyond raw skill match (${safeScore(focus.skillMatch)}/100).`,
      `Clear timeline, stakeholders informed, trade-offs made, and lessons applied later.`,
      `Hid the problem, or has no structured recovery approach.`
    )
  );

  return cards;
}

function buildHrQuestions(focus: Focus, years: number | null): InterviewQuestionCard[] {
  const name = focus.candidateName ?? "the candidate";
  const job = focus.jobTitle ?? "this role";
  return [
    card(
      "hr",
      `Why are you interested in the ${job} role here, and what would make you accept or decline an offer?`,
      `HR fit and motivation — pairs with ${name}'s ranking/score context (${safeScore(focus.overallScore ?? focus.score)}/100${focus.rank != null ? `, rank #${focus.rank}` : ""}).`,
      `Role-specific motivation, realistic expectations on scope/comp/growth.`,
      `Only cares about title/salary, or cannot explain interest in this role family.`
    ),
    card(
      "hr",
      years != null
        ? `You show about ${years} year${years === 1 ? "" : "s"} of experience on file. How does that prepare you for ${job}?`
        : `How does your experience prepare you for the day-to-day of a ${job}?`,
      `Validates experience claims against the role without inventing tenure details.`,
      `Concrete mapping from past responsibilities to this job’s duties.`,
      `Inflates tenure, or cannot connect experience to the role.`
    ),
    card(
      "hr",
      `What support do you need in the first month to be successful in ${job}?`,
      `Surfaces onboarding risk and self-awareness — useful when missing skills are present.`,
      `Practical asks (docs, pairing, access) without sounding dependent for basics.`,
      `Needs hand-holding for core skills that the role assumes.`
    ),
  ];
}

function buildFollowUps(focus: Focus, topics: string[]): InterviewQuestionCard[] {
  const name = focus.candidateName ?? "the candidate";
  const cards: InterviewQuestionCard[] = [];

  for (const skill of topics.slice(0, 3)) {
    cards.push(
      card(
        "follow_up",
        `You mentioned ${skill} — what specifically did you own versus what the team owned?`,
        `Follow-up to prevent resume inflation on **${skill}** for ${name}.`,
        `Clear ownership boundary, PRs/features named, and what they would do differently.`,
        `Shifts to “we” for everything, or cannot name personal contributions.`
      )
    );
  }

  if ((focus.strengths ?? [])[1]) {
    cards.push(
      card(
        "follow_up",
        `Earlier you pointed to “${focus.strengths![1]}”. What would a skeptical senior engineer still doubt about that claim, and how would you prove it?`,
        `Stress-tests a documented strength with a follow-up probe.`,
        `Anticipates critique and offers evidence (metrics, code review, production incident).`,
        `Gets defensive or cannot offer proof beyond adjectives.`
      )
    );
  }

  cards.push(
    card(
      "follow_up",
      `If we hired you and a production incident hit in week two in the ${focus.jobTitle ?? "role"} stack, what are your first three steps?`,
      `Follow-up on composure and operational maturity after technical discussion.`,
      `Triage, communicate, mitigate, then root-cause — in that order.`,
      `Freezes, or jumps to blame without containment.`
    )
  );

  return cards;
}

function selectCards(
  kind: InterviewQuestionKind,
  focus: Focus,
  topics: string[],
  senior: boolean,
  requirements: string[],
  years: number | null,
  count: number
): InterviewQuestionCard[] {
  const pools: InterviewQuestionCard[] = [];

  if (kind === "missing_skill") {
    pools.push(...buildMissingSkillQuestions(focus, topics, senior));
  } else if (kind === "technical") {
    pools.push(...buildTechnicalQuestions(focus, topics, senior, requirements));
    pools.push(...buildMissingSkillQuestions(focus, topics, senior).slice(0, 2));
  } else if (kind === "behavioral") {
    pools.push(...buildBehavioralQuestions(focus, senior));
  } else if (kind === "hr") {
    pools.push(...buildHrQuestions(focus, years));
  } else if (kind === "follow_up") {
    pools.push(...buildFollowUps(focus, topics));
  } else {
    // mixed — personalized blend
    pools.push(...buildMissingSkillQuestions(focus, topics, senior).slice(0, 3));
    pools.push(...buildTechnicalQuestions(focus, topics, senior, requirements).slice(0, 3));
    pools.push(...buildBehavioralQuestions(focus, senior).slice(0, 2));
    pools.push(...buildHrQuestions(focus, years).slice(0, 1));
    pools.push(...buildFollowUps(focus, topics).slice(0, 2));
  }

  // De-dupe by question text
  const seen = new Set<string>();
  const unique: InterviewQuestionCard[] = [];
  for (const q of pools) {
    const key = q.question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(q);
  }

  // If still short (thin analysis), add experience-grounded probes — still personalized.
  while (unique.length < count) {
    const n = unique.length + 1;
    unique.push(
      card(
        "technical",
        `Looking at ${focus.candidateName}'s profile for ${focus.jobTitle ?? "the role"}, what part of the stack are you strongest in today, and where should we pair you with a stronger teammate?`,
        `Fills remaining interview slots using this candidate’s role context when fewer gap/strength signals are available.`,
        `Honest strength/weakness split with a collaboration plan.`,
        `Claims strength in everything with no evidence.`
      )
    );
    if (n > count + 2) break;
  }

  return unique.slice(0, count);
}

/** Detect Interview Assistant style questions. */
export function isInterviewAssistantQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\b(worth interviewing|should i hire|shortlist|good fit)\b/.test(lower)) {
    // Those belong to hiring assistant unless explicitly asking for questions.
    if (!/\b(interview questions?|generate .+ questions?|what should i ask)\b/.test(lower)) {
      return false;
    }
  }
  return /\b(generate interview questions|interview questions|technical interview|behavioral interview|hr interview|follow[- ]?up questions|questions based on|questions for (a |this |the )?|generate \d+ interview|what should i ask|questions based on missing skills)\b/i.test(
    message
  );
}

/**
 * Build the AI Interview Assistant report from live tool evidence.
 */
export function formatInterviewAssistantReport(
  message: string,
  results: CopilotToolResult[],
  focusCandidate?: string | null
): string | null {
  const focus = selectHiringFocus(message, results, focusCandidate);
  if (!focus?.candidateName) return null;

  const name = focus.candidateName.trim();
  const job = (focus.jobTitle ?? "the role").trim();
  const score = safeScore(focus.overallScore ?? focus.score);
  const kind = detectKind(message);
  const count = extractCount(message);
  const years = getProfileYears(results, name);
  const senior = isSeniorAsk(message, years, score);
  const topics = extractSkillTopics(message, focus);
  const requirements = getJobRequirements(results);
  const cards = selectCards(kind, focus, topics, senior, requirements, years, count);

  const hasResumeSignal =
    (focus.strengths?.length ?? 0) > 0 ||
    (focus.missingSkills?.length ?? 0) > 0 ||
    (focus.skills?.length ?? 0) > 0 ||
    Boolean(focus.experience?.trim()) ||
    Boolean(focus.summary?.trim());

  const lines: string[] = [];
  lines.push(`## AI Interview Assistant — ${name}`);
  lines.push(
    `**Role:** ${job}${focus.rank != null ? ` · Rank #${focus.rank}` : ""} · AI score **${score}/100**${senior ? " · Senior-calibrated" : ""}`
  );
  lines.push(
    `**Focus:** ${
      kind === "mixed"
        ? "Mixed technical + behavioral + HR"
        : kind.replace("_", " ")
    } · **${cards.length} questions** personalized from live resume analysis${topics.length ? ` · Topics: ${topics.slice(0, 5).join(", ")}` : ""}`
  );
  if (!hasResumeSignal) {
    lines.push(
      "",
      "_Limited resume-analysis detail was available; questions still use ranking/role context. Run AI Resume Analysis for richer personalization._"
    );
  }
  lines.push("");

  cards.forEach((q, index) => {
    lines.push(`### Q${index + 1}. ${q.question}`);
    lines.push(`**Why this question matters:** ${q.why}`);
    lines.push(`**Expected good answer:** ${q.expectedAnswer}`);
    lines.push(`**Red flags:** ${q.redFlags}`);
    lines.push("");
  });

  lines.push("### Interviewer tip");
  lines.push(
    hasResumeSignal
      ? `Stay on ${name}'s documented gaps (${(focus.missingSkills ?? []).slice(0, 3).join(", ") || "see questions above"}) and claimed strengths — do not fall back to generic trivia.`
      : `Ask for concrete artifacts (PRs, demos, metrics). Re-run resume analysis to tighten the next interview pack.`
  );

  return lines.join("\n").trim();
}
