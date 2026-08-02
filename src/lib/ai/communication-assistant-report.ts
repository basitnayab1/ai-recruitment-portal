/**
 * AI Recruitment Communication Assistant — professional HR emails
 * from live Supabase tool evidence (no invented candidate/interview facts).
 */

import type { CopilotToolResult } from "@/lib/ai/hr-tools";

export type CommunicationEmailType =
  | "interview_invitation"
  | "interview_reminder"
  | "interview_reschedule"
  | "interview_cancellation"
  | "interview_confirmation"
  | "rejection"
  | "offer_letter"
  | "follow_up"
  | "salary_negotiation"
  | "onboarding"
  | "thank_you"
  | "missing_documents"
  | "general";

export type CommunicationTone =
  | "professional"
  | "friendly"
  | "formal"
  | "short"
  | "detailed";

type LiveCommContext = {
  candidateName: string | null;
  jobTitle: string | null;
  interviewDate: string | null;
  interviewTime: string | null;
  companyName: string;
  hrName: string | null;
  interviewerName: string | null;
  aiScore: number | null;
  recommendation: string | null;
  missingSkills: string[];
  sources: string[];
};

const TYPE_LABELS: Record<CommunicationEmailType, string> = {
  interview_invitation: "Interview Invitation",
  interview_reminder: "Interview Reminder",
  interview_reschedule: "Interview Reschedule",
  interview_cancellation: "Interview Cancellation",
  interview_confirmation: "Interview Confirmation",
  rejection: "Rejection",
  offer_letter: "Offer Letter",
  follow_up: "Follow-up",
  salary_negotiation: "Salary Negotiation",
  onboarding: "Onboarding",
  thank_you: "Thank You",
  missing_documents: "Missing Documents Request",
  general: "General HR Communication",
};

function companyFromEnv(): string {
  return process.env.APP_NAME?.trim() || "AI Recruitment Portal";
}

function matchesName(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/** Detect communication-assistant asks (emails / invitations / letters). */
export function isCommunicationAssistantQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  // Avoid stealing Interview Assistant question packs.
  if (
    /\b(interview questions?|technical interview questions?|behavioral interview|what should i ask|questions based on)\b/.test(
      lower
    )
  ) {
    return false;
  }
  return /\b(send (an? )?interview invitation|write (an? )?interview invitation|interview invitation email|generate (a |an )?(rejection|offer|follow[- ]?up|salary|onboarding|reminder) email|generate (an? )?offer letter|thank the candidate|ask (the )?candidate for missing|missing documents|reschedule interview|cancel interview|confirm interview|send reminder|reminder email|salary negotiation|onboarding email|draft (an? )?email|write (an? )?email|generate email)\b/i.test(
    message
  );
}

export function detectCommunicationEmailType(
  message: string
): CommunicationEmailType {
  const lower = message.toLowerCase();
  if (/\b(salary negotiation|negotiate salary|compensation email)\b/.test(lower)) {
    return "salary_negotiation";
  }
  if (/\b(onboarding)\b/.test(lower)) return "onboarding";
  if (/\b(thank the candidate|thank[- ]you email|thank you email)\b/.test(lower)) {
    return "thank_you";
  }
  if (/\b(missing documents?|ask .+ for missing)\b/.test(lower)) {
    return "missing_documents";
  }
  if (/\b(reschedule)\b/.test(lower)) return "interview_reschedule";
  if (/\b(cancel interview|interview cancellation)\b/.test(lower)) {
    return "interview_cancellation";
  }
  if (/\b(confirm interview|interview confirmation)\b/.test(lower)) {
    return "interview_confirmation";
  }
  if (/\b(reminder)\b/.test(lower)) return "interview_reminder";
  if (/\b(reject|rejection)\b/.test(lower)) return "rejection";
  if (/\b(offer letter|offer email|generate offer)\b/.test(lower)) {
    return "offer_letter";
  }
  if (/\b(follow[- ]?up)\b/.test(lower)) return "follow_up";
  if (/\b(interview invitation|send interview|write interview invitation)\b/.test(lower)) {
    return "interview_invitation";
  }
  return "general";
}

export function detectCommunicationTone(message: string): CommunicationTone {
  const lower = message.toLowerCase();
  if (/\b(friendly|warm)\b/.test(lower)) return "friendly";
  if (/\b(formal|official)\b/.test(lower)) return "formal";
  if (/\b(short|brief|concise)\b/.test(lower)) return "short";
  if (/\b(detailed|long|comprehensive)\b/.test(lower)) return "detailed";
  return "professional";
}

function extractFocusCandidate(message: string): string | undefined {
  const forName = message.match(
    /\b(?:for|to)\s+([A-Za-z][A-Za-z0-9'_-]{1,60})\b/i
  );
  const name = forName?.[1]?.trim();
  if (
    !name ||
    /^(the|a|an|this|that|him|her|them|candidate|interview|email|offer|rejection|reminder)$/i.test(
      name
    )
  ) {
    return undefined;
  }
  return name;
}

function buildLiveContext(
  message: string,
  results: CopilotToolResult[]
): LiveCommContext {
  const focus = extractFocusCandidate(message);
  const sources: string[] = [];

  const apps = results.find((r) => r.tool === "searchApplications");
  const jobs = results.find((r) => r.tool === "searchJobs");
  const candidates = results.find((r) => r.tool === "searchCandidates");
  const profile = results.find((r) => r.tool === "getCandidateProfile");
  const analysis = results.find(
    (r) => r.tool === "searchResumeAnalysis" || r.tool === "searchAnalysis"
  );
  const ranking = results.find(
    (r) => r.tool === "searchAIRanking" || r.tool === "searchRanking"
  );
  const emailTool = results.find((r) => r.tool === "generateAgentEmail");

  let candidateName: string | null = null;
  let jobTitle: string | null = null;
  let interviewDate: string | null = null;
  let interviewTime: string | null = null;
  let hrName: string | null = null;
  let interviewerName: string | null = null;
  let aiScore: number | null = null;
  let recommendation: string | null = null;
  let missingSkills: string[] = [];

  const interviewList = results
    .filter((r) => r.tool === "searchInterviews")
    .flatMap((r) =>
      r.tool === "searchInterviews" && Array.isArray(r.interviews)
        ? r.interviews
        : []
    );
  if (interviewList.length) {
    const hit =
      (focus
        ? interviewList.find((i) => matchesName(i.candidateName, focus))
        : undefined) ?? interviewList[0];
    if (hit) {
      candidateName = hit.candidateName || candidateName;
      jobTitle = hit.jobTitle || jobTitle;
      interviewDate = hit.interviewDate || null;
      interviewTime = hit.interviewTime || null;
      interviewerName = hit.interviewerName || null;
      hrName = hit.interviewerName || null;
      sources.push("interviews");
    }
  }

  if (apps && "applications" in apps && Array.isArray(apps.applications)) {
    const list = apps.applications;
    const hit =
      (focus
        ? list.find((a) => matchesName(a.fullName, focus))
        : undefined) ?? list[0];
    if (hit) {
      candidateName = candidateName || hit.fullName || null;
      jobTitle = jobTitle || hit.jobTitle || null;
      sources.push("applications");
    }
  }

  if (
    candidates &&
    "candidates" in candidates &&
    Array.isArray(candidates.candidates)
  ) {
    const list = candidates.candidates;
    const hit =
      (focus
        ? list.find((c) => matchesName(c.fullName, focus))
        : undefined) ?? list[0];
    if (hit?.fullName) {
      candidateName = candidateName || hit.fullName;
      sources.push("candidate_profiles");
    }
  }

  if (profile && "profiles" in profile && Array.isArray(profile.profiles)) {
    const list = profile.profiles as Array<{ fullName?: string }>;
    const hit =
      (focus
        ? list.find((p) => matchesName(p.fullName, focus))
        : undefined) ?? list[0];
    if (hit?.fullName) {
      candidateName = candidateName || hit.fullName;
      sources.push("candidate_profiles");
    }
  }

  if (jobs && "jobs" in jobs && Array.isArray(jobs.jobs) && jobs.jobs[0]) {
    jobTitle = jobTitle || jobs.jobs[0].title || null;
    sources.push("jobs");
  }

  if (analysis && "analyses" in analysis && Array.isArray(analysis.analyses)) {
    const list = analysis.analyses as Array<{
      candidateName?: string | null;
      jobTitle?: string | null;
      overallScore?: number | null;
      score?: number | null;
      recommendationLabel?: string | null;
      recommendation?: string | null;
      missingSkills?: string[];
    }>;
    const hit =
      (focus
        ? list.find((a) => matchesName(a.candidateName, focus))
        : undefined) ?? list[0];
    if (hit) {
      candidateName = candidateName || hit.candidateName || null;
      jobTitle = jobTitle || hit.jobTitle || null;
      const score = Number(hit.overallScore ?? hit.score);
      aiScore = Number.isFinite(score) ? score : null;
      recommendation = hit.recommendationLabel || hit.recommendation || null;
      missingSkills = hit.missingSkills ?? [];
      sources.push("ai_resume_analysis");
    }
  }

  if (ranking && "rankings" in ranking && Array.isArray(ranking.rankings)) {
    const list = ranking.rankings;
    const hit =
      (focus
        ? list.find((r) => matchesName(r.candidateName, focus))
        : undefined) ?? list[0];
    if (hit) {
      candidateName = candidateName || hit.candidateName || null;
      jobTitle = jobTitle || hit.jobTitle || null;
      if (aiScore == null) {
        const score = Number(hit.score);
        aiScore = Number.isFinite(score) ? score : null;
      }
      sources.push("ai_candidate_ranking");
    }
  }

  if (
    emailTool &&
    emailTool.tool === "generateAgentEmail" &&
    emailTool.context
  ) {
    candidateName = candidateName || emailTool.context.candidateName;
    jobTitle = jobTitle || emailTool.context.jobTitle;
    interviewDate = interviewDate || emailTool.context.interviewDate;
    interviewTime = interviewTime || emailTool.context.interviewTime;
    hrName = hrName || emailTool.context.hrName;
    interviewerName = interviewerName || emailTool.context.hrName;
  }

  return {
    candidateName,
    jobTitle,
    interviewDate,
    interviewTime,
    companyName:
      (emailTool &&
      emailTool.tool === "generateAgentEmail" &&
      emailTool.context.companyName) ||
      companyFromEnv(),
    hrName,
    interviewerName,
    aiScore,
    recommendation,
    missingSkills,
    sources: [...new Set(sources)],
  };
}

function missingFields(
  type: CommunicationEmailType,
  ctx: LiveCommContext
): string[] {
  const missing: string[] = [];
  if (!ctx.candidateName) {
    missing.push("Candidate Name (from `applications` / `candidate_profiles`)");
  }
  if (!ctx.jobTitle) {
    missing.push("Job Title (from `jobs` / `applications`)");
  }
  const needsInterview = [
    "interview_invitation",
    "interview_reminder",
    "interview_reschedule",
    "interview_cancellation",
    "interview_confirmation",
  ].includes(type);
  if (needsInterview && !ctx.interviewDate) {
    missing.push("Interview Date (from `interviews.interview_date`)");
  }
  if (needsInterview && !ctx.interviewTime) {
    missing.push("Interview Time (from `interviews.interview_time`)");
  }
  if (!ctx.hrName && !ctx.interviewerName) {
    missing.push("HR Name (from `interviews.interviewer_name`)");
  }
  if (!ctx.companyName) {
    missing.push("Company Name (APP_NAME / env)");
  }
  return missing;
}

function applyTone(
  tone: CommunicationTone,
  paragraphs: string[]
): string {
  if (tone === "short") {
    return paragraphs.slice(0, 2).join("\n\n");
  }
  if (tone === "detailed") {
    return paragraphs.join("\n\n");
  }
  if (tone === "friendly") {
    return paragraphs
      .map((p, i) => (i === 0 ? p.replace(/^Dear/, "Hi") : p))
      .join("\n\n");
  }
  if (tone === "formal") {
    return paragraphs
      .map((p) =>
        p
          .replace(/^Hi\b/, "Dear")
          .replace(/\bThanks\b/g, "Thank you")
          .replace(/\bBest regards\b/g, "Yours sincerely")
      )
      .join("\n\n");
  }
  return paragraphs.join("\n\n");
}

function signOff(ctx: LiveCommContext, tone: CommunicationTone): string {
  const name = ctx.hrName || ctx.interviewerName || "HR Team";
  if (tone === "formal") {
    return `Yours sincerely,\n${name}\n${ctx.companyName}`;
  }
  if (tone === "friendly") {
    return `Warm regards,\n${name}\n${ctx.companyName}`;
  }
  return `Best regards,\n${name}\n${ctx.companyName}`;
}

type DraftParts = {
  subject: string;
  paragraphs: string[];
  cta: string;
  templateId: string;
};

function buildTemplates(
  type: CommunicationEmailType,
  ctx: LiveCommContext
): DraftParts[] {
  const name = ctx.candidateName || "[Candidate Name missing]";
  const job = ctx.jobTitle || "[Job Title missing]";
  const date = ctx.interviewDate || "[Interview Date missing]";
  const time = ctx.interviewTime || "[Interview Time missing]";
  const company = ctx.companyName;
  const greeting = `Dear ${name},`;

  switch (type) {
    case "interview_invitation":
      return [
        {
          templateId: "invite_standard",
          subject: `Interview Invitation — ${job} at ${company}`,
          paragraphs: [
            greeting,
            `Thank you for applying for the ${job} role at ${company}. We would like to invite you to an interview.`,
            `Interview date: ${date}\nInterview time: ${time}`,
            `Please confirm your availability and let us know if you need any adjustments.`,
          ],
          cta: "Please reply to confirm your attendance for this interview.",
        },
        {
          templateId: "invite_prep",
          subject: `You're invited to interview for ${job}`,
          paragraphs: [
            greeting,
            `We were impressed with your application for ${job} and would like to meet you.`,
            `Please join us on ${date} at ${time}.`,
            `Come prepared to discuss your experience and relevant skills for this role.`,
          ],
          cta: "Reply to this email to confirm, or propose an alternative time if needed.",
        },
      ];
    case "interview_reminder":
      return [
        {
          templateId: "reminder_standard",
          subject: `Reminder: Interview for ${job} on ${date}`,
          paragraphs: [
            greeting,
            `This is a friendly reminder about your upcoming interview for the ${job} position at ${company}.`,
            `Date: ${date}\nTime: ${time}`,
            `We look forward to speaking with you.`,
          ],
          cta: "Please reply if you need to reschedule or have any questions before the interview.",
        },
      ];
    case "interview_reschedule":
      return [
        {
          templateId: "reschedule_standard",
          subject: `Interview Reschedule — ${job}`,
          paragraphs: [
            greeting,
            `We need to reschedule your interview for the ${job} role at ${company}.`,
            `Proposed new date: ${date}\nProposed new time: ${time}`,
            `We apologize for any inconvenience and appreciate your flexibility.`,
          ],
          cta: "Please reply to confirm the new interview slot or suggest another time.",
        },
      ];
    case "interview_cancellation":
      return [
        {
          templateId: "cancel_standard",
          subject: `Interview Cancelled — ${job}`,
          paragraphs: [
            greeting,
            `We are writing to let you know that your interview for the ${job} role at ${company}${ctx.interviewDate ? ` scheduled for ${date}` : ""} has been cancelled.`,
            `We will contact you if a new opportunity to reconnect becomes available.`,
          ],
          cta: "No action is required unless you would like to stay in touch about future openings.",
        },
      ];
    case "interview_confirmation":
      return [
        {
          templateId: "confirm_standard",
          subject: `Interview Confirmed — ${job} on ${date}`,
          paragraphs: [
            greeting,
            `Your interview for the ${job} role at ${company} is confirmed.`,
            `Date: ${date}\nTime: ${time}`,
            `We look forward to meeting you.`,
          ],
          cta: "Please reply only if your availability changes before the interview.",
        },
      ];
    case "rejection":
      return [
        {
          templateId: "reject_empathetic",
          subject: `Update on your application for ${job}`,
          paragraphs: [
            greeting,
            `Thank you for your interest in the ${job} position at ${company} and for the time you invested in our process.`,
            `After careful review, we have decided not to move forward with your application at this time.`,
            `We appreciate your interest and encourage you to apply for future roles that match your experience.`,
          ],
          cta: "You are welcome to apply again for future openings at our company.",
        },
        {
          templateId: "reject_brief",
          subject: `Application update — ${job}`,
          paragraphs: [
            greeting,
            `Thank you for applying for ${job} at ${company}. We will not be progressing your application further on this occasion.`,
            `We wish you every success in your job search.`,
          ],
          cta: "No further action is required on your side.",
        },
      ];
    case "offer_letter":
      return [
        {
          templateId: "offer_standard",
          subject: `Offer of Employment — ${job} at ${company}`,
          paragraphs: [
            greeting,
            `We are delighted to offer you the ${job} position at ${company}.`,
            `Please review the offer details shared by HR and let us know if you have any questions.`,
            `We are excited about the possibility of you joining the team.`,
          ],
          cta: "Please reply to accept or discuss the offer details with HR.",
        },
      ];
    case "follow_up":
      return [
        {
          templateId: "followup_standard",
          subject: `Following up — ${job} application`,
          paragraphs: [
            greeting,
            `I am following up regarding your application for the ${job} role at ${company}.`,
            `Please let us know if you have any questions or updated availability.`,
          ],
          cta: "Reply to this email with any updates or questions.",
        },
      ];
    case "salary_negotiation":
      return [
        {
          templateId: "salary_standard",
          subject: `Regarding compensation for ${job}`,
          paragraphs: [
            greeting,
            `Thank you for your continued interest in the ${job} role at ${company}.`,
            `We would like to discuss compensation expectations and find a fair alignment for both sides.`,
            `Please share your preferred salary range and any constraints we should consider.`,
          ],
          cta: "Reply with your compensation expectations so we can continue the conversation.",
        },
      ];
    case "onboarding":
      return [
        {
          templateId: "onboarding_standard",
          subject: `Welcome to ${company} — onboarding for ${job}`,
          paragraphs: [
            greeting,
            `Welcome to ${company}! We are looking forward to having you join us as ${job}.`,
            `Our HR team will share onboarding steps, required documents, and your first-day details shortly.`,
          ],
          cta: "Please complete any outstanding onboarding forms and reply once your documents are ready.",
        },
      ];
    case "thank_you":
      return [
        {
          templateId: "thanks_standard",
          subject: `Thank you — ${job} at ${company}`,
          paragraphs: [
            greeting,
            `Thank you for taking the time to speak with us about the ${job} opportunity at ${company}.`,
            `We appreciated learning more about your background and experience.`,
          ],
          cta: "No action is required; we will be in touch with next steps.",
        },
      ];
    case "missing_documents":
      return [
        {
          templateId: "docs_standard",
          subject: `Documents needed for your ${job} application`,
          paragraphs: [
            greeting,
            `To continue reviewing your application for ${job} at ${company}, we still need some documents from you.`,
            ctx.missingSkills.length
              ? `Also note from our review that the following skills were flagged as gaps to discuss later: ${ctx.missingSkills.slice(0, 3).join(", ")}.`
              : `Please upload or email the outstanding documents at your earliest convenience.`,
          ],
          cta: "Please send the missing documents as soon as possible so we can proceed.",
        },
      ];
    default:
      return [
        {
          templateId: "general_standard",
          subject: `Update from ${company} — ${job}`,
          paragraphs: [
            greeting,
            `We are writing regarding your application for the ${job} role at ${company}.`,
            `Please reply if you have any questions.`,
          ],
          cta: "Reply to this email with any questions or updates.",
        },
      ];
  }
}

function pickTemplate(
  templates: DraftParts[],
  tone: CommunicationTone
): DraftParts {
  if (tone === "short" && templates.length > 1) {
    return templates[templates.length - 1]!;
  }
  return templates[0]!;
}

/**
 * Format Communication Assistant answer from live tool results.
 */
export function formatCommunicationAssistantReport(
  message: string,
  results: CopilotToolResult[]
): string | null {
  if (!isCommunicationAssistantQuestion(message)) return null;

  const type = detectCommunicationEmailType(message);
  const tone = detectCommunicationTone(message);
  const ctx = buildLiveContext(message, results);
  const missing = missingFields(type, ctx);

  // Hard stop if we have no candidate identity at all.
  if (!ctx.candidateName && !ctx.jobTitle && ctx.sources.length === 0) {
    return [
      "## Recruitment Communication Assistant",
      "",
      "I can’t draft this email because no live records were found.",
      "• Missing rows from `applications`, `candidate_profiles`, `jobs`, and/or `interviews`.",
      "• Optional enrichment tables: `ai_resume_analysis`, `ai_candidate_ranking`.",
      "",
      "Name the candidate (for example: “Write interview invitation email for basitnayab6975”) and retry.",
    ].join("\n");
  }

  const templates = buildTemplates(type, ctx);
  const chosen = pickTemplate(templates, tone);
  const bodyCore = applyTone(tone, [...chosen.paragraphs, chosen.cta]);
  const body = `${bodyCore}\n\n${signOff(ctx, tone)}`;

  const lines = [
    "## Recruitment Communication Assistant",
    "",
    `**Template:** ${TYPE_LABELS[type]} (\`${chosen.templateId}\`)`,
    `**Tone:** ${tone}`,
    "",
    "### Live context used",
    `• Candidate Name: ${ctx.candidateName ?? "—"}`,
    `• Job Title: ${ctx.jobTitle ?? "—"}`,
    `• Interview Date: ${ctx.interviewDate ?? "—"}`,
    `• Interview Time: ${ctx.interviewTime ?? "—"}`,
    `• Company Name: ${ctx.companyName}`,
    `• HR Name: ${ctx.hrName || ctx.interviewerName || "—"}`,
    ctx.aiScore != null
      ? `• AI score (context only): ${ctx.aiScore}/100${ctx.recommendation ? ` · ${ctx.recommendation}` : ""}`
      : null,
    `• Sources: ${ctx.sources.length ? ctx.sources.map((s) => `\`${s}\``).join(", ") : "none"}`,
    "",
    "### Subject",
    chosen.subject,
    "",
    "### Email Body",
    body,
    "",
    "### Call to Action",
    chosen.cta,
  ].filter((x): x is string => x != null);

  if (templates.length > 1) {
    lines.push("", "### Alternate templates available");
    for (const t of templates) {
      if (t.templateId === chosen.templateId) continue;
      lines.push(`• **${t.templateId}** — Subject: ${t.subject}`);
    }
  }

  if (missing.length) {
    lines.push("", "### Missing fields (not invented)");
    lines.push(...missing.map((m) => `• ${m}`));
    lines.push(
      "",
      "Placeholders in the draft mark unavailable live values — fill them before sending."
    );
  }

  // Surface Groq draft if present (optional enrichment), without overriding live facts.
  const emailTool = results.find((r) => r.tool === "generateAgentEmail");
  if (
    emailTool &&
    emailTool.tool === "generateAgentEmail" &&
    emailTool.draft?.subject &&
    emailTool.draft?.body
  ) {
    lines.push(
      "",
      "### Optional AI-polished variant (Groq)",
      `**Subject:** ${emailTool.draft.subject}`,
      "",
      emailTool.draft.body
    );
  }

  return lines.join("\n");
}
