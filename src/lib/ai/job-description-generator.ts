import "server-only";

import { getGroqClient, GROQ_MODEL } from "@/lib/ai/groq";
import { parseModelJsonResponse } from "@/lib/ai/parse-json";
import {
  buildJobDescriptionGeneratorUserPrompt,
  JOB_DESCRIPTION_GENERATOR_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import {
  JobDescriptionGeneratorError,
  normalizeGeneratedJobDescription,
  type GeneratedJobDescription,
  type JobDescriptionGeneratorInput,
} from "@/lib/ai/types";

const JOB_DESCRIPTION_GENERATOR_TEMPERATURE = 0.4;

function validateInput(input: JobDescriptionGeneratorInput): void {
  if (!input.jobTitle?.trim()) {
    throw new JobDescriptionGeneratorError("Job title is required.");
  }
  if (!input.companyName?.trim()) {
    throw new JobDescriptionGeneratorError("Company name is required.");
  }
}

/**
 * Generates a structured job description using Groq (server-only).
 */
export async function generateJobDescription(
  input: JobDescriptionGeneratorInput
): Promise<GeneratedJobDescription> {
  validateInput(input);

  const client = getGroqClient();

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: JOB_DESCRIPTION_GENERATOR_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: JOB_DESCRIPTION_GENERATOR_SYSTEM_PROMPT },
        { role: "user", content: buildJobDescriptionGeneratorUserPrompt(input) },
      ],
    });
  } catch (error) {
    throw new JobDescriptionGeneratorError("Job description generation failed: Groq API request error.", {
      cause: error,
    });
  }

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new JobDescriptionGeneratorError("Job description generation failed: Groq returned an empty response.");
  }

  const raw = parseModelJsonResponse(
    content,
    "Job description generation failed: Groq returned invalid JSON. Please try again."
  );

  return normalizeGeneratedJobDescription(raw);
}
