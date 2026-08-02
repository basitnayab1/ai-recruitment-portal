import "server-only";

export type CopilotDebugMeta = {
  intent: string;
  tools: string[];
  supabaseRows: Record<string, number>;
  groqPayloadBytes: number;
  groqPromptTokens?: number | null;
  groqCompletionTokens?: number | null;
  executionMs: number;
};

export function logCopilotDebug(label: string, payload: Record<string, unknown>): void {
  if (process.env.COPILOT_DEBUG === "0" || process.env.COPILOT_DEBUG === "false") {
    return;
  }
  console.log(`[ai/copilot] ${label}`, JSON.stringify(payload));
}

export function estimatePayloadBytes(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return 0;
  }
}

export function summarizeToolRows(results: Array<{ tool: string; count?: number }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const result of results) {
    out[result.tool] = (out[result.tool] ?? 0) + (result.count ?? 0);
  }
  return out;
}
