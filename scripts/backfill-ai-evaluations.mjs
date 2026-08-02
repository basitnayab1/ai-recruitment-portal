/**
 * Backfill ai_resume_analysis + ai_candidate_ranking for existing applications.
 * Uses service-role + Groq. Does not import Next server-only modules.
 *
 * Usage: node --env-file=.env.local scripts/backfill-ai-evaluations.mjs
 */

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { extractText } from "unpdf";

// unpdf may call Math.sumPrecise; polyfill for environments where it is missing.
if (typeof Math.sumPrecise !== "function") {
  Math.sumPrecise = (values) => {
    let total = 0;
    for (const value of values) total += Number(value) || 0;
    return total;
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const groqKey = process.env.GROQ_API_KEY?.trim();
const MODEL = "llama-3.3-70b-versatile";
const BUCKET = "resumes";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}
if (!groqKey) {
  console.error("Missing GROQ_API_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const groq = new Groq({ apiKey: groqKey });

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  let normalized = n;
  if (n > 0 && n <= 1) normalized = n * 100;
  else if (n > 1 && n <= 10 && !Number.isInteger(n)) normalized = n * 10;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function normalizeAnalysis(raw) {
  const obj = raw && typeof raw === "object" ? raw : {};
  const overallScore = clampScore(
    obj.overallScore ?? obj.overall_score ?? obj.score ?? obj.skillMatch
  );
  const recommendation =
    typeof obj.recommendation === "string" && obj.recommendation.trim()
      ? obj.recommendation.trim()
      : overallScore >= 85
        ? "Strong Hire"
        : overallScore >= 70
          ? "Hire"
          : overallScore >= 50
            ? "Maybe"
            : "No Hire";

  return {
    score: overallScore,
    overallScore,
    technicalScore: clampScore(obj.technicalScore ?? overallScore),
    experienceScore: clampScore(obj.experienceScore ?? overallScore),
    educationScore: clampScore(obj.educationScore ?? overallScore),
    communicationScore: clampScore(obj.communicationScore ?? overallScore),
    skillMatch: clampScore(obj.skillMatch ?? overallScore),
    summary: typeof obj.summary === "string" ? obj.summary : "No summary.",
    strengths: Array.isArray(obj.strengths) ? obj.strengths.map(String) : [],
    weaknesses: Array.isArray(obj.weaknesses) ? obj.weaknesses.map(String) : [],
    skills: Array.isArray(obj.skills) ? obj.skills.map(String) : [],
    missingSkills: Array.isArray(obj.missingSkills)
      ? obj.missingSkills.map(String)
      : Array.isArray(obj.missing_skills)
        ? obj.missing_skills.map(String)
        : [],
    experience: typeof obj.experience === "string" ? obj.experience : `Experience score: ${overallScore}/100.`,
    education: typeof obj.education === "string" ? obj.education : `Education score: ${overallScore}/100.`,
    recommendation,
    recommendationLabel: recommendation,
    confidence: clampScore(obj.confidence ?? 70),
  };
}

async function parsePdf(buffer) {
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n") : String(text ?? "");
  return joined.replace(/\s+/g, " ").trim();
}

async function analyzeWithGroq({ resumeText, jobTitle, jobDescription, jobRequirements }) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert Senior Technical Recruiter. Return ONLY valid JSON. No markdown.",
      },
      {
        role: "user",
        content: `Evaluate the candidate resume against this job.

Return ONLY JSON:
{
  "overallScore": number,
  "technicalScore": number,
  "experienceScore": number,
  "educationScore": number,
  "communicationScore": number,
  "skillMatch": number,
  "strengths": string[],
  "weaknesses": string[],
  "missingSkills": string[],
  "skills": string[],
  "experience": string,
  "education": string,
  "summary": string,
  "recommendation": "Strong Hire" | "Hire" | "Maybe" | "No Hire",
  "confidence": number
}

--- JOB TITLE ---
${jobTitle}

--- JOB DESCRIPTION ---
${jobDescription}

--- JOB REQUIREMENTS ---
${jobRequirements || "Not specified"}

--- RESUME TEXT ---
${resumeText.slice(0, 12000)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty Groq response");
  return normalizeAnalysis(JSON.parse(content));
}

async function recalculateJobRanking(jobId) {
  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, candidate_id, full_name, ai_resume_analysis ( score, recommendation, analysis_json )")
    .eq("job_id", jobId)
    .not("candidate_id", "is", null);

  if (error) throw new Error(error.message);

  const scored = (applications ?? [])
    .map((row) => {
      const analysisRow = Array.isArray(row.ai_resume_analysis)
        ? row.ai_resume_analysis[0]
        : row.ai_resume_analysis;
      if (!analysisRow) return null;
      const analysis = normalizeAnalysis(analysisRow.analysis_json);
      return {
        candidateId: row.candidate_id,
        score: analysis.overallScore,
        reason: [`Overall ${analysis.overallScore}/100`, analysis.recommendation]
          .concat(analysis.strengths.slice(0, 2))
          .filter(Boolean)
          .join("; "),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId));

  await supabase.from("ai_candidate_ranking").delete().eq("job_id", jobId);
  if (scored.length === 0) return 0;

  const { error: insertError } = await supabase.from("ai_candidate_ranking").insert(
    scored.map((entry, index) => ({
      job_id: jobId,
      candidate_id: entry.candidateId,
      rank: index + 1,
      score: entry.score,
      reason: entry.reason,
    }))
  );
  if (insertError) throw new Error(insertError.message);
  return scored.length;
}

async function evaluateApplication(app) {
  const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
  if (!app.candidate_id) throw new Error("Missing candidate_id");
  if (!job?.title || !job?.description) throw new Error("Missing job context");
  if (!app.cv_storage_path) throw new Error("Missing cv_storage_path");

  const { data: file, error: dlError } = await supabase.storage
    .from(BUCKET)
    .download(app.cv_storage_path);
  if (dlError || !file) throw new Error(dlError?.message ?? "Download failed");

  const buffer = Buffer.from(await file.arrayBuffer());
  const resumeHash = createHash("sha256").update(buffer).digest("hex");
  const resumeText = await parsePdf(buffer);
  if (!resumeText || resumeText.length < 40) {
    throw new Error(`Resume text too short (${resumeText.length} chars)`);
  }

  const analysis = await analyzeWithGroq({
    resumeText,
    jobTitle: job.title,
    jobDescription: job.description,
    jobRequirements: job.requirements ?? "",
  });

  const payload = {
    candidate_id: app.candidate_id,
    application_id: app.id,
    resume_hash: resumeHash,
    job_title: job.title,
    job_description: job.description,
    analysis_json: analysis,
    score: analysis.overallScore,
    recommendation: analysis.recommendation,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("ai_resume_analysis")
    .select("id")
    .eq("application_id", app.id)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("ai_resume_analysis").update(payload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("ai_resume_analysis").insert(payload);
    if (error) throw new Error(error.message);
  }

  const ranked = await recalculateJobRanking(app.job_id);
  return { score: analysis.overallScore, recommendation: analysis.recommendation, ranked };
}

console.log("=== Backfill AI evaluations ===");
const { data: apps, error } = await supabase
  .from("applications")
  .select("id, candidate_id, full_name, job_id, cv_storage_path, jobs ( title, description, requirements )")
  .not("candidate_id", "is", null)
  .order("submitted_at", { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("Applications:", apps?.length ?? 0);
const jobIds = new Set();

for (const app of apps ?? []) {
  process.stdout.write(`Evaluating ${app.full_name} (${app.id.slice(0, 8)})... `);
  try {
    const result = await evaluateApplication(app);
    jobIds.add(app.job_id);
    console.log(`OK score=${result.score} rec=${result.recommendation} ranked=${result.ranked}`);
  } catch (e) {
    console.log(`FAIL ${e instanceof Error ? e.message : e}`);
  }
}

// Final ranking sync per job
for (const jobId of jobIds) {
  const n = await recalculateJobRanking(jobId);
  console.log(`Job ${jobId.slice(0, 8)} ranking rows: ${n}`);
}

const [rankCount, analysisCount] = await Promise.all([
  supabase.from("ai_candidate_ranking").select("id", { count: "exact", head: true }),
  supabase.from("ai_resume_analysis").select("id", { count: "exact", head: true }),
]);
console.log("Final ai_candidate_ranking:", rankCount.count);
console.log("Final ai_resume_analysis:", analysisCount.count);
