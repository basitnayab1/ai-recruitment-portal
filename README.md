# AI Recruitment Portal

An AI-assisted recruitment platform that connects candidates and HR teams with structured hiring workflows, résumé intelligence, and an in-dashboard Copilot.

---

## 1. Project Overview

**AI Recruitment Portal** (RecruitAI) is a full-stack applicant tracking system built with **Next.js** and **Supabase**. It provides:

- A public careers surface for browsing and applying to jobs
- An authenticated **Candidate Portal** for profiles, résumés, applications, and interviews
- An authenticated **HR Dashboard** for jobs, pipeline management, analytics, and AI tools
- Server-side **Groq** integrations for résumé analysis, candidate ranking, interview prep, email drafting, and conversational Copilot assistance

The product is designed around role isolation (HR vs candidate), Row Level Security, and Server Actions so sensitive AI and database work never runs in the browser with privileged keys.

---

## 2. Live Demo Link

> Replace this URL with your deployed Vercel (or other) production URL after deploy.

**Live demo:** [https://your-deployment.vercel.app](https://ai-recruitment-portal-one.vercel.app/)

Suggested smoke checks after deploy:

| Role | Path |
|------|------|
| Public | `/` · `/jobs` |
| Candidate | `/candidate/login` · `/candidate` |
| HR | `/hr/login` · `/hr` |

---

## 3. GitHub Repository

**Repository:** [https://github.com/basitnayab1/ai-recruitment-portal](https://github.com/basitnayab1/ai-recruitment-portal)

```bash
git clone https://github.com/basitnayab1/ai-recruitment-portal.git
cd ai-recruitment-portal
```

---

## 4. Features

### Candidate Portal

- Email/password signup and login with Supabase Auth
- Forgot / reset password flow
- Profile completion (contact, professional details, skills, salary expectations)
- Profile picture upload (private storage + signed URLs)
- Résumé upload and management
- Browse published jobs and submit applications
- Application tracking and interview visibility
- In-app notifications
- Account **Security** card (change password with re-authentication)

### HR Dashboard

- HR / admin staff authentication (separate from candidates)
- Job create / edit / publish / close with filters and search
- Application pipeline with status updates and notes
- Interview scheduling and management
- Candidate directory and detail views
- Analytics, activity log, and CSV export helpers
- Settings: account info + **Security** (change password)
- HR AI Copilot chat widget (Markdown-rendered replies)

### AI Features

| Feature | Description |
|---------|-------------|
| **Résumé analysis** | Parses résumé text and scores fit against a job |
| **Candidate ranking** | Ranks applicants for a job using AI + structured scores |
| **Interview assistant** | Generates tailored interview questions |
| **Job description assistant** | Drafts job descriptions from role inputs |
| **AI email assistant** | Drafts candidate outreach / status emails |
| **HR Copilot** | Conversational assistant over hiring data and tools |
| **Hiring decision support** | Structured recommendations grounded in evaluations |

AI calls use **Groq** from server-only modules (`import "server-only"`). Client components never hold `GROQ_API_KEY`.

---

## 5. Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI primitives, Framer Motion |
| Auth & DB | Supabase Auth, Postgres, Storage, RLS |
| AI | Groq SDK (`llama-3.3-70b-versatile`, lightweight models for routing) |
| Email | Resend |
| Documents | `unpdf`, `mammoth`, `sharp` |
| Markdown chat | `react-markdown`, `remark-gfm`, `react-syntax-highlighter` |
| Tooling | ESLint, React Compiler, `tsx` scripts |

---

## 6. System Architecture

```text
┌─────────────────┐     ┌─────────────────┐
│  Public Site    │     │ Candidate App   │
│  /  /jobs       │     │ /candidate/*    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │      Next.js App Router (Server Components + Server Actions)
         │                       │
┌────────┴───────────────────────┴────────┐
│              HR App  /hr/*               │
│   Jobs · Applications · Copilot · AI    │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   Supabase     Groq API      Resend
   Auth/DB/     (server-only) (notifications)
   Storage
```

**Key conventions**

- **Server Actions** for mutations (login, apply, status updates, AI triggers)
- **DAL helpers** (`requireHRUser` / `requireCandidateUser`) for authoritative role checks
- **Middleware / proxy** for session refresh and optimistic route guards
- **RLS** as the data boundary; service role used only in trusted server scripts

---

## 7. Database Structure

Schema evolves via numbered SQL migrations in `supabase/migrations/` (`001` → `031+`).

### Core tables (high level)

| Area | Tables / storage |
|------|------------------|
| HR staff | `profiles` (linked to `auth.users`) |
| Candidates | `candidate_profiles`, `candidate_profile_details`, `candidate_profile_pictures`, `candidate_resumes` |
| Hiring | `jobs`, `applications`, education/skills related rows, `application_notes`, status history |
| Interviews | `interviews` |
| AI | `ai_evaluations`, `ai_resume_analysis`, `ai_interview_questions`, `ai_candidate_ranking` |
| Platform | `notifications`, `audit_logs` |
| Storage | Private buckets for résumés and profile pictures |

### Application workflow statuses

```text
new → ai_shortlisted → hr_review → interview → hold | rejected | selected → hired
```

Apply migrations in order through the Supabase SQL Editor or CLI against your project.

---

## 8. Project Workflow

```text
1. HR creates & publishes a job
2. Candidate completes profile / résumé (completion gate for apply)
3. Candidate applies to a published job
4. Application enters pipeline as `new`
5. HR (or AI tools) analyzes résumé & ranks candidates
6. Status moves through shortlist → review → interview → decision
7. Notifications / emails keep stakeholders informed
8. Copilot can answer pipeline questions using live data tools
```

---

## 9. AI Shortlisting Process

1. **Ingest** — Résumé file is stored privately; text is extracted server-side (`unpdf` / `mammoth`).
2. **Analyze** — Groq returns structured scores (overall fit, skills, strengths/weaknesses, recommendation).
3. **Persist** — Results land in AI tables (`ai_resume_analysis` / evaluations) scoped to application + job.
4. **Rank** — Job-level ranking aggregates evaluations into ordered shortlists (`ai_candidate_ranking`).
5. **Act** — HR reviews scores in the UI, updates application status (e.g. `ai_shortlisted`), and may generate interview questions or emails.
6. **Assist** — Copilot can explain rankings and surface candidates without exposing secrets to the client.

Shortlisting is **assistive**: humans remain the decision-makers; AI provides structured evidence.

---

## 10. Security Features

- Separate HR (`profiles`) and candidate (`candidate_profiles`) identity models
- Supabase Auth sessions via `@supabase/ssr` cookies (no privileged keys in the browser)
- Row Level Security on recruitment tables; hardened application update policies
- Trigger-based guards against candidate privilege escalation on applications
- Rate limiting on login, signup, password change, and password reset
- Password policy: 8+ chars, upper, lower, number, special character
- Re-authentication required before password changes
- Trusted site origin for auth email redirects (`NEXT_PUBLIC_SITE_URL`)
- Security headers (CSP, frame denial, HSTS, etc.) in `next.config.ts`
- Private storage paths for CVs and profile pictures (signed URL access)
- Groq / Resend / Supabase secret keys used only on the server

---

## 11. Local Setup Instructions

### Prerequisites

- Node.js 20+
- npm
- A Supabase project
- Groq API key (for AI features)
- Resend API key (for email)

### Steps

```bash
# 1. Clone
git clone https://github.com/basitnayab1/ai-recruitment-portal.git
cd ai-recruitment-portal

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your real values (never commit this file)

# 4. Apply SQL migrations in supabase/migrations/ (001 → latest)
#    via Supabase Dashboard → SQL Editor, or Supabase CLI

# 5. Configure Supabase Auth redirect URLs to include:
#    http://localhost:3000/auth/confirm

# 6. Create an HR user (service role required)
npm run create-hr-user -- --email="hr@example.com" --password="Str0ngPass!" --name="Jane Doe" --role=admin

# 7. Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm run lint
npm run type-check
npm run build
```

---

## 12. Deployment Instructions

### Recommended: Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add **all** variables from `.env.example` in **Project → Settings → Environment Variables** (Production / Preview / Development as needed).
4. Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://your-app.vercel.app`).
5. In Supabase Auth, allow the production redirect URL:  
   `https://your-domain.com/auth/confirm`
6. Deploy. Run migrations against the production Supabase project if not already applied.
7. Create the first HR user with `npm run create-hr-user` pointed at production env vars (locally with production secrets, or a secure CI step).

### Post-deploy checklist

- [ ] Public jobs page loads
- [ ] Candidate signup / login / password reset emails work
- [ ] HR login reaches `/hr`
- [ ] Groq-powered actions respond (Copilot or résumé analysis)
- [ ] Resend delivers at least one notification path

---

## 13. Environment Variables (`.env.example`)

See [`.env.example`](./.env.example) for the full placeholder template. Summary:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key |
| `SUPABASE_SECRET_KEY` | Server/admin secret (never expose to client) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for auth + SEO |
| `APP_NAME` | Display name in UI / emails |
| `GROQ_API_KEY` | Groq API access for AI features |
| `GROQ_LIGHTWEIGHT_MODEL` | Optional lightweight model override |
| `GROQ_PLANNER_MODEL` | Optional Copilot planner model override |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | From address for outbound mail |
| `EMAIL_FROM_NAME` | From display name |
| `HR_NOTIFICATION_EMAIL` | Fallback HR notification recipients |
| `COPILOT_DEBUG` | Optional Copilot debug logging toggle |

**Do not commit `.env.local` or real secrets.**

---

## 14. Known Limitations

- AI quality depends on résumé parse quality and Groq model availability / rate limits
- Email delivery requires a verified Resend domain for production reliability
- Password reset and signup confirmation require correct Supabase redirect URL configuration
- Some AI features degrade gracefully when `GROQ_API_KEY` is missing (UI shows configuration errors)
- Ranking / analysis history may need backfill for legacy applications
- Native image tooling (`sharp`) can fail on mismatched platform installs in local Windows setups
- Multi-tenant organizations / SSO are not implemented (single-portal model)

---

## 15. Future Improvements

- Deeper interview calendar integrations (Google / Outlook)
- Candidate-facing AI interview practice mode
- Richer analytics dashboards and export packs
- Webhook / Slack notifications for pipeline events
- Fine-grained HR roles and team workspaces
- Automated E2E test suite in CI
- Generated TypeScript types from Supabase schema
- Streaming Copilot responses end-to-end (token streaming)

---

## 16. Author

**Basit Nayab**

- GitHub: [basitnayab1](https://github.com/basitnayab1)
- Repository: [ai-recruitment-portal](https://github.com/basitnayab1/ai-recruitment-portal)

---

## License

Private project (`"private": true` in `package.json`). All rights reserved unless otherwise licensed by the author.

---

<p align="center">
  Built with Next.js · Supabase · Groq
</p>
