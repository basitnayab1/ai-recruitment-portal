import "server-only";

import { getGroqClient, GROQ_MODEL } from "@/lib/ai/groq";
import { parseModelJsonResponse } from "@/lib/ai/parse-json";
import { buildResumeAnalysisUserPrompt, RESUME_ANALYSIS_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  normalizeResumeAnalysis,
  ResumeAnalysisError,
  type ResumeAnalysis,
  type ResumeAnalysisInput,
} from "@/lib/ai/types";

const RESUME_ANALYSIS_TEMPERATURE = 0.2;

function validateInput(input: ResumeAnalysisInput): void {
  if (!input.resumeText?.trim()) {
    throw new ResumeAnalysisError("Resume text is required for analysis.");
  }
  if (!input.jobTitle?.trim()) {
    throw new ResumeAnalysisError("Job title is required for analysis.");
  }
  if (!input.jobDescription?.trim()) {
    throw new ResumeAnalysisError("Job description is required for analysis.");
  }
}

/**
 * Analyzes a resume against a job opening using Groq (server-only).
 * Returns validated, normalized `ResumeAnalysis` JSON.
 */
export async function analyzeResume(input: ResumeAnalysisInput): Promise<ResumeAnalysis> {
  validateInput(input);

  const client = getGroqClient();
  const userPrompt = buildResumeAnalysisUserPrompt(input);

  console.log("Groq request: resume evaluation", {
    model: GROQ_MODEL,
    jobTitle: input.jobTitle,
    resumeChars: input.resumeText.length,
    promptChars: userPrompt.length,
  });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: RESUME_ANALYSIS_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: RESUME_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
  } catch (error) {
    throw new ResumeAnalysisError("Resume analysis failed: Groq API request error.", {
      cause: error,
    });
  }

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new ResumeAnalysisError("Resume analysis failed: Groq returned an empty response.");
  }

  console.log("Groq response: resume evaluation", {
    chars: content.length,
    promptTokens: completion.usage?.prompt_tokens ?? null,
    completionTokens: completion.usage?.completion_tokens ?? null,
  });

  const raw = parseModelJsonResponse(
    content,
    "Resume analysis failed: Groq returned invalid JSON. Please try again."
  );
  return normalizeResumeAnalysis(raw);
}
