import "server-only";

/**
 * Strips optional markdown code fences from model output before JSON parsing.
 */
export function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

/**
 * Parses JSON from a Groq chat completion content string.
 * Throws a readable error when parsing fails.
 */
export function parseModelJsonResponse(content: string, failureMessage: string): unknown {
  const payload = stripJsonFence(content);

  try {
    return JSON.parse(payload) as unknown;
  } catch (error) {
    throw new Error(failureMessage, { cause: error });
  }
}
