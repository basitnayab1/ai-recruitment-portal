"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { askHRCopilotAction, type HRCopilotActionState } from "@/lib/hr/copilot-actions";
import { HR_COPILOT_SUGGESTED_PROMPTS } from "@/lib/ai/copilot-suggested-prompts";
import { BTN_PRIMARY, FIELD_INPUT } from "@/lib/ui/classes";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

const initialActionState: HRCopilotActionState = undefined;

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
    let index = 0;
    // Chunk updates (~12/sec) instead of ~60fps setState.
    const step = Math.max(1, Math.ceil(text.length / 40));

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
    }, 80);

    return () => window.clearInterval(interval);
  }, [text]);

  return <span className="whitespace-pre-wrap">{displayed}</span>;
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
          Thinking
        </span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet-500"
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

export function HRCopilotWidget() {
  const formId = useId();
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingPromptRef = useRef<string | null>(null);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(askHRCopilotAction, initialActionState);
  const handledSuccessRef = useRef<string | null>(null);
  const handledErrorRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending, scrollToBottom]);

  useEffect(() => {
    if (state?.status !== "success") return;
    if (handledSuccessRef.current === state.answer) return;
    handledSuccessRef.current = state.answer;

    const assistantId = createMessageId();
    queueMicrotask(() => {
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
    if (state?.status !== "error" || !pendingPromptRef.current) return;
    const errorKey = state.message;
    if (handledErrorRef.current === errorKey) return;
    handledErrorRef.current = errorKey;

    const failedPrompt = pendingPromptRef.current;
    queueMicrotask(() => {
      setMessages((prev) => prev.filter((m) => m.content !== failedPrompt));
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

  function submitPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || isPending) return;

    pendingPromptRef.current = trimmed;
    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), role: "user", content: trimmed },
    ]);
    setInput(trimmed);

    requestAnimationFrame(() => {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.requestSubmit();
    });
  }

  function handleStreamingComplete(id: string) {
    setStreamingId((current) => (current === id ? null : current));
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m))
    );
  }

  const historyJson = JSON.stringify(
    messages
      .filter((m) => !m.isStreaming)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))
  );

  return (
    <>
      {/* Floating trigger */}
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

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
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
              className="fixed inset-x-3 bottom-3 z-50 flex h-[min(680px,calc(100dvh-1.5rem))] w-auto flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0a0a12]/90 shadow-[0_24px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100vh-2rem))] sm:w-[min(420px,calc(100vw-2rem))]"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-violet-500/20 via-transparent to-fuchsia-500/15 px-5 py-4">
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

              {/* Messages */}
              <div
                className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
                aria-live="polite"
                aria-relevant="additions"
              >
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/15">
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

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.role === "user"
                          ? "rounded-br-md bg-white text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.12)]"
                          : "rounded-bl-md border border-white/10 bg-white/[0.05] text-zinc-100"
                      }`}
                    >
                      {message.role === "assistant" && message.isStreaming && streamingId === message.id ? (
                        <TypewriterText
                          key={message.content}
                          text={message.content}
                          onComplete={() => handleStreamingComplete(message.id)}
                        />
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isPending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2">
                      <CopilotLoadingDots />
                    </div>
                  </div>
                )}

                {state?.status === "error" && (
                  <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {state.message}
                  </p>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested prompts */}
              {messages.length === 0 && (
                <div className="shrink-0 border-t border-white/10 px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                    Suggested prompts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {HR_COPILOT_SUGGESTED_PROMPTS.slice(0, 6).map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        disabled={isPending}
                        onClick={() => submitPrompt(prompt)}
                        className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form
                id={formId}
                action={formAction}
                className="shrink-0 border-t border-white/10 p-4"
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
                    disabled={isPending}
                    className={`${FIELD_INPUT} min-h-[44px] resize-none py-3`}
                  />
                  <button
                    type="button"
                    onClick={() => submitPrompt(input)}
                    disabled={isPending || !input.trim()}
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
