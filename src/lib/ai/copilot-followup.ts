/**
 * Conversational follow-up resolution for the HR Copilot / Hiring Agent.
 * Pure helpers — no server-only import so intent tests can use them.
 */

export type FollowUpHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ConversationMemory = {
  previousUserQuestion: string | null;
  previousAssistantAnswer: string | null;
  jobQuery?: string;
  candidateNames: string[];
  lastDomain:
    | "resume_analysis"
    | "ai_ranking"
    | "hiring"
    | "compare"
    | "applications"
    | "candidates"
    | "jobs"
    | "interviews"
    | "general"
    | null;
};

const FOLLOW_UP_PATTERNS = [
  /^(why|why\?|and why|why that|why them|why him|why her)\??$/i,
  /^(explain|explain that|explain more|tell me more|details|more details)\.?\??$/i,
  /^(explain (this|the) ai score|explain (this|the) score|why is (his|her|their|the) score)\b/i,
  /^(who is better|which is better|show differences|differences)\??$/i,
  /^(what about salary|salary|and salary|salary\?|what salary range|salary range)\??$/i,
  /^(risks?|what about risks?|any risks?|what are the risks?)\??$/i,
  /^(report|decision report|full report)\??$/i,
  /^(should i hire (them|him|her|this candidate|that candidate))\??$/i,
  /^(what are (the|his|her|their) weaknesses|weaknesses|and weaknesses)\??$/i,
  /^(what are (the|his|her|their) strengths|strengths|and strengths)\??$/i,
  /^(what skills are missing|missing skills|and missing skills)\??$/i,
  /^(what skills should (he|she|they|this candidate) improve|skills? to improve|what should (he|she|they) improve)\??$/i,
  /^(what should i ask in (the )?interview|interview questions|generate interview questions|interview focus|technical interview questions|behavioral interview questions|hr interview questions|follow[- ]?up questions|generate \d+ interview questions)\??$/i,
  /^(questions based on .+|questions for (a |this |the )?.+)\??$/i,
  /^(is (he|she|they) worth interviewing|worth interviewing)\??$/i,
  /^(should i shortlist (him|her|them|this candidate)|shortlist (him|her|them|this candidate))\??$/i,
  /^(would you recommend (him|her|them|this candidate)|is (he|she|they|this candidate) a good fit|good fit)\??$/i,
  /^(why should i (hire|reject) (him|her|them|this candidate)|give a hiring recommendation|hiring recommendation)\??$/i,
  /^(what are (the |his |her |their |candidate'?s )?weaknesses|which missing skills matter)\??$/i,
  /^(recommend( him| her| them)? for|would (he|she|they) fit|fit (as|for)|suitable (job|role)|another suitable (job|role))\b/i,
  /^(recommendation|the recommendation|your recommendation)\??$/i,
  /^(summarize|summary|summarize this resume|rate (it|them|him|her))\??$/i,
  /^(is (he|she|they|this|that) (good|strong|suitable|qualified))\??$/i,
  /^(compare him|compare her|compare them|compare with)\b/i,
];

const DOMAIN_HINTS: Array<{ domain: ConversationMemory["lastDomain"]; pattern: RegExp }> = [
  {
    domain: "resume_analysis",
    pattern:
      /\b(resume|cv|analysis|analyze|review|evaluate|strengths?|weaknesses?|feedback|summarize|rate)\b/i,
  },
  {
    domain: "ai_ranking",
    pattern: /\b(ranking|rank|best candidate|top candidate|highest|ai score|strongest|number one)\b/i,
  },
  {
    domain: "hiring",
    pattern:
      /\b(should i hire|should we hire|hire this|hiring recommendation|good fit|move forward|hire or reject|qualified|should we reject)\b/i,
  },
  {
    domain: "compare",
    pattern: /\b(compare|who is better|differences)\b/i,
  },
  {
    domain: "applications",
    pattern: /\b(application|who applied)\b/i,
  },
  {
    domain: "candidates",
    pattern: /\b(candidate list|show candidates|all applicants)\b/i,
  },
  {
    domain: "jobs",
    pattern: /\b(jobs?|openings|vacancies|positions)\b/i,
  },
  {
    domain: "interviews",
    pattern: /\binterview/i,
  },
];

export function isFollowUpMessage(message: string): boolean {
  const trimmed = message.trim().replace(/[.!]+$/g, "");
  if (!trimmed) return false;

  if (trimmed.length <= 64 && FOLLOW_UP_PATTERNS.some((p) => p.test(trimmed))) {
    return true;
  }

  // Short pronoun / aspect questions that need prior context
  if (
    trimmed.length < 72 &&
    /\b(why|explain|weaknesses?|strengths?|missing skills?|hire (him|her|them)|recommend|skills? are missing|risks?|interview)\b/i.test(
      trimmed
    ) &&
    !/\b(resume|cv|candidate list|applications?|jobs?|interview list)\b/i.test(trimmed)
  ) {
    return true;
  }

  return false;
}

export function lastUserQuestion(history: FollowUpHistoryMessage[]): string | null {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const msg = history[i];
    if (msg?.role === "user" && msg.content.trim() && !isFollowUpMessage(msg.content)) {
      return msg.content.trim();
    }
  }
  return null;
}

function lastAssistantAnswer(history: FollowUpHistoryMessage[]): string | null {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const msg = history[i];
    if (msg?.role === "assistant" && msg.content.trim()) {
      return msg.content.trim();
    }
  }
  return null;
}

function detectDomain(text: string): ConversationMemory["lastDomain"] {
  for (const hint of DOMAIN_HINTS) {
    if (hint.domain && hint.pattern.test(text)) return hint.domain;
  }
  return "general";
}

const INVALID_CANDIDATE_NAMES =
  /^(this|that|the|him|her|them|they|he|she|candidate|person|applicant|unknown|hire|strong|strong hire|do not hire|hire with reservations|maybe|reject|recommendation|role|developer|admin|salary|score|overall|match|reasons?|risks?|interview|focus|verdict|reservations|this candidate|that candidate)$/i;

function isValidCandidateName(name: string | undefined | null): name is string {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length < 2) return false;
  if (INVALID_CANDIDATE_NAMES.test(trimmed)) return false;
  if (/^(this|that|the|him|her|them|they|he|she)\b/i.test(trimmed)) return false;
  if (/\bcandidate\b/i.test(trimmed) && trimmed.split(/\s+/).length <= 2) return false;
  if (/^(with|for|and|from|only|title|role|focus|topics?)$/i.test(trimmed)) return false;
  // Job titles / stack tokens often appear bold in assistant answers — not people.
  if (
    /\b(developer|editor|designer|engineer|manager|analyst|admin|intern|lead|senior|junior)\b/i.test(
      trimmed
    ) &&
    !/\d/.test(trimmed)
  ) {
    return false;
  }
  if (
    /^(react|angular|vue|next\.?js|typescript|javascript|python|java|html|css|tailwind|node\.?js|sql|aws|docker|graphql|typeScript)$/i.test(
      trimmed
    )
  ) {
    return false;
  }
  // Reject single tech words captured from "**TypeScript**" / "Advanced Tailwind CSS"
  if (/tailwind|typescript|javascript|next\.?js/i.test(trimmed) && !/\d/.test(trimmed)) {
    return false;
  }
  return true;
}

function extractNamesFromText(corpus: string): string[] {
  const names = new Set<string>();

  const vs = corpus.match(
    /\bcompare\s+([A-Za-z][A-Za-z .'-]{1,40}?)\s+(?:vs\.?|versus|and)\s+([A-Za-z][A-Za-z .'-]{1,40})/i
  );
  if (vs) {
    if (isValidCandidateName(vs[1])) names.add(vs[1]!.trim());
    if (isValidCandidateName(vs[2])) names.add(vs[2]!.trim());
  }

  const hire = corpus.match(
    /\b(?:hire|recommend|about)\s+([A-Za-z][A-Za-z0-9'_-]{1,60})\b/
  );
  if (isValidCandidateName(hire?.[1])) {
    names.add(hire![1]!.trim());
  }
  const hireProper = corpus.match(
    /\b(?:hire|recommend|about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/
  );
  if (isValidCandidateName(hireProper?.[1])) {
    names.add(hireProper![1]!.trim());
  }

  // Hiring / Interview Assistant headers: "## AI … Assistant — name"
  const assistantHeader = corpus.matchAll(
    /AI (?:Hiring|Interview) Assistant\s*[—\-:]\s*\*{0,2}([A-Za-z][A-Za-z0-9'_-]{2,60})\b\*{0,2}/gi
  );
  for (const match of assistantHeader) {
    if (isValidCandidateName(match[1])) names.add(match[1]!.trim());
  }

  // Names often appear in assistant answers as "Top ranked: Name" / "Prefer Name"
  // Also accept lowercase/username-style handles (e.g. basitnayab6975).
  const answerNames = corpus.matchAll(
    /\b(?:Top ranked|Best match|Prefer|Interview first|Preferred candidate|\*{0,2}Candidate\*{0,2}):\s*\*{0,2}([A-Za-z][A-Za-z0-9 .'_-]{1,60}?)\*{0,2}(?:\s+with\b|\s+at\b|\s*\(|\.|,|$)/gi
  );
  for (const match of answerNames) {
    if (isValidCandidateName(match[1])) names.add(match[1]!.trim());
  }

  const boldNames = corpus.matchAll(/\*\*([A-Za-z][A-Za-z0-9 .'_-]{1,60}?)\*\*/g);
  for (const match of boldNames) {
    if (isValidCandidateName(match[1])) names.add(match[1]!.trim());
  }

  // Prefer username-like / digit-bearing names first (e.g. basitnayab6975).
  const list = [...names];
  list.sort((a, b) => {
    const score = (n: string) =>
      (/\d/.test(n) ? 2 : 0) + (n.length >= 6 ? 1 : 0) + (/^[a-z0-9_]+$/i.test(n) ? 1 : 0);
    return score(b) - score(a);
  });
  return list;
}

export function extractContextFromHistory(history: FollowUpHistoryMessage[]): ConversationMemory {
  const previousUserQuestion = lastUserQuestion(history);
  const previousAssistantAnswer = lastAssistantAnswer(history);
  const corpus = [
    ...history.slice(-8).map((m) => m.content),
    previousUserQuestion ?? "",
    previousAssistantAnswer ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  const jobMatch = corpus.match(
    /\b(?:for|about)\s+(?:the\s+|our\s+)?([a-z0-9.+# /&+-]{2,40}?)(?:\s+position|\s+role|\s+job)?(?:\?|$)/i
  );
  const role = corpus.match(
    /\b(react\s+developer|frontend developer|backend developer|video editor|developer|designer|marketing|engineer|manager|analyst)\b/i
  );

  const rawJob = (jobMatch?.[1] ?? role?.[1])?.trim();
  // Reject sentence fragments accidentally captured from assistant prose.
  const jobQuery =
    rawJob &&
    rawJob.length <= 40 &&
    !/\b(as written|consider|unless|analysis|signaling|poor fit)\b/i.test(rawJob)
      ? rawJob
      : role?.[1]?.trim();

  const domainSource = previousUserQuestion ?? corpus;
  return {
    previousUserQuestion,
    previousAssistantAnswer,
    jobQuery,
    candidateNames: extractNamesFromText(corpus),
    lastDomain: detectDomain(domainSource),
  };
}

/**
 * Rewrites a short follow-up into a full query using prior turns / domain memory.
 */
export function resolveFollowUpQuery(
  message: string,
  history: FollowUpHistoryMessage[]
): { resolvedMessage: string; followUpKind: string; memory: ConversationMemory } | null {
  if (!isFollowUpMessage(message) || history.length === 0) return null;

  const memory = extractContextFromHistory(history);
  const lower = message.trim().toLowerCase();
  const prior = memory.previousUserQuestion ?? "the previous question";
  const candidate =
    memory.candidateNames[0] ??
    (memory.lastDomain === "resume_analysis" || memory.lastDomain === "ai_ranking"
      ? "this candidate"
      : "this candidate");
  const job = memory.jobQuery ?? "the role";

  if (/weakness/i.test(lower)) {
    return {
      resolvedMessage: `What are the weaknesses in the resume for ${candidate}? (regarding: ${prior})`,
      followUpKind: "weaknesses",
      memory,
    };
  }
  if (/strength/i.test(lower)) {
    return {
      resolvedMessage: `What are the strengths in the resume for ${candidate}? (regarding: ${prior})`,
      followUpKind: "strengths",
      memory,
    };
  }
  // Interview packs that mention missing skills must not be rewritten as skill-gap asks.
  if (
    /missing skills?|skills? are missing/i.test(lower) &&
    !/\b(questions?|interview)\b/i.test(lower)
  ) {
    if (memory.lastDomain === "resume_analysis") {
      return {
        resolvedMessage: `Show missing skills from the resume analysis for ${candidate} (regarding: ${prior})`,
        followUpKind: "missing_skills",
        memory,
      };
    }
    return {
      resolvedMessage: `What skills are missing for ${candidate}? (regarding: ${prior})`,
      followUpKind: "missing_skills",
      memory,
    };
  }
  if (/^(why|explain)/i.test(lower)) {
    if (memory.lastDomain === "hiring") {
      return {
        resolvedMessage: `Should I hire ${candidate}? Explain the hiring recommendation in detail`,
        followUpKind: "explain_hire",
        memory,
      };
    }
    if (memory.lastDomain === "ai_ranking") {
      return {
        resolvedMessage: `Why is candidate ranked first? Explain AI ranking for ${candidate}`,
        followUpKind: "explain",
        memory,
      };
    }
    return {
      resolvedMessage: `Explain the AI decision for: ${prior}`,
      followUpKind: "explain",
      memory,
    };
  }
  if (!/risk/i.test(lower) && /interview questions|generate interview|what should i ask/i.test(lower)) {
    return {
      resolvedMessage: `Generate personalized interview questions for candidate ${candidate}`,
      followUpKind: "interview_focus",
      memory,
    };
  }
  if (!/risk/i.test(lower) && /\bworth interviewing\b/i.test(lower)) {
    return {
      resolvedMessage: `Should I hire ${candidate}? Assess whether interviewing is worthwhile`,
      followUpKind: "interview_focus",
      memory,
    };
  }
  if (/improve|skills? should/i.test(lower)) {
    return {
      resolvedMessage: `Show missing skills from the resume analysis for ${candidate}`,
      followUpKind: "improve_skills",
      memory,
    };
  }
  if (/difference|who is better|which is better/i.test(lower)) {
    if (memory.candidateNames.length >= 2) {
      return {
        resolvedMessage: `Compare ${memory.candidateNames[0]} vs ${memory.candidateNames[1]} show differences`,
        followUpKind: "compare",
        memory,
      };
    }
    return {
      resolvedMessage: `Compare top 2 candidates for ${job} show differences`,
      followUpKind: "compare",
      memory,
    };
  }
  if (/salary/i.test(lower)) {
    return {
      resolvedMessage: `Salary recommendation for ${candidate}`,
      followUpKind: "salary",
      memory,
    };
  }
  if (/ai score|score only|explain .+ score|why is .+ score/i.test(lower)) {
    return {
      resolvedMessage: `Explain the AI score and ranking for ${candidate}`,
      followUpKind: "explain_score",
      memory,
    };
  }
  if (/worth interviewing/i.test(lower) && !/questions?/i.test(lower)) {
    return {
      resolvedMessage: `Should I hire ${candidate}? Provide interview focus questions and whether interviewing is worthwhile`,
      followUpKind: "interview_focus",
      memory,
    };
  }
  if (
    /interview questions|generate interview|technical interview|behavioral interview|hr interview|follow[- ]?up questions|questions based on|questions for|what should i ask/i.test(
      lower
    )
  ) {
    // Preserve the original ask (React / Angular / 10 / senior / missing skills)
    // so the Interview Assistant can personalize correctly.
    return {
      resolvedMessage: `${message.trim()} (for candidate ${candidate})`,
      followUpKind: "interview_focus",
      memory,
    };
  }
  if (/shortlist/i.test(lower)) {
    return {
      resolvedMessage: `Should I shortlist ${candidate}? Use resume analysis and AI ranking`,
      followUpKind: "hire",
      memory,
    };
  }
  if (/would you recommend|good fit|hiring recommendation|why should i (hire|reject)/i.test(lower)) {
    return {
      resolvedMessage: `Give a hiring recommendation for ${candidate} using resume analysis and AI ranking`,
      followUpKind: "hire",
      memory,
    };
  }
  if (/which missing skills|missing skills matter/i.test(lower)) {
    return {
      resolvedMessage: `Which missing skills matter the most for ${candidate}?`,
      followUpKind: "missing_skills",
      memory,
    };
  }
  if (
    /recommend .+ for|fit (as|for)|would (he|she|they) fit|suitable (job|role)|another suitable (job|role)/i.test(
      lower
    )
  ) {
    if (/another suitable (job|role)/i.test(lower)) {
      return {
        resolvedMessage: `Suggest another suitable role for candidate ${candidate} using open jobs and resume analysis`,
        followUpKind: "role_fit",
        memory,
      };
    }
    const roleMatch = message.match(
      /\b(?:for|as|fit)\s+([A-Za-z][A-Za-z0-9 /+#.-]{2,60})(?:\?|$)/i
    );
    const role = roleMatch?.[1]?.trim() || job;
    // Keep the candidate's existing analysis; do not require a cached row for the target role.
    return {
      resolvedMessage: `Assess role fit for candidate ${candidate} targeting role ${role}`,
      followUpKind: "role_fit",
      memory: { ...memory, jobQuery: role },
    };
  }
  if (/compare (him|her|them)|compare with/i.test(lower)) {
    return {
      resolvedMessage: `Compare top 2 candidates show differences regarding ${candidate}`,
      followUpKind: "compare",
      memory,
    };
  }
  if (/risk/i.test(lower)) {
    return {
      resolvedMessage: `Risk analysis for ${candidate}`,
      followUpKind: "risk",
      memory,
    };
  }
  if (/report/i.test(lower)) {
    return {
      resolvedMessage: `Generate decision report for ${candidate}`,
      followUpKind: "report",
      memory,
    };
  }
  if (/should i hire|hire (him|her|them)/i.test(lower)) {
    return {
      resolvedMessage: `Should I hire ${candidate}?`,
      followUpKind: "hire",
      memory,
    };
  }
  if (/recommend/i.test(lower)) {
    return {
      resolvedMessage: `What is the AI recommendation for ${candidate}? (regarding: ${prior})`,
      followUpKind: "recommendation",
      memory,
    };
  }
  if (/summarize|summary|rate /i.test(lower)) {
    return {
      resolvedMessage: `Summarize and rate the resume for ${candidate} (regarding: ${prior})`,
      followUpKind: "resume_followup",
      memory,
    };
  }
  if (/good|strong|suitable|qualified|fit/i.test(lower)) {
    return {
      resolvedMessage: `Should I hire ${candidate}? Is this candidate suitable?`,
      followUpKind: "suitability",
      memory,
    };
  }

  // Domain-aware generic rewrite
  if (memory.lastDomain === "resume_analysis") {
    return {
      resolvedMessage: `${message} for the same resume/candidate (${candidate}) from: ${prior}`,
      followUpKind: "resume_context",
      memory,
    };
  }
  if (memory.lastDomain === "ai_ranking") {
    return {
      resolvedMessage: `${message} about the top ranked candidate (${candidate}) from: ${prior}`,
      followUpKind: "ranking_context",
      memory,
    };
  }

  return {
    resolvedMessage: `${message} (regarding: ${prior})`,
    followUpKind: "generic",
    memory,
  };
}
