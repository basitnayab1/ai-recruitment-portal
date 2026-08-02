"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { askHRCopilotAction, type HRCopilotActionState } from "@/lib/hr/copilot-actions";
import { HR_COPILOT_SUGGESTED_PROMPTS } from "@/lib/ai/copilot-suggested-prompts";
import { CopilotMarkdown } from "@/components/hr/copilot/copilot-markdown";
import { BTN_PRIMARY, FIELD_INPUT } from "@/lib/ui/classes";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

const initialActionState: HRCopilotActionState = undefined;
const FRIENDLY_ERROR =
  "Something went wrong while generating the response.\nPlease try again.";

function createMessageId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

let messageCounter = 0;

function TypewriterText({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    completedRef.current = false;
    setDisplayed("");
    let index = 0;
    const step = Math.max(1, Math.ceil(text.length / 48));

    const interval = window.setInterval(() => {
      index += step;
      if (index >= text.length) {
        setDisplayed(text);
        window.clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        return;
      }
      setDisplayed(text.slice(0, index));
    }, 55);

    return () => window.clearInterval(interval);
  }, [text]);

  return (
    <div className="relative">
      <CopilotMarkdown content={displayed} />
      <span
        className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-violet-400/80"
        aria-hidden="true"
      />
    </div>
  );
}

function CopilotLoadingDots() {
  return (
    <div className="flex items-center gap-3 px-1 py-1.5" aria-label="Copilot is thinking">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/30">
        <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden="true" />
        <span className="absolute inset-0 animate-pulse rounded-xl bg-white/10" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold tracking-wide text-violet-300 uppercase">
          Thinking…
        </span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet-400"
              initial={false}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CopyResponseButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#14141e] px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-[#1a1a26] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        aria-label={copied ? "Copied!" : "Copy response"}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy"}
      </button>
      <AnimatePresence>
        {copied ? (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-[#1a1a26] px-2 py-1 text-[10px] font-medium text-white shadow-lg"
            role="status"
          >
            Copied!
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function HRCopilotWidget() {
  const formId = useId();
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingPromptRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const handledGenerationRef = useRef(0);
  const handledErrorGenerationRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const [state, formAction, isPending] = useActionState(askHRCopilotAction, initialActionState);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending, showError, streamingId, scrollToBottom]);

  useEffect(() => {
    if (state?.status !== "success") return;
    if (handledGenerationRef.current === generationRef.current) return;
    handledGenerationRef.current = generationRef.current;

    const assistantId = createMessageId();
    queueMicrotask(() => {
      setShowError(false);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: state.answer,
          isStreaming: true,
        },
      ]);
      setStreamingId(assistantId);
      setInput("");
      pendingPromptRef.current = null;
    });
  }, [state]);

  useEffect(() => {
    if (state?.status !== "error") return;
    if (handledErrorGenerationRef.current === generationRef.current) return;
    handledErrorGenerationRef.current = generationRef.current;

    queueMicrotask(() => {
      setShowError(true);
      pendingPromptRef.current = null;
    });
  }, [state]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function startGeneration(prompt: string, options?: { appendUser?: boolean }) {
    const trimmed = prompt.trim();
    if (!trimmed || isPending || streamingId) return;

    generationRef.current += 1;
    pendingPromptRef.current = trimmed;
    setShowError(false);

    if (options?.appendUser !== false) {
      setMessages((prev) => [
        ...prev,
        { id: createMessageId(), role: "user", content: trimmed },
      ]);
    }

    setInput(trimmed);

    requestAnimationFrame(() => {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.requestSubmit();
    });
  }

  function submitPrompt(prompt: string) {
    startGeneration(prompt, { appendUser: true });
  }

  function regenerateResponse(assistantMessageId: string) {
    if (isPending || streamingId) return;

    const index = messages.findIndex((message) => message.id === assistantMessageId);
    if (index < 0) return;

    let prompt: string | null = null;
    for (let i = index - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "user") {
        prompt = messages[i]!.content;
        break;
      }
    }
    if (!prompt) return;

    setMessages((prev) => prev.slice(0, index));
    startGeneration(prompt, { appendUser: false });
  }

  function handleStreamingComplete(id: string) {
    setStreamingId((current) => (current === id ? null : current));
    setMessages((prev) =>
      prev.map((message) => (message.id === id ? { ...message, isStreaming: false } : message))
    );
  }

  const historyJson = JSON.stringify(
    messages
      .filter((message) => !message.isStreaming)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))
  );

  const busy = isPending || Boolean(streamingId);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(167,139,250,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/40 sm:right-8 sm:bottom-8"
            aria-label="Open HR AI Copilot"
          >
            <Bot className="h-6 w-6" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 sm:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${formId}-copilot-title`}
              initial={false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed inset-x-2 bottom-2 z-50 flex h-[min(720px,calc(100dvh-1rem))] w-auto flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0a0a12] shadow-[0_24px_100px_rgba(0,0,0,0.75)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:h-[min(680px,calc(100vh-2rem))] sm:w-[min(440px,calc(100vw-2rem))] md:w-[min(480px,calc(100vw-2.5rem))] lg:right-8 lg:bottom-8"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0f0f18] px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_24px_rgba(139,92,246,0.45)]">
                    <Bot className="h-5 w-5 text-white" aria-hidden="true" />
                    <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a12] bg-emerald-400" />
                  </div>
                  <div>
                    <h2
                      id={`${formId}-copilot-title`}
                      className="text-sm font-semibold text-white"
                    >
                      HR AI Copilot
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Ask about candidates, jobs & pipeline
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
                  aria-label="Close HR Copilot"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                className="flex-1 space-y-4 overflow-y-auto bg-[#0a0a12] px-3 py-4 sm:px-4"
                aria-live="polite"
                aria-relevant="additions"
              >
                {messages.length === 0 && !showError && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#14141e]">
                      <MessageSquare className="h-8 w-8 text-violet-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        How can I help with hiring today?
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Search candidates, review pipeline status, or summarize activity.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => {
                  const isAssistant = message.role === "assistant";
                  const isStreaming = isAssistant && message.isStreaming && streamingId === message.id;
                  const showActions =
                    isAssistant && !message.isStreaming && !isPending && streamingId === null;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`flex max-w-[92%] flex-col gap-2 sm:max-w-[88%] ${isAssistant ? "items-start" : "items-end"}`}>
                        <div
                          className={
                            isAssistant
                              ? "w-full rounded-2xl rounded-bl-md border border-white/10 bg-[#12121a] px-3.5 py-3 text-sm leading-relaxed text-zinc-100 shadow-[0_8px_28px_rgba(0,0,0,0.35)] sm:px-4"
                              : "rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] sm:px-4"
                          }
                        >
                          {isAssistant ? (
                            isStreaming ? (
                              <TypewriterText
                                key={message.content}
                                text={message.content}
                                onComplete={() => handleStreamingComplete(message.id)}
                              />
                            ) : (
                              <CopilotMarkdown content={message.content} />
                            )
                          ) : (
                            <span className="whitespace-pre-wrap">{message.content}</span>
                          )}
                        </div>

                        {showActions ? (
                          <div className="flex flex-wrap items-center gap-2 px-0.5">
                            <CopyResponseButton content={message.content} />
                            {index === messages.length - 1 ? (
                              <button
                                type="button"
                                onClick={() => regenerateResponse(message.id)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#14141e] px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-violet-400/30 hover:bg-[#1a1a26] hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Regenerate Response
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}

                {isPending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-white/10 bg-[#12121a] px-4 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
                      <CopilotLoadingDots />
                    </div>
                  </div>
                )}

                {showError && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-400/25 bg-[#1a1014] px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-red-200">Response failed</p>
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-red-200/80">
                          {FRIENDLY_ERROR}
                        </p>
                        {(() => {
                          const lastUser = [...messages]
                            .reverse()
                            .find((message) => message.role === "user");
                          if (!lastUser) return null;
                          return (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => startGeneration(lastUser.content, { appendUser: false })}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30 disabled:opacity-50"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Try again
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {messages.length === 0 && (
                <div className="shrink-0 border-t border-white/10 bg-[#0f0f18] px-3 py-3 sm:px-4">
                  <p className="mb-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                    Suggested prompts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {HR_COPILOT_SUGGESTED_PROMPTS.slice(0, 6).map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        disabled={busy}
                        onClick={() => submitPrompt(prompt)}
                        className="rounded-full border border-white/15 bg-[#14141e] px-3 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:border-violet-400/40 hover:bg-[#1a1a26] hover:text-violet-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form
                id={formId}
                action={formAction}
                className="shrink-0 border-t border-white/10 bg-[#0f0f18] p-3 sm:p-4"
              >
                <input type="hidden" name="history" value={historyJson} readOnly />
                <input type="hidden" name="message" value={input} readOnly />
                <div className="flex items-end gap-2">
                  <label htmlFor={inputId} className="sr-only">
                    Ask the HR Copilot
                  </label>
                  <textarea
                    id={inputId}
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitPrompt(input);
                      }
                    }}
                    placeholder="Ask about candidates, scores, or pipeline…"
                    disabled={busy}
                    className={`${FIELD_INPUT} min-h-[44px] resize-none bg-[#14141e] py-3`}
                  />
                  <button
                    type="button"
                    onClick={() => submitPrompt(input)}
                    disabled={busy || !input.trim()}
                    className={`${BTN_PRIMARY} h-11 shrink-0 px-4`}
                    aria-label="Send message"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
