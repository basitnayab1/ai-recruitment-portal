import "server-only";

import { getGroqClient, GROQ_MODEL } from "@/lib/ai/groq";
import { parseModelJsonResponse } from "@/lib/ai/parse-json";
import {
  buildInterviewGeneratorUserPrompt,
  INTERVIEW_GENERATOR_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import {
  InterviewGeneratorError,
  normalizeInterviewQuestions,
  type InterviewGeneratorInput,
  type InterviewQuestions,
} from "@/lib/ai/types";

const LOG = "[ai/interview-generator]";
const INTERVIEW_GENERATOR_TEMPERATURE = 0.3;

function validateInput(input: InterviewGeneratorInput): void {
  if (!input.jobTitle?.trim()) {
    throw new InterviewGeneratorError("Job title is required for interview question generation.");
  }
  if (!input.jobDescription?.trim()) {
    throw new InterviewGeneratorError(
      "Job description is required for interview question generation."
    );
  }
  if (!input.resumeText?.trim()) {
    throw new InterviewGeneratorError("Resume text is required for interview question generation.");
  }
  if (!input.resumeAnalysis) {
    throw new InterviewGeneratorError(
      "AI résumé analysis is required for interview question generation."
    );
  }
}

/**
 * Generates tailored interview questions using Groq (server-only).
 */
export async function generateInterviewQuestions(
  input: InterviewGeneratorInput
): Promise<InterviewQuestions> {
  validateInput(input);

  let client;
  try {
    client = getGroqClient();
  } catch (error) {
    throw new InterviewGeneratorError(
      error instanceof Error
        ? error.message
        : "Groq AI is not configured: set GROQ_API_KEY in your environment.",
      { cause: error }
    );
  }

  const userPrompt = buildInterviewGeneratorUserPrompt(input);
  console.log(`${LOG} Prompt generated`, {
    model: GROQ_MODEL,
    jobTitle: input.jobTitle,
    jobDescriptionChars: input.jobDescription.length,
    resumeChars: input.resumeText.length,
    promptChars: userPrompt.length,
    systemChars: INTERVIEW_GENERATOR_SYSTEM_PROMPT.length,
  });

  let completion;
  try {
    console.log(`${LOG} AI request sent`, { model: GROQ_MODEL });
    completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: INTERVIEW_GENERATOR_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: INTERVIEW_GENERATOR_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
  } catch (error) {
    console.error(`${LOG} AI request failed`, error);
    throw new InterviewGeneratorError(
      "Interview question generation failed: Groq API request error. Check GROQ_API_KEY and model access.",
      { cause: error }
    );
  }

  const content = completion.choices[0]?.message?.content?.trim();
  console.log(`${LOG} AI response received`, {
    chars: content?.length ?? 0,
    promptTokens: completion.usage?.prompt_tokens ?? null,
    completionTokens: completion.usage?.completion_tokens ?? null,
    preview: content ? content.slice(0, 200) : null,
  });

  if (!content) {
    throw new InterviewGeneratorError(
      "Interview question generation failed: Groq returned an empty response."
    );
  }

  let raw: unknown;
  try {
    raw = parseModelJsonResponse(
      content,
      "Interview question generation failed: Groq returned invalid JSON. Please try again."
    );
  } catch (error) {
    console.error(`${LOG} JSON parse failed`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      contentPreview: content.slice(0, 400),
    });
    throw new InterviewGeneratorError(
      error instanceof Error
        ? error.message
        : "Interview question generation failed: Groq returned invalid JSON. Please try again.",
      { cause: error }
    );
  }

  console.log(`${LOG} Parsed successfully`);
  return normalizeInterviewQuestions(raw, input.resumeAnalysis);
}
