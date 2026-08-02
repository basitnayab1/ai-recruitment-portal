import "server-only";

import Groq from "groq-sdk";

let cachedClient: Groq | null = null;

/** Default Groq chat model for complex AI tasks (analysis, generation, answers). */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

/** Faster model for lightweight tasks (routing, health checks). */
export const GROQ_LIGHTWEIGHT_MODEL =
  process.env.GROQ_LIGHTWEIGHT_MODEL?.trim() || "llama-3.1-8b-instant";

/** @deprecated Use {@link GROQ_MODEL} */
export const GROQ_RESUME_MODEL = GROQ_MODEL;

export type GroqModelTier = "default" | "lightweight";

/** Resolves the Groq model id for the given task tier. */
export function resolveGroqModel(tier: GroqModelTier = "default"): string {
  return tier === "lightweight" ? GROQ_LIGHTWEIGHT_MODEL : GROQ_MODEL;
}

/**
 * Returns a singleton Groq client configured from `GROQ_API_KEY`.
 * Server-only — never import from Client Components.
 */
export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Groq AI is not configured: set GROQ_API_KEY in your environment to enable it."
    );
  }

  if (!cachedClient) {
    cachedClient = new Groq({ apiKey });
  }

  return cachedClient;
}

/**
 * Sends a minimal prompt to verify the Groq API key and connectivity.
 * Returns the model's reply (expected: "OK").
 */
export async function testGroqConnection(): Promise<string> {
  const client = getGroqClient();

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: GROQ_LIGHTWEIGHT_MODEL,
      temperature: 0,
      messages: [{ role: "user", content: "Reply with ONLY the word OK." }],
    });
  } catch (error) {
    throw new Error("Groq connection test failed: API request error.", { cause: error });
  }

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq connection test failed: empty response from API.");
  }

  return content;
}
