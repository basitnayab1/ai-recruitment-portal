import "server-only";

import { getGroqClient, GROQ_MODEL } from "@/lib/ai/groq";
import { parseModelJsonResponse } from "@/lib/ai/parse-json";
import {
  buildEmailGeneratorUserPrompt,
  EMAIL_GENERATOR_SYSTEM_PROMPT,
} from "@/lib/ai/email-prompts";
import {
  EmailGeneratorError,
  normalizeGeneratedEmail,
  type EmailGeneratorInput,
  type GeneratedEmail,
} from "@/lib/ai/types";

export const EMAIL_GENERATOR_TEMPERATURE = 0.4;

function validateInput(input: EmailGeneratorInput): void {
  if (!input.candidateName?.trim()) {
    throw new EmailGeneratorError("Candidate name is required.");
  }
  if (!input.jobTitle?.trim()) {
    throw new EmailGeneratorError("Job title is required.");
  }
  if (!input.companyName?.trim()) {
    throw new EmailGeneratorError("Company name is required.");
  }
}

/**
 * Generates a structured HR email draft using Groq (server-only).
 */
export async function generateHREmail(input: EmailGeneratorInput): Promise<GeneratedEmail> {
  validateInput(input);

  const client = getGroqClient();

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: EMAIL_GENERATOR_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EMAIL_GENERATOR_SYSTEM_PROMPT },
        { role: "user", content: buildEmailGeneratorUserPrompt(input) },
      ],
    });
  } catch (error) {
    throw new EmailGeneratorError("Email generation failed: Groq API request error.", {
      cause: error,
    });
  }

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new EmailGeneratorError("Email generation failed: Groq returned an empty response.");
  }

  const raw = parseModelJsonResponse(
    content,
    "Email generation failed: Groq returned invalid JSON. Please try again."
  );

  return normalizeGeneratedEmail(raw);
}
