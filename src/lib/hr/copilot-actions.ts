"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireHRUser } from "@/lib/auth/dal";
import { HRCopilotError, runHRCopilot, type CopilotChatMessage } from "@/lib/ai/hr-copilot";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

export type HRCopilotActionState =
  | {
      status: "success";
      answer: string;
      toolsUsed: string[];
      intent?: string;
      confidence?: number;
      needsClarification?: boolean;
      executionPlan?: string[];
      finalDecision?: string | null;
    }
  | { status: "error"; message: string }
  | undefined;

function parseHistory(raw: FormDataEntryValue | null): CopilotChatMessage[] {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is CopilotChatMessage =>
          !!item &&
          typeof item === "object" &&
          (item as CopilotChatMessage).role !== undefined &&
          typeof (item as CopilotChatMessage).content === "string" &&
          ((item as CopilotChatMessage).role === "user" ||
            (item as CopilotChatMessage).role === "assistant")
      )
      .slice(-12);
  } catch {
    return [];
  }
}

function handleCopilotError(error: unknown): HRCopilotActionState {
  // Never swallow Next.js redirect / navigation control flow.
  if (isRedirectError(error)) {
    throw error;
  }

  console.error("[hr/copilot-actions] Copilot error:", error);
  if (error instanceof Error) {
    console.error(error.stack);
  }

  if (error instanceof HRCopilotError) {
    // Safe, intentional product messages only.
    return { status: "error", message: error.message };
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("GROQ_API_KEY")) {
    return {
      status: "error",
      message: "AI Copilot is not configured. Please set GROQ_API_KEY in the environment.",
    };
  }

  // Never return stack traces to the browser.
  return {
    status: "error",
    message: "Copilot could not complete that request. Please try again.",
  };
}

/**
 * Server Action: ask the HR Copilot a hiring question.
 * HR/Admin only — enforced via requireHRUser().
 */
export async function askHRCopilotAction(
  _prevState: HRCopilotActionState,
  formData: FormData
): Promise<HRCopilotActionState> {
  try {
    const hr = await requireHRUser();

    const limit = checkRateLimit({
      key: rateLimitKey("hr-copilot", hr.id),
      limit: 30,
      windowMs: 60 * 60 * 1000,
      message: "Copilot rate limit reached. Please wait before sending more questions.",
    });
    if (!limit.ok) {
      return { status: "error", message: limit.message };
    }

    const message = String(formData.get("message") ?? "").trim();
    if (!message) {
      return { status: "error", message: "Please enter a question." };
    }

    if (message.length > 2000) {
      return { status: "error", message: "Question is too long (max 2000 characters)." };
    }

    const history = parseHistory(formData.get("history"));
    const result = await runHRCopilot(message, history);

    return {
      status: "success",
      answer: result.answer,
      toolsUsed: result.toolsUsed,
      intent: result.intent,
      confidence: result.confidence,
      needsClarification: result.needsClarification,
      executionPlan: result.executionPlan,
      finalDecision: result.finalDecision,
    };
  } catch (error) {
    return handleCopilotError(error);
  }
}
