/**
 * Static security re-checks after hardening. Exit non-zero on regression.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs|sql)$/.test(name)) out.push(p);
  }
  return out;
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// Migration 028 must drop candidate UPDATE on applications
const m028 = read("supabase/migrations/028_security_harden_applications_rls.sql");
assert(
  m028.includes('drop policy if exists "Candidates can update own applications"'),
  "028 missing drop of candidate applications UPDATE policy"
);

// Trusted origin (no Host header trust)
const signup = read("src/lib/candidate-auth/actions.ts");
assert(signup.includes("getTrustedSiteOrigin"), "signup must use getTrustedSiteOrigin");
assert(!signup.includes("x-forwarded-host"), "signup must not trust X-Forwarded-Host");

// Email send binds to DB
const email = read("src/lib/hr/email-actions.ts");
assert(email.includes('.from("applications")'), "email send must load application from DB");
assert(
  !/to:\s*String\(formData\.get\("candidateEmail"\)/.test(email),
  "email must not send to client-supplied candidateEmail"
);

// Copilot must not return stacks
const copilot = read("src/lib/hr/copilot-actions.ts");
assert(!copilot.includes("stack ?"), "copilot must not return stack traces");
assert(copilot.includes("checkRateLimit"), "copilot must rate limit");

// Security headers
const nextConfig = read("next.config.ts");
assert(nextConfig.includes("Content-Security-Policy"), "next.config missing CSP");
assert(nextConfig.includes("Strict-Transport-Security"), "next.config missing HSTS");
assert(nextConfig.includes("X-Frame-Options"), "next.config missing X-Frame-Options");

// Middleware covers candidate + HR
const mw = read("src/lib/supabase/middleware.ts");
assert(mw.includes("CANDIDATE_PROTECTED_PREFIX"), "middleware must pre-filter /candidate");
assert(mw.includes("HR_PROTECTED_PREFIX") || mw.includes("/hr"), "middleware must pre-filter /hr");

// Resume magic bytes
const resume = read("src/lib/candidate/resume-actions.ts");
assert(resume.includes("%PDF-"), "resume upload must check PDF magic bytes");

// Admin client server-only
const admin = read("src/lib/supabase/admin.ts");
assert(admin.includes('import "server-only"'), "admin client must be server-only");
assert(admin.includes("SUPABASE_SECRET_KEY"), "admin uses secret key env");

// createInterviewForApplication re-auths
const interview = read("src/lib/hr/interview-actions.ts");
assert(
  interview.includes("const actor = await requireHRUser()"),
  "createInterviewForApplication must call requireHRUser"
);

// Rate limits on auth
const hrLogin = read("src/lib/auth/actions.ts");
assert(hrLogin.includes("checkRateLimit"), "HR login must rate limit");
assert(signup.includes("checkRateLimit"), "candidate signup/login must rate limit");

// Prompt wrapping
const prompts = read("src/lib/ai/prompts.ts");
assert(prompts.includes("wrapUntrustedText"), "AI prompts must wrap untrusted resume text");

// No secret key in client bundle sources
const files = walk(join(root, "src"));
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (file.includes(`${join("src", "lib", "supabase", "admin")}`)) continue;
  if (text.includes("SUPABASE_SECRET_KEY") || text.includes("SERVICE_ROLE")) {
    // allow comments / admin-only imports of createAdminClient
    if (text.includes("createAdminClient") && !text.includes("SUPABASE_SECRET_KEY")) continue;
    if (text.includes("SUPABASE_SECRET_KEY")) {
      failures.push(`Secret key reference outside admin.ts: ${file}`);
    }
  }
}

if (failures.length) {
  console.error("SECURITY AUDIT CHECK FAILED:");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("SECURITY AUDIT CHECK PASSED (" + [
  "RLS migration",
  "auth origin",
  "email bind",
  "copilot",
  "headers",
  "middleware",
  "resume",
  "admin",
  "rate limits",
  "prompts",
].join(", ") + ")");
