import "server-only";

import OpenAI from "openai";

// The one place in the codebase allowed to import the `openai` package or
// read `OPENAI_API_KEY` — every other AI module goes through
// `getOpenAIClient()` / `AI_EVALUATION_MODEL` so the SDK and its
// configuration stay isolated here (requirement: "Keep OpenAI integration
// isolated"). Never imported by a Client Component — this file has no
// "use client" boundary and reads a server-only secret.

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI evaluation is not configured: set OPENAI_API_KEY in your environment to enable it."
    );
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

export const AI_EVALUATION_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
