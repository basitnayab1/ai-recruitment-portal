/**
 * Generates Project_Documentation.pdf and Project_Presentation.pptx
 * from factual inventory of this repository. Run: node scripts/generate-project-docs.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import PptxGenJS from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PDF = path.join(ROOT, "Project_Documentation.pdf");
const OUT_PPTX = path.join(ROOT, "Project_Presentation.pptx");

const NAVY = "#0F172A";
const SLATE = "#334155";
const ACCENT = "#1D4ED8";
const MUTED = "#64748B";
const LIGHT = "#F8FAFC";
const LINE = "#E2E8F0";

const DATE = "2 August 2026";
const AUTHOR = "Abdul Basit";
const PROJECT = "AI Recruitment Portal";
const SUBTITLE = "AI-Powered Careers & Recruitment Platform";
const REPO = "https://github.com/basitnayab1/ai-recruitment-portal";

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/* =============================================================================
 * PDF
 * ========================================================================== */

async function buildPdf() {
  ensureDir(OUT_PDF);
  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: { top: 54, bottom: 56, left: 54, right: 54 },
    info: {
      Title: `${PROJECT} — Software Design Document`,
      Author: AUTHOR,
      Subject: "Technical assignment documentation",
      Creator: AUTHOR,
    },
  });
  const stream = fs.createWriteStream(OUT_PDF);
  doc.pipe(stream);

  const tocEntries = [];

  function newPage() {
    doc.addPage();
  }

  function cover() {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);
    doc.rect(0, 0, 18, doc.page.height).fill(ACCENT);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(28);
    doc.text(PROJECT, 64, 200, { width: 460 });
    doc.font("Helvetica").fontSize(14).fillColor("#CBD5E1");
    doc.text(SUBTITLE, 64, 250, { width: 460 });
    doc.moveTo(64, 290).lineTo(220, 290).strokeColor(ACCENT).lineWidth(2).stroke();
    doc.fontSize(11).fillColor("#E2E8F0");
    doc.text("Software Design Document (SDD)", 64, 320);
    doc.text("Technical Assignment Submission", 64, 340);
    doc.fontSize(11).fillColor("#94A3B8");
    doc.text(`Prepared by: ${AUTHOR}`, 64, 420);
    doc.text(`Date: ${DATE}`, 64, 440);
    doc.text(`Repository: ${REPO}`, 64, 460, { width: 460, link: REPO });
    doc.fontSize(9).fillColor("#64748B");
    doc.text("Based solely on the implemented codebase (Next.js · Supabase · Groq).", 64, 720, {
      width: 460,
    });
  }

  function sectionTitle(title, level = 1) {
    if (doc.y > doc.page.height - 100) newPage();
    if (level === 1) {
      tocEntries.push({ title });
      if (doc.y > 70) doc.moveDown(0.45);
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(14).text(title, { width: 490 });
      doc.moveTo(doc.page.margins.left, doc.y + 3)
        .lineTo(doc.page.margins.left + 64, doc.y + 3)
        .strokeColor(ACCENT)
        .lineWidth(1.5)
        .stroke();
      doc.moveDown(0.5);
    } else {
      doc.moveDown(0.3);
      doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(11).text(title, { width: 490 });
      doc.moveDown(0.22);
    }
  }

  function body(text) {
    doc.fillColor(SLATE).font("Helvetica").fontSize(9.5).text(text, {
      width: 490,
      align: "justify",
      lineGap: 1.5,
    });
    doc.moveDown(0.3);
  }

  function bullets(items) {
    doc.fillColor(SLATE).font("Helvetica").fontSize(9.5);
    for (const item of items) {
      if (doc.y > doc.page.height - 72) newPage();
      doc.text(`•  ${item}`, { width: 490, indent: 6, lineGap: 1.2 });
    }
    doc.moveDown(0.25);
  }

  function mono(text) {
    if (doc.y > doc.page.height - 100) newPage();
    const h = Math.min(220, 14 + text.split("\n").length * 11);
    doc.roundedRect(doc.page.margins.left, doc.y, 480, h, 4).fill(LIGHT);
    doc.fillColor(NAVY).font("Courier").fontSize(8).text(text, doc.page.margins.left + 10, doc.y + 8, {
      width: 460,
      lineGap: 1,
    });
    doc.y += h + 8;
    doc.moveDown(0.2);
  }

  function table(headers, rows) {
    const colW = 480 / headers.length;
    const startX = doc.page.margins.left;
    if (doc.y > doc.page.height - 100) newPage();
    let y = doc.y;
    doc.rect(startX, y, 480, 18).fill(NAVY);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
    headers.forEach((h, i) => doc.text(h, startX + 4 + i * colW, y + 5, { width: colW - 8 }));
    y += 18;
    rows.forEach((row, idx) => {
      if (y > doc.page.height - 70) {
        newPage();
        y = doc.y;
        doc.rect(startX, y, 480, 18).fill(NAVY);
        doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
        headers.forEach((h, i) => doc.text(h, startX + 4 + i * colW, y + 5, { width: colW - 8 }));
        y += 18;
      }
      const bg = idx % 2 === 0 ? "#FFFFFF" : LIGHT;
      doc.rect(startX, y, 480, 28).fill(bg).strokeColor(LINE).stroke();
      doc.fillColor(SLATE).font("Helvetica").fontSize(8);
      row.forEach((cell, i) =>
        doc.text(String(cell), startX + 4 + i * colW, y + 6, { width: colW - 8, height: 20 })
      );
      y += 28;
    });
    doc.y = y + 8;
  }

  function drawArchDiagram() {
    if (doc.y > doc.page.height - 220) newPage();
    const x = doc.page.margins.left;
    let y = doc.y + 6;
    const boxes = [
      "Browser (Candidate / HR / Public)",
      "Next.js App Router (React Server Components)",
      "Server Actions + DAL (requireHRUser / requireCandidateUser)",
      "Supabase Auth · PostgreSQL · RLS · Storage",
      "Groq AI (server-only)  ·  Resend Email",
    ];
    boxes.forEach((label, i) => {
      doc.roundedRect(x + 40, y, 400, 28, 4).fill(i === 0 || i === 3 ? NAVY : LIGHT).strokeColor(ACCENT).lineWidth(1).stroke();
      doc.fillColor(i === 0 || i === 3 ? "#FFFFFF" : NAVY)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(label, x + 50, y + 9, { width: 380, align: "center" });
      y += 28;
      if (i < boxes.length - 1) {
        doc.fillColor(ACCENT).font("Helvetica").fontSize(10).text("↓", x + 230, y + 1, { width: 20, align: "center" });
        y += 14;
      }
    });
    doc.y = y + 12;
  }

  function drawFlow(steps) {
    if (doc.y > doc.page.height - 40 - steps.length * 22) newPage();
    const x = doc.page.margins.left + 20;
    steps.forEach((step, i) => {
      doc.roundedRect(x, doc.y, 440, 20, 3).fill(LIGHT).strokeColor(LINE).stroke();
      doc.fillColor(NAVY).font("Helvetica").fontSize(9).text(`${i + 1}.  ${step}`, x + 8, doc.y + 5, {
        width: 420,
      });
      doc.y += 20;
      if (i < steps.length - 1) {
        doc.fillColor(ACCENT).text("↓", x + 210, doc.y, { width: 20, align: "center" });
        doc.y += 12;
      }
    });
    doc.moveDown(0.5);
  }

  // ---- Content ----
  cover();

  // TOC
  newPage();
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(14).text("Table of Contents");
  doc.moveDown(0.6);
  const tocPreview = [
    "1. Executive Summary",
    "2. Project Overview",
    "3. Technology Stack",
    "4. System Architecture",
    "5. Folder Structure",
    "6. Database Design",
    "7. Authentication Flow",
    "8. Candidate Workflow",
    "9. HR Workflow",
    "10. AI Module",
    "11. Security",
    "12. API & Backend (Server Actions)",
    "13. UI / UX",
    "14. Deployment",
    "15. Challenges Faced",
    "16. Future Improvements",
    "17. Conclusion",
    "18. Appendix",
  ];
  doc.fillColor(SLATE).font("Helvetica").fontSize(11);
  tocPreview.forEach((t) => {
    doc.text(t, { width: 480 });
    doc.moveDown(0.25);
  });
  body(
    "This document describes only features present in the repository. Items not implemented are listed under Future Improvements."
  );

  // Continue on same page after TOC when space allows
  if (doc.y > doc.page.height - 200) newPage();
  sectionTitle("1. Executive Summary");
  body(
    "AI Recruitment Portal is a full-stack careers and hiring platform that connects job seekers with HR teams through a structured applicant tracking workflow, private document storage, and Groq-powered AI assistance."
  );
  sectionTitle("Business Problem", 2);
  bullets([
    "Manual résumé screening is slow and inconsistent across recruiters.",
    "Candidates lack a single place to manage profile, résumé, and application status.",
    "HR needs job publishing, pipeline control, interviews, and auditability in one system.",
    "AI features must remain server-side so API keys and privileged database access never reach the browser.",
  ]);
  sectionTitle("Solution", 2);
  body(
    "The solution provides a public careers site, an authenticated Candidate Portal, and an authenticated HR Dashboard on Next.js 16 with Supabase Auth/Postgres/Storage. AI capabilities (résumé analysis, ranking, interview questions, job description and email drafting, HR Copilot) run exclusively through server-only Groq modules invoked by Server Actions."
  );
  sectionTitle("Goals", 2);
  bullets([
    "Separate candidate and HR identities with independent DAL checks and RLS.",
    "Support end-to-end hiring: publish jobs → apply → analyze → shortlist → interview → decide.",
    "Ground AI outputs in job and résumé context with structured JSON schemas.",
    "Deploy as a standard Vercel + Supabase + Groq stack with documented environment variables.",
  ]);

  if (doc.y > doc.page.height - 180) newPage();
  sectionTitle("2. Project Overview");
  sectionTitle("Candidate Portal", 2);
  bullets([
    "Signup, login, logout, forgot/reset password, and change password (re-authentication).",
    "Profile (personal + professional details, skills, completion meter) and profile pictures.",
    "Résumé upload/delete to private Storage bucket `resumes`.",
    "Browse published jobs, apply with gates (auth, profile completion, résumé present).",
    "Track applications, interviews, and in-app notifications.",
  ]);
  sectionTitle("HR Portal", 2);
  bullets([
    "HR/admin login only (accounts provisioned via `npm run create-hr-user`, not public signup).",
    "Jobs CRUD, publish/close; applications pipeline with notes and status history.",
    "Candidates directory, interviews, analytics dashboard, activity (audit) log, CSV reports.",
    "AI panels: résumé analysis, ranking, interview assistant, email assistant; floating HR Copilot.",
    "Settings: account summary + Security (change password).",
  ]);
  sectionTitle("AI Module", 2);
  body(
    "Implemented under `src/lib/ai/` with Groq SDK. Persistence uses `ai_resume_analysis`, `ai_interview_questions`, and `ai_candidate_ranking`. Skill gaps appear as `missingSkills` on résumé analysis and via the deterministic Copilot tool `analyzeSkillGaps` (no separate Groq skill-gap product)."
  );
  sectionTitle("Authentication", 2);
  body(
    "Supabase Auth with `@supabase/ssr` cookie sessions. HR uses `profiles`; candidates use `candidate_profiles`. Middleware refreshes sessions; DALs enforce roles. Email confirmation and password recovery land on `/auth/confirm` (PKCE code exchange)."
  );
  sectionTitle("Deployment", 2);
  body(
    "Designed for GitHub → Vercel, with Supabase as data/auth/storage and Groq for AI. See Deployment and Appendix for commands and environment variables from `.env.example`."
  );

  if (doc.y > doc.page.height - 180) newPage();
  sectionTitle("3. Technology Stack");
  table(
    ["Technology", "Role in this project", "Why it fits"],
    [
      ["Next.js 16", "App Router, RSC, Server Actions", "Server-first UI + secure mutations"],
      ["React 19", "UI components", "Component model for portals & Copilot"],
      ["TypeScript", "Type safety across app/lib", "Safer contracts for AI JSON & forms"],
      ["Tailwind CSS 4", "Design system / dark UI", "Consistent HR & candidate styling"],
      ["Supabase", "Auth, Postgres, Storage, RLS", "Managed backend with security model"],
      ["PostgreSQL", "System of record", "Relational hiring data + migrations"],
      ["Groq AI", "LLM inference", "Low-latency server-side analysis"],
      ["Resend", "Transactional email", "Notifications & HR email send"],
      ["Vercel", "Hosting target", "Native Next.js deploy path"],
      ["GitHub", "Source control", "Collaboration & CI-friendly repo"],
    ]
  );
  body(
    "Supporting libraries in use include Framer Motion, Radix UI, sharp (image processing), unpdf/mammoth (résumé text), react-markdown/remark-gfm/react-syntax-highlighter (Copilot Markdown), and sonner (toasts)."
  );

  if (doc.y > doc.page.height - 200) newPage();
  sectionTitle("4. System Architecture");
  body("Request path as implemented:");
  drawArchDiagram();
  sectionTitle("Layer responsibilities", 2);
  bullets([
    "Browser: Candidate, HR, and public pages; no Groq or service-role keys.",
    "Next.js: Server Components for data loading; Client Components for interactive forms/widgets.",
    "Server Actions: Authenticated mutations and AI orchestration (`\"use server\"` modules under `src/lib`).",
    "DAL: `requireHRUser` / `requireCandidateUser` re-check roles from DB, not JWT claims alone.",
    "Supabase: Auth sessions, Postgres with RLS, private Storage for résumés and profile pictures.",
    "Groq: Invoked only from server-only modules (`src/lib/ai/groq.ts`, `import \"server-only\"`).",
    "Resend: Outbound email when `RESEND_API_KEY` and `EMAIL_FROM` are configured.",
  ]);
  mono(`Browser
  → Next.js (App Router)
    → Server Actions / Route Handlers
      → Supabase Auth + PostgreSQL (RLS) + Storage
      → Groq AI (GROQ_API_KEY)
      → Resend (optional notifications)`);

  if (doc.y > doc.page.height - 180) newPage();
  sectionTitle("5. Folder Structure");
  mono(`ai-recruitment-portal/
├── src/app/                 # Next.js routes (public, candidate, HR, auth)
├── src/components/          # UI: landing, candidate, HR, atmosphere, copilot
├── src/lib/                 # Server logic: ai, auth, hr, candidate, security
├── src/hooks/               # Client hooks (e.g. has-mounted)
├── supabase/migrations/     # SQL schema 001–031
├── scripts/                 # create-hr-user, audits, doc generators
├── docs/                    # create-hr-user guide
├── public/                  # Static assets
├── .env.example             # Placeholder env template
└── package.json`);
  bullets([
    "`src/app` — Route groups `(protected)` for authenticated shells; public `/jobs`, `/auth/confirm`.",
    "`src/components` — Presentation only; AI and DB stay in `src/lib`.",
    "`src/lib/ai` — Groq pipelines, Copilot planner/tools, prompts.",
    "`src/lib/hr` & `src/lib/candidate` — Domain actions and data loaders.",
    "`supabase/migrations` — Source of truth for schema and RLS evolution.",
  ]);

  newPage();
  sectionTitle("6. Database Design");
  body(
    "Schema is defined in ordered SQL migrations (`supabase/migrations/001` through `031`). Below is the implemented relational model."
  );
  sectionTitle("Enums", 2);
  bullets([
    "user_role: hr | admin",
    "job_status: draft | published | closed",
    "job_employment_type: full_time | part_time | contract | internship | temporary",
    "application_status: new → ai_shortlisted → hr_review → interview → hold | rejected | selected → hired",
    "skill_proficiency, ai_recommendation, interview_type, interview_status",
  ]);
  sectionTitle("Core tables", 2);
  table(
    ["Table", "Purpose", "Key relationships"],
    [
      ["profiles", "HR/admin staff", "id → auth.users"],
      ["candidate_profiles", "Candidate identity", "id → auth.users"],
      ["candidate_profile_details", "Extended profile + skills[]", "candidate_id → candidate_profiles"],
      ["candidate_resumes", "Résumé metadata", "1:1 candidate"],
      ["candidate_profile_pictures", "Avatar metadata", "1:1 candidate"],
      ["jobs", "Job postings", "created_by → profiles"],
      ["applications", "Applications", "job_id, candidate_id"],
      ["education / skills", "Per-application records", "application_id → applications"],
      ["application_notes", "HR notes", "application_id, author_id"],
      ["application_status_history", "Status audit trail", "trigger-written"],
      ["interviews", "Interview logistics", "application, candidate, job"],
      ["notifications", "In-app alerts", "user_id + role scope"],
      ["audit_logs", "Activity log", "actor_id → auth.users"],
      ["job_ai_criteria", "Weighted criteria", "job_id → jobs"],
      ["ai_evaluations", "Legacy screening scores", "application_id"],
      ["ai_resume_analysis", "Cached Groq analysis", "candidate + application"],
      ["ai_interview_questions", "Cached questions JSON", "unique application"],
      ["ai_candidate_ranking", "Per-job ranks", "job_id + candidate_id"],
    ]
  );

  newPage();
  sectionTitle("Entity relationship (logical)", 2);
  mono(`auth.users
  ├── profiles (HR/admin)
  │     └── jobs.created_by
  └── candidate_profiles
        ├── candidate_profile_details
        ├── candidate_resumes  →  Storage: resumes/
        ├── candidate_profile_pictures → Storage: profile-pictures/
        └── applications.candidate_id
              ├── education, skills
              ├── application_notes, status_history
              ├── interviews
              ├── ai_evaluations
              ├── ai_resume_analysis
              └── ai_interview_questions
jobs ──< applications
jobs ──< ai_candidate_ranking
jobs ── job_ai_criteria`);
  sectionTitle("Storage", 2);
  bullets([
    "Bucket `resumes` (private): candidate folder `${auth.uid()}/…`; HR can SELECT.",
    "Bucket `profile-pictures` (private): same pattern; HR can SELECT.",
  ]);
  sectionTitle("Security-related migrations (selected)", 2);
  bullets([
    "028 — Removes candidate UPDATE that allowed status escalation; privilege-escalation trigger.",
    "029 — Portal-scoped notification RLS (candidate vs HR).",
    "031 — Revokes EXECUTE on SECURITY DEFINER trigger function from client roles.",
  ]);

  if (doc.y > doc.page.height - 160) newPage();
  sectionTitle("7. Authentication Flow");
  sectionTitle("Candidate", 2);
  bullets([
    "Signup / login / logout via `src/lib/candidate-auth/actions.ts`.",
    "Forgot password → `resetPasswordForEmail` → `/auth/confirm?next=/candidate/reset-password`.",
    "Reset password page updates password with an active recovery session.",
    "Change password on Profile Security card: re-auth with current password, then `updateUser`.",
    "Password policy shared in `src/lib/auth/password.ts` (8+, upper, lower, number, special).",
  ]);
  sectionTitle("HR", 2);
  bullets([
    "Login checks `profiles` for active hr/admin; unauthorized sessions are signed out.",
    "No public HR signup — provision with `npm run create-hr-user`.",
    "Change password on Settings Security card (same policy + re-auth).",
  ]);
  sectionTitle("Confirm route & middleware", 2);
  bullets([
    "`/auth/confirm` exchanges PKCE `code` (or verifies token_hash) and honors sanitized `next`.",
    "Middleware public candidate paths: login, signup, forgot-password.",
    "Role isolation: HR DAL never reads candidate_profiles for access; candidate DAL never uses profiles for access.",
  ]);

  if (doc.y > doc.page.height - 160) newPage();
  sectionTitle("8. Candidate Workflow");
  drawFlow([
    "Signup / email confirmation (`/auth/confirm`)",
    "Complete profile & skills (completion % for apply gate)",
    "Upload résumé (private Storage)",
    "Browse published jobs (`/jobs`) and apply (`/candidate/apply/[jobId]`)",
    "Track application status (`/candidate/applications`)",
    "View interviews & notifications",
  ]);
  body(
    "Apply gates enforced in code: authenticated candidate, job published/open, not already applied, minimum profile completion, résumé present. Missing pieces redirect to profile or résumé with a `next` return path."
  );

  if (doc.y > doc.page.height - 160) newPage();
  sectionTitle("9. HR Workflow");
  drawFlow([
    "Create job (optional AI job description assist)",
    "Publish job",
    "Receive applications",
    "Run AI résumé analysis / refresh ranking",
    "Update status (e.g. ai_shortlisted → interview)",
    "Schedule interview; generate interview questions / emails",
    "Decide (selected / hired / rejected) with notes & history",
  ]);
  body(
    "HR Copilot (`askHRCopilotAction`) is available on all protected HR pages via the layout-mounted widget and can query pipeline data through server-side tools."
  );

  newPage();
  sectionTitle("10. AI Module");
  body("All Groq calls require `GROQ_API_KEY`. Default model: `llama-3.3-70b-versatile`; lightweight: `llama-3.1-8b-instant`.");
  sectionTitle("Features implemented", 2);
  table(
    ["Feature", "Implementation", "Groq?"],
    [
      ["Résumé analysis", "resume-analyzer.ts + prompts.ts", "Yes"],
      ["Candidate ranking", "candidate-ranking.ts from cached scores", "No"],
      ["Interview questions", "interview-generator.ts", "Yes"],
      ["Job description generator", "job-description-generator.ts", "Yes"],
      ["Email generator", "email-generator.ts + email-prompts.ts", "Yes"],
      ["HR Copilot", "hr-copilot.ts + planner + tools", "Yes"],
      ["Hiring decision tools", "hiring-decision-tools.ts", "No (deterministic)"],
      ["Skill gaps", "missingSkills + analyzeSkillGaps tool", "Part of analysis / tools"],
    ]
  );
  sectionTitle("Résumé analysis prompt (actual)", 2);
  body(
    "System prompt positions the model as a Senior Technical Recruiter and demands JSON only. User prompt requests scores (overall, technical, experience, education, communication, skillMatch), strengths/weaknesses, matchedSkills/missingSkills, recommendation (Strong Hire|Hire|Maybe|No Hire), and confidence. Untrusted résumé text is wrapped via `wrapUntrustedText`."
  );
  sectionTitle("Data / response flow", 2);
  mono(`HR/Candidate UI
  → Server Action (e.g. analyzeCandidateResumeAction)
    → Parse résumé (unpdf / mammoth)
    → Groq chat.completions (JSON schema in prompt)
    → Persist ai_resume_analysis
    → Optional recalculateJobRanking → ai_candidate_ranking
  → UI cards / Copilot formatters`);

  if (doc.y > doc.page.height - 120) newPage();
  sectionTitle("Copilot", 2);
  bullets([
    "Planner (`agent-llm-planner.ts`) selects tools; answer step uses tool JSON only (`system-prompt.ts`).",
    "Tools cover candidates, applications, ranking explainers, hiring recommendations, email draft generation, etc.",
    "Chat UI renders GFM Markdown with syntax highlighting (`copilot-markdown.tsx`).",
  ]);

  if (doc.y > doc.page.height - 160) newPage();
  sectionTitle("11. Security");
  bullets([
    "Row Level Security on recruitment tables; HR helper `private.is_hr_or_admin()`.",
    "Protected routes via middleware + authoritative DAL redirects.",
    "Authentication: Supabase Auth cookies; Authorization: separate HR vs candidate tables.",
    "Input validation on Server Actions (forms, password policy, URL patterns, skills required).",
    "Résumé/PDF handling via controlled upload size/type and private storage paths (not public URLs).",
    "Secrets only in server env (`.env.example` placeholders; never client-bundled Groq/secret keys).",
    "Server Actions as the mutation boundary; rate limits on auth and password flows.",
    "Application privilege-escalation trigger blocks candidates from changing status/job/cv fields.",
    "Security headers in `next.config.ts` (CSP, HSTS, frame denial, etc.).",
    "Trusted site origin for email redirects (`NEXT_PUBLIC_SITE_URL`).",
  ]);

  if (doc.y > doc.page.height - 160) newPage();
  sectionTitle("12. API & Backend (Server Actions)");
  body(
    "The product primarily uses Next.js Server Actions rather than a separate REST surface. Important modules:"
  );
  sectionTitle("Auth", 2);
  bullets([
    "HR: login, logout, changeHRPassword",
    "Candidate: signup, login, logout, changeCandidatePassword, requestCandidatePasswordReset, resetCandidatePassword",
  ]);
  sectionTitle("Candidate domain", 2);
  bullets([
    "applyToJob; updateCandidateProfile / updateCandidateProfileDetails",
    "uploadResume / deleteResume; uploadProfilePicture / deleteProfilePicture",
  ]);
  sectionTitle("HR domain", 2);
  bullets([
    "Jobs: create, update, publish, close",
    "Applications: update status, add notes",
    "Interviews: schedule, update, reschedule, cancel",
    "AI: analyze/reanalyze résumé, refresh ranking, generate/regenerate interview questions, generate job description, generate/send email, askHRCopilot",
    "Export: applications/candidates/interviews CSV",
    "Notifications: mark read / mark all read",
  ]);
  body(
    "Frontend forms bind via `useActionState` or form `action={...}`. Server Actions create a Supabase server client from cookies, enforce DAL checks, then read/write Postgres/Storage or call Groq."
  );
  sectionTitle("Route Handler", 2);
  bullets(["`GET /auth/confirm` — email confirmation / recovery session establishment."]);

  if (doc.y > doc.page.height - 140) newPage();
  sectionTitle("13. UI / UX");
  bullets([
    "Forced dark theme (`html.dark`, background `#06060a`) with zinc/violet glass surfaces.",
    "Fonts: Space Grotesk (UI) and JetBrains Mono (code) via `next/font`.",
    "Landing: hero, stats, featured jobs, why/how, companies, testimonials, FAQ, CTA (`src/components/landing`).",
    "Atmosphere: PremiumShell, mesh atmosphere, cursor spotlight.",
    "Motion primitives under `src/components/react-bits` (Aurora, Spotlight, GridBackground, FadeReveal, etc.).",
    "Responsive layouts for mobile/tablet/desktop; HR Copilot panel adapts width.",
    "Candidate and HR dashboards use shared class tokens from `src/lib/ui/classes.ts` and semantic text tokens.",
  ]);

  if (doc.y > doc.page.height - 160) newPage();
  sectionTitle("14. Deployment");
  drawFlow(["Push to GitHub", "Import/deploy on Vercel", "Configure Supabase (migrations + Auth redirects)", "Set Groq & Resend env vars", "Create first HR user"]);
  sectionTitle("Environment variables (from .env.example)", 2);
  bullets([
    "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY",
    "NEXT_PUBLIC_SITE_URL, APP_NAME",
    "GROQ_API_KEY (+ optional GROQ_LIGHTWEIGHT_MODEL, GROQ_PLANNER_MODEL)",
    "RESEND_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME, HR_NOTIFICATION_EMAIL",
    "Optional COPILOT_DEBUG",
  ]);
  body("Vercel builds assert public Supabase env vars are present (`next.config.ts`). Auth redirect URL must include `{SITE}/auth/confirm`.");

  if (doc.y > doc.page.height - 140) newPage();
  sectionTitle("15. Challenges Faced");
  bullets([
    "Auth confirm originally expected token_hash while Supabase PKCE delivered `code` — route rewritten to exchangeCodeForSession (documented in route comments).",
    "Profile save + redirect caused useActionState “Failed to fetch”; details save now returns state without redirect.",
    "Broken Windows sharp binary crashed the Next process during image optimization; avatars use `unoptimized` and sharp is aligned/hardened.",
    "Server-only Groq boundary: AI modules use `import \"server-only\"` so client bundles cannot import the SDK.",
    "Application RLS: candidate UPDATE policy removed to stop status privilege escalation (migration 028 + trigger).",
    "Build/type issues around Copilot field naming (`fullName` vs incorrect `candidateName`) and Next 16 cache APIs fixed in AI/HR modules.",
    "Hydration-sensitive UI uses mounted checks / theme bootstrap script where needed.",
  ]);

  if (doc.y > doc.page.height - 140) newPage();
  sectionTitle("16. Future Improvements");
  body("Not implemented (or only partially present) today — candidates for roadmap:");
  bullets([
    "Enterprise multi-tenant orgs and finer-grained HR roles/permissions beyond hr|admin.",
    "Broader email productization (templates library, digests) beyond Resend notifications + AI drafts.",
    "Calendar sync (Google/Outlook) for interviews.",
    "Built-in video interview rooms.",
    "Deeper predictive analytics beyond current dashboard charts.",
    "Offer letter generation and e-sign.",
    "Richer audit product UI (audit_logs table exists; expand reporting).",
    "Streaming Copilot tokens end-to-end; generated DB TypeScript types; automated E2E CI.",
  ]);

  if (doc.y > doc.page.height - 120) newPage();
  sectionTitle("17. Conclusion");
  body(
    "AI Recruitment Portal is a production-shaped full-stack system: dual portals, Supabase-backed data with RLS, private file storage, and a Groq AI layer that assists—not replaces—HR decisions. The architecture privileges server-side trust boundaries, explicit migrations, and role isolation suitable for a technical assignment demonstration and further enterprise hardening."
  );
  body(`Prepared by ${AUTHOR} · ${DATE}`);
  body(`Source repository: ${REPO}`);

  // 18 Appendix
  newPage();
  sectionTitle("18. Appendix");
  sectionTitle("A. Useful commands", 2);
  mono(`npm install
cp .env.example .env.local
npm run dev
npm run lint
npm run type-check
npm run build
npm run start
npm run create-hr-user -- --email="hr@example.com" --password="Str0ngPass!" --name="Jane Doe" --role=admin`);
  sectionTitle("B. Apply migrations", 2);
  body(
    "Run SQL files in supabase/migrations/ in numeric order against the target Supabase project (SQL Editor or CLI)."
  );
  sectionTitle("C. Document generation", 2);
  mono(`node scripts/generate-project-docs.mjs
# outputs Project_Documentation.pdf and Project_Presentation.pptx`);

  newPage();
  sectionTitle("Appendix D — Migration Catalog (001–031)");
  body("The following migrations exist in the repository and define the live schema evolution:");
  bullets([
    "001 — Initial schema: profiles, jobs, applications, education, skills, notes, status history, job_ai_criteria, ai_evaluations, enums, RLS baseline",
    "002 — candidate_profiles identity table for authenticated candidates",
    "003 — candidate_profile_details extended profile fields",
    "004 — Candidate job applications linkage + resumes storage bucket",
    "005 — Resume storage RLS hardening",
    "006 — candidate_resumes metadata table",
    "007/008 — notice_period and candidate application schema refinements",
    "009 — HR read access to candidate data",
    "010/011 — candidate_id on applications + candidate applications RLS",
    "012 — Status history trigger (HR-only writes)",
    "013 — ai_evaluations extensions (missing_skills, interview_questions)",
    "014 — HR resume storage RLS",
    "015 — interviews table + interview enums",
    "016/017 — notifications + role isolation",
    "018 — audit_logs",
    "019 — candidate_profile_pictures + profile-pictures bucket",
    "020–022 — is_hr_or_admin helper moved to private schema / policy updates",
    "023 — ai_resume_analysis cache table",
    "024 — ai_interview_questions cache table",
    "025 — ai_candidate_ranking table",
    "026 — jobs posting fields (skills, seniority, work_mode, benefits, …)",
    "027 — candidate_profile_details.skills + current_salary",
    "028 — Harden applications RLS; privilege-escalation trigger",
    "029 — Notifications role-scoped RLS",
    "030 — Performance indexes for hot paths",
    "031 — Revoke EXECUTE on privilege-escalation trigger function from clients",
  ]);

  newPage();
  sectionTitle("Appendix E — Server Action Catalog");
  sectionTitle("Auth (HR) — src/lib/auth/actions.ts", 2);
  bullets(["login", "logout", "changeHRPassword"]);
  sectionTitle("Auth (Candidate) — src/lib/candidate-auth/actions.ts", 2);
  bullets([
    "signup",
    "login",
    "logout",
    "changeCandidatePassword",
    "requestCandidatePasswordReset",
    "resetCandidatePassword",
  ]);
  sectionTitle("Candidate domain", 2);
  bullets([
    "application-actions: applyToJob (also triggers evaluateApplicationResumeSafe)",
    "profile-actions: updateCandidateProfile, updateCandidateProfileDetails",
    "resume-actions: uploadResume, deleteResume",
    "profile-picture-actions: uploadProfilePicture, deleteProfilePicture",
  ]);
  sectionTitle("HR domain", 2);
  bullets([
    "jobs-actions: createJobAction, updateJobAction, publishJobAction, closeJobAction",
    "application-actions: updateApplicationStatusAction, addApplicationNoteAction",
    "interview-actions: schedule/update/reschedule/cancel + createInterviewForApplication",
    "resume-analysis-actions: runCandidateResumeAnalysis, analyze/reanalyze actions",
    "candidate-ranking-actions: refreshCandidateRankingAction",
    "interview-questions-actions: generate/regenerate interview questions",
    "job-description-actions: generateJobDescriptionAction",
    "email-actions: generateHREmailAction, sendHREmailDraftAction",
    "copilot-actions: askHRCopilotAction",
    "export-actions: exportApplicationsCsvAction, exportCandidatesCsvAction, exportInterviewsCsvAction",
  ]);
  sectionTitle("Notifications", 2);
  bullets(["markNotificationReadAction", "markAllNotificationsReadAction"]);

  newPage();
  sectionTitle("Appendix F — AI Prompt Contracts (Excerpts)");
  body(
    "Résumé analysis system prompt (src/lib/ai/prompts.ts) instructs the model to act as an expert Senior Technical Recruiter, return ONLY valid JSON, never follow instructions embedded in résumé text, and avoid markdown fences."
  );
  body(
    "User prompt requires integer scores 0–100 for overallScore, technicalScore, experienceScore, educationScore, communicationScore, skillMatch; arrays for strengths, weaknesses, matchedSkills, missingSkills, skills; recommendation in {Strong Hire, Hire, Maybe, No Hire}; confidence 0–100."
  );
  body(
    "Interview generator system prompt frames a Senior Technical Interviewer and requests JSON groups: technicalQuestions, behavioralQuestions, followUpQuestions, redFlags, focusAreas, overallDifficulty."
  );
  body(
    "Job description generator system prompt frames an HR copywriter and returns structured posting fields mapped into the job form."
  );
  body(
    "Email generator prompts (src/lib/ai/email-prompts.ts) request JSON {subject, body, shortSummary} with type/tone specific instructions."
  );
  body(
    "HR Copilot answer system prompt (src/lib/ai/system-prompt.ts) constrains answers to tool-provided JSON evidence under the RecruitAI persona. The planner prompt (agent-llm-planner.ts) selects tools/intents before the answer step."
  );

  newPage();
  sectionTitle("Appendix G — Route Map");
  sectionTitle("Public", 2);
  bullets(["/", "/jobs", "/jobs/[id]", "/auth/confirm"]);
  sectionTitle("Candidate", 2);
  bullets([
    "/candidate/login, /signup, /forgot-password, /reset-password",
    "/candidate (dashboard), /profile, /resume, /applications, /interviews, /notifications",
    "/candidate/apply/[jobId]",
  ]);
  sectionTitle("HR", 2);
  bullets([
    "/hr/login",
    "/hr (analytics dashboard)",
    "/hr/jobs, /jobs/new, /jobs/[id], /jobs/[id]/edit",
    "/hr/applications, /applications/[id]",
    "/hr/candidates, /candidates/[id]",
    "/hr/interviews, /reports, /activity-log, /notifications, /settings",
  ]);

  newPage();
  sectionTitle("Appendix H — Non-Goals / Explicit Absences");
  body("The following were requested in some product visions but are NOT implemented as first-class features in this codebase:");
  bullets([
    "Public HR self-registration or HR forgot-password UI",
    "Standalone Groq “skill gap product” separate from résumé analysis fields / Copilot tool",
    "Built-in video interview rooms or calendar OAuth sync",
    "Offer-letter e-sign workflow",
    "Multi-tenant organization isolation",
    "Client-side Groq calls (explicitly prevented via server-only)",
  ]);
  body(
    "These absences are intentional scope boundaries for the current assignment deliverable and are listed under Future Improvements where relevant."
  );

  newPage();
  sectionTitle("Appendix I — Architecture Deep Dive");
  body(
    "The application uses the Next.js App Router. Public marketing and jobs pages are server-rendered with data loaders under src/lib/public. Candidate and HR shells live in route groups named (protected) and wrap children with navigation chrome."
  );
  body(
    "Mutations are almost exclusively Server Actions. A client form posts FormData to an action; the action constructs a Supabase server client from cookies (src/lib/supabase/server.ts), calls requireHRUser or requireCandidateUser, validates inputs, then writes through RLS-constrained queries or invokes Groq."
  );
  body(
    "AI ranking intentionally does not call Groq at rank time. resume-evaluation-pipeline persists analysis JSON; recalculateJobRanking / rankCandidates sort and blend cached scores into ai_candidate_ranking rows keyed by job_id + candidate_id."
  );
  body(
    "File uploads write to private buckets. Download/display uses signed URLs generated server-side. Profile pictures are processed with sharp when available; CandidateAvatar sets unoptimized on next/image to avoid optimizer crashes when the native sharp binary is broken."
  );
  sectionTitle("Trust boundaries", 2);
  bullets([
    "Browser: UI only; publishable Supabase key may exist for auth helpers, never GROQ_API_KEY or SUPABASE_SECRET_KEY.",
    "Server Actions / Route Handlers: privileged orchestration.",
    "Postgres RLS: final authorization on row access.",
    "Storage policies: path-scoped to auth.uid() for candidate objects.",
  ]);

  newPage();
  sectionTitle("Appendix J — Testing & Operational Scripts");
  bullets([
    "npm run create-hr-user — provision HR/admin into profiles (docs/create-hr-user.md)",
    "npm run verify-copilot / verify-intent / verify-agent — Copilot tooling checks",
    "npm run test:intent / test:hiring / test:agent-100 — offline/online agent exercises",
    "scripts/security-audit-check.mjs / performance-audit-check.mjs — audit helpers present in repo",
    "scripts/generate-project-docs.mjs — regenerates this PDF and PPTX",
  ]);
  body(
    "These scripts support local verification; they are not required for production runtime of the Next.js app."
  );
  sectionTitle("Document control", 2);
  bullets([
    `Title: ${PROJECT} — Software Design Document`,
    `Author: ${AUTHOR}`,
    `Date: ${DATE}`,
    `Source of truth: repository implementation (not aspirational specs)`,
    `Companion artifacts: Project_Documentation.pdf, Project_Presentation.pptx, README.md, .env.example`,
  ]);

  // Footers on all buffered pages
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(i);
    // Skip heavy footer styling on cover (page 0) beyond page number
    const bottom = doc.page.height - 36;
    doc.save();
    if (i > 0) {
      doc.strokeColor(LINE).lineWidth(0.5).moveTo(54, bottom - 10).lineTo(doc.page.width - 54, bottom - 10).stroke();
      doc.fillColor(MUTED).font("Helvetica").fontSize(8);
      doc.text(PROJECT, 54, bottom - 2, { lineBreak: false });
      doc.text(`Page ${i + 1} of ${range.count}`, 0, bottom - 2, {
        align: "right",
        width: doc.page.width - 54,
      });
    }
    doc.restore();
  }

  doc.end();
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
  console.log("PDF pages written:", range.count);
}

/* =============================================================================
 * PPTX — dark corporate
 * ========================================================================== */

async function buildPptx() {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = AUTHOR;
  pptx.title = `${PROJECT} — Technical Presentation`;

  const bg = "0B1220";
  const card = "111827";
  const blue = "3B82F6";
  const text = "E5E7EB";
  const dim = "94A3B8";

  function addDarkSlide(title) {
    const s = pptx.addSlide();
    s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: bg } });
    s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: blue } });
    if (title) {
      s.addText(title, {
        x: 0.5,
        y: 0.35,
        w: 12,
        h: 0.5,
        fontSize: 24,
        fontFace: "Arial",
        color: "FFFFFF",
        bold: true,
      });
      s.addShape(pptx.shapes.RECTANGLE, {
        x: 0.5,
        y: 0.9,
        w: 1.2,
        h: 0.06,
        fill: { color: blue },
      });
    }
    return s;
  }

  // 1 Title
  {
    const s = pptx.addSlide();
    s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: bg } });
    s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: blue } });
    s.addText(PROJECT, {
      x: 0.8,
      y: 2.2,
      w: 11,
      h: 0.7,
      fontSize: 36,
      fontFace: "Arial",
      color: "FFFFFF",
      bold: true,
    });
    s.addText(SUBTITLE, {
      x: 0.8,
      y: 2.95,
      w: 11,
      h: 0.4,
      fontSize: 18,
      fontFace: "Arial",
      color: dim,
    });
    s.addText(`Prepared by ${AUTHOR}  ·  ${DATE}\nTechnical Assignment Presentation`, {
      x: 0.8,
      y: 5.8,
      w: 10,
      h: 0.7,
      fontSize: 14,
      fontFace: "Arial",
      color: text,
    });
  }

  // 2 Overview
  {
    const s = addDarkSlide("Project Overview");
    const cards = [
      { t: "Candidate Portal", d: "Profile, résumé, apply, track status, interviews, security" },
      { t: "HR Dashboard", d: "Jobs, pipeline, interviews, analytics, exports, Copilot" },
      { t: "AI Module", d: "Analysis, ranking, interviews, JD/email assist, Copilot tools" },
      { t: "Platform", d: "Next.js · Supabase Auth/RLS/Storage · Groq · Vercel" },
    ];
    cards.forEach((c, i) => {
      const x = 0.5 + (i % 2) * 6.3;
      const y = 1.3 + Math.floor(i / 2) * 2.6;
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 5.9,
        h: 2.3,
        fill: { color: card },
        rectRadius: 0.1,
      });
      s.addText(c.t, {
        x: x + 0.3,
        y: y + 0.45,
        w: 5.3,
        h: 0.4,
        fontSize: 18,
        bold: true,
        color: "FFFFFF",
        fontFace: "Arial",
      });
      s.addText(c.d, {
        x: x + 0.3,
        y: y + 1.1,
        w: 5.3,
        h: 0.7,
        fontSize: 14,
        color: dim,
        fontFace: "Arial",
      });
    });
  }

  // 3 Features
  {
    const s = addDarkSlide("Key Features (Implemented)");
    s.addText(
      [
        { text: "Candidate: ", options: { bold: true, color: blue } },
        {
          text: "Auth, profile/skills, résumé, apply gates, applications, interviews, notifications, password security\n",
          options: { color: text },
        },
        { text: "HR: ", options: { bold: true, color: blue } },
        {
          text: "Jobs lifecycle, pipeline & notes, interviews, candidates, analytics, activity log, CSV reports, settings\n",
          options: { color: text },
        },
        { text: "AI: ", options: { bold: true, color: blue } },
        {
          text: "Résumé analysis, ranking, interview Qs, JD generator, email generator, Copilot + hiring tools",
          options: { color: text },
        },
      ],
      { x: 0.6, y: 1.4, w: 12, h: 5, fontSize: 16, fontFace: "Arial", valign: "top" }
    );
  }

  // 4 Architecture
  {
    const s = addDarkSlide("System Architecture");
    const layers = [
      "Browser — Public / Candidate / HR",
      "Next.js App Router — RSC + Client UI",
      "Server Actions + DAL",
      "Supabase — Auth · Postgres · RLS · Storage",
      "Groq AI (server-only)  |  Resend Email",
    ];
    layers.forEach((label, i) => {
      const y = 1.25 + i * 1.05;
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 2.5,
        y,
        w: 8.3,
        h: 0.75,
        fill: { color: i === 0 || i === 3 ? "1E293B" : card },
        rectRadius: 0.08,
      });
      s.addText(label, {
        x: 2.5,
        y: y + 0.18,
        w: 8.3,
        h: 0.4,
        fontSize: 14,
        color: "FFFFFF",
        align: "center",
        fontFace: "Arial",
      });
      if (i < layers.length - 1) {
        s.addText("↓", {
          x: 6.3,
          y: y + 0.7,
          w: 0.5,
          h: 0.3,
          color: blue,
          fontSize: 14,
          align: "center",
        });
      }
    });
  }

  // 5 Stack
  {
    const s = addDarkSlide("Technology Stack");
    const items = [
      ["Next.js 16", "App Router & Server Actions"],
      ["TypeScript", "Typed domain & AI JSON"],
      ["Supabase", "Auth, Postgres, Storage, RLS"],
      ["Groq", "LLM inference"],
      ["Tailwind 4", "Dark glass design system"],
      ["Vercel", "Deployment target"],
    ];
    items.forEach((it, i) => {
      const x = 0.5 + (i % 3) * 4.2;
      const y = 1.5 + Math.floor(i / 3) * 2.5;
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 3.9,
        h: 2.1,
        fill: { color: card },
        rectRadius: 0.1,
      });
      s.addText(it[0], {
        x: x + 0.25,
        y: y + 0.55,
        w: 3.4,
        h: 0.4,
        fontSize: 18,
        bold: true,
        color: "FFFFFF",
        fontFace: "Arial",
      });
      s.addText(it[1], {
        x: x + 0.25,
        y: y + 1.15,
        w: 3.4,
        h: 0.5,
        fontSize: 13,
        color: dim,
        fontFace: "Arial",
      });
    });
  }

  // 6 Database
  {
    const s = addDarkSlide("Database (Supabase Postgres)");
    s.addTable(
      [
        [
          { text: "Domain", options: { bold: true, color: "FFFFFF", fill: { color: "1E3A8A" } } },
          { text: "Tables", options: { bold: true, color: "FFFFFF", fill: { color: "1E3A8A" } } },
        ],
        ["Identity", "profiles · candidate_profiles · details · pictures"],
        ["Hiring", "jobs · applications · education · skills · notes · history"],
        ["Ops", "interviews · notifications · audit_logs"],
        ["AI", "ai_resume_analysis · ai_interview_questions · ai_candidate_ranking · ai_evaluations"],
        ["Storage", "resumes · profile-pictures (private buckets)"],
      ],
      {
        x: 0.5,
        y: 1.3,
        w: 12.3,
        colW: [2.8, 9.5],
        border: [{ pt: 0.5, color: "1F2937" }],
        fontFace: "Arial",
        fontSize: 13,
        color: text,
        fill: { color: card },
        align: "left",
        valign: "middle",
      }
    );
  }

  // 7 Candidate workflow
  {
    const s = addDarkSlide("Candidate Workflow");
    const steps = ["Signup", "Profile", "Résumé", "Apply", "Track", "Interview"];
    steps.forEach((step, i) => {
      const x = 0.45 + i * 2.15;
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 3,
        w: 1.9,
        h: 1.1,
        fill: { color: card },
        rectRadius: 0.1,
      });
      s.addText(step, {
        x,
        y: 3.35,
        w: 1.9,
        h: 0.4,
        align: "center",
        color: "FFFFFF",
        fontSize: 14,
        bold: true,
        fontFace: "Arial",
      });
      if (i < steps.length - 1) {
        s.addText("→", {
          x: x + 1.85,
          y: 3.35,
          w: 0.35,
          h: 0.4,
          color: blue,
          fontSize: 18,
          align: "center",
        });
      }
    });
    s.addText("Apply gates: auth · published job · profile completion · résumé present", {
      x: 0.5,
      y: 5.5,
      w: 12,
      h: 0.4,
      color: dim,
      fontSize: 14,
      fontFace: "Arial",
    });
  }

  // 8 HR workflow
  {
    const s = addDarkSlide("HR Workflow");
    const steps = ["Create Job", "Publish", "Applications", "AI Analyze", "Shortlist", "Interview", "Hire"];
    steps.forEach((step, i) => {
      const x = 0.35 + i * 1.85;
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 3,
        w: 1.7,
        h: 1.2,
        fill: { color: card },
        rectRadius: 0.08,
      });
      s.addText(step, {
        x,
        y: 3.4,
        w: 1.7,
        h: 0.45,
        align: "center",
        color: "FFFFFF",
        fontSize: 12,
        bold: true,
        fontFace: "Arial",
      });
      if (i < steps.length - 1) {
        s.addText("→", {
          x: x + 1.6,
          y: 3.4,
          w: 0.3,
          h: 0.4,
          color: blue,
          fontSize: 16,
        });
      }
    });
  }

  // 9 AI
  {
    const s = addDarkSlide("AI Module (Groq)");
    const ai = [
      ["Résumé Analysis", "Structured scores + strengths/gaps"],
      ["Ranking", "Sort from cached analysis (no LLM)"],
      ["Interview Qs", "Technical / behavioral JSON"],
      ["JD Generator", "Draft posting fields"],
      ["Email Assistant", "Subject + body drafts"],
      ["HR Copilot", "Planner + tools + Markdown UI"],
    ];
    ai.forEach((row, i) => {
      const x = 0.5 + (i % 3) * 4.2;
      const y = 1.4 + Math.floor(i / 3) * 2.6;
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 3.9,
        h: 2.2,
        fill: { color: card },
        rectRadius: 0.1,
      });
      s.addText(row[0], {
        x: x + 0.25,
        y: y + 0.55,
        w: 3.4,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: blue,
        fontFace: "Arial",
      });
      s.addText(row[1], {
        x: x + 0.25,
        y: y + 1.15,
        w: 3.4,
        h: 0.6,
        fontSize: 13,
        color: text,
        fontFace: "Arial",
      });
    });
  }

  // 10 Security
  {
    const s = addDarkSlide("Security");
    const points = [
      "Supabase RLS + private.is_hr_or_admin()",
      "Separated HR vs candidate identity tables",
      "Middleware + DAL route protection",
      "Server Actions; secrets never in client",
      "Application privilege-escalation trigger (028/031)",
      "Password policy + re-auth + rate limits",
      "Private Storage + signed URLs",
      "Security headers (CSP, HSTS, …)",
    ];
    points.forEach((p, i) => {
      const col = i < 4 ? 0 : 1;
      const row = i % 4;
      s.addText(`▸  ${p}`, {
        x: 0.7 + col * 6.2,
        y: 1.5 + row * 1.1,
        w: 5.8,
        h: 0.5,
        fontSize: 15,
        color: text,
        fontFace: "Arial",
      });
    });
  }

  // 11 Auth
  {
    const s = addDarkSlide("Authentication");
    s.addText("Candidate", {
      x: 0.6,
      y: 1.3,
      w: 5.5,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: blue,
      fontFace: "Arial",
    });
    s.addText("Signup · Login · Logout\nForgot / Reset password\nChange password (profile)\n/auth/confirm PKCE", {
      x: 0.6,
      y: 1.9,
      w: 5.5,
      h: 3,
      fontSize: 15,
      color: text,
      fontFace: "Arial",
    });
    s.addText("HR", {
      x: 7,
      y: 1.3,
      w: 5.5,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: blue,
      fontFace: "Arial",
    });
    s.addText("Login · Logout\nChange password (settings)\nBootstrap via create-hr-user\nNo public HR signup", {
      x: 7,
      y: 1.9,
      w: 5.5,
      h: 3,
      fontSize: 15,
      color: text,
      fontFace: "Arial",
    });
  }

  // 12 Deployment
  {
    const s = addDarkSlide("Deployment");
    const steps = ["GitHub", "Vercel", "Supabase", "Groq", "Resend"];
    steps.forEach((step, i) => {
      const x = 0.7 + i * 2.5;
      s.addShape(pptx.shapes.OVAL, {
        x: x + 0.35,
        y: 2.5,
        w: 1.3,
        h: 1.3,
        fill: { color: "1E3A8A" },
      });
      s.addText(String(i + 1), {
        x: x + 0.35,
        y: 2.9,
        w: 1.3,
        h: 0.5,
        align: "center",
        color: "FFFFFF",
        fontSize: 20,
        bold: true,
        fontFace: "Arial",
      });
      s.addText(step, {
        x,
        y: 4.1,
        w: 2,
        h: 0.4,
        align: "center",
        color: text,
        fontSize: 14,
        fontFace: "Arial",
      });
      if (i < steps.length - 1) {
        s.addText("→", {
          x: x + 1.9,
          y: 2.9,
          w: 0.5,
          h: 0.5,
          color: blue,
          fontSize: 22,
        });
      }
    });
    s.addText("Configure .env from .env.example · run migrations · set Auth redirect /auth/confirm", {
      x: 0.6,
      y: 5.8,
      w: 12,
      h: 0.4,
      color: dim,
      fontSize: 13,
      fontFace: "Arial",
    });
  }

  // 13 Challenges
  {
    const s = addDarkSlide("Engineering Challenges Solved");
    const items = [
      "PKCE auth confirm vs token_hash mismatch",
      "Server Action Failed to fetch (redirect / sharp crash)",
      "server-only Groq boundary for client safety",
      "Application RLS privilege escalation hardening",
      "TypeScript / Next 16 build blockers in AI modules",
    ];
    items.forEach((item, i) => {
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.6,
        y: 1.35 + i * 1.0,
        w: 12.1,
        h: 0.8,
        fill: { color: card },
        rectRadius: 0.08,
      });
      s.addText(`${i + 1}.  ${item}`, {
        x: 0.9,
        y: 1.55 + i * 1.0,
        w: 11.5,
        h: 0.4,
        fontSize: 16,
        color: text,
        fontFace: "Arial",
      });
    });
  }

  // 14 Future
  {
    const s = addDarkSlide("Future Improvements");
    const fut = [
      "Enterprise roles & multi-tenant orgs",
      "Calendar + video interviews",
      "Offer letters & e-sign",
      "Richer analytics & audit productization",
      "Streaming Copilot + E2E CI",
      "Generated DB TypeScript types",
    ];
    fut.forEach((f, i) => {
      const x = 0.5 + (i % 3) * 4.2;
      const y = 1.5 + Math.floor(i / 3) * 2.5;
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 3.9,
        h: 2.1,
        fill: { color: card },
        rectRadius: 0.1,
      });
      s.addText(f, {
        x: x + 0.3,
        y: y + 0.75,
        w: 3.3,
        h: 0.8,
        fontSize: 15,
        color: text,
        fontFace: "Arial",
        align: "center",
      });
    });
  }

  // 15 Conclusion
  {
    const s = addDarkSlide("Conclusion");
    s.addText(
      "A complete dual-portal recruitment system with real Supabase security, private document storage, and Groq-assisted hiring workflows—ready for demonstration and further enterprise extension.",
      {
        x: 1,
        y: 2.4,
        w: 11.3,
        h: 2,
        fontSize: 20,
        color: text,
        fontFace: "Arial",
        align: "center",
      }
    );
    s.addText(`${AUTHOR}  ·  ${DATE}\n${REPO}`, {
      x: 1,
      y: 5.5,
      w: 11.3,
      h: 0.9,
      fontSize: 14,
      color: dim,
      fontFace: "Arial",
      align: "center",
    });
  }

  await pptx.writeFile({ fileName: OUT_PPTX });
}

async function main() {
  console.log("Generating PDF…");
  await buildPdf();
  console.log("Wrote", OUT_PDF);
  console.log("Generating PPTX…");
  await buildPptx();
  console.log("Wrote", OUT_PPTX);

  const pdfPagesApprox = "see PDF page footers";
  const pdfStat = fs.statSync(OUT_PDF);
  const pptxStat = fs.statSync(OUT_PPTX);
  console.log({
    pdfBytes: pdfStat.size,
    pptxBytes: pptxStat.size,
    pdfPagesApprox,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
