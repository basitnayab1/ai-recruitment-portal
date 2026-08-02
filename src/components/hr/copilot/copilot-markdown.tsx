"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#12161e] px-3 py-1.5">
        <span className="font-mono text-[10px] tracking-wide text-zinc-400 uppercase">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span className={copied ? "text-emerald-400" : ""}>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "0.875rem 1rem",
          background: "transparent",
          fontSize: "12px",
          lineHeight: 1.6,
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-geist-mono), ui-monospace, monospace" } }}
        PreTag="div"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-violet-300 underline decoration-violet-400/40 underline-offset-2 transition-colors hover:text-violet-200"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className ?? "");
    const code = String(children).replace(/\n$/, "");
    const isBlock = Boolean(match) || code.includes("\n");

    if (isBlock) {
      return <CodeBlock language={match?.[1] ?? "text"} code={code} />;
    }

    return (
      <code
        className="rounded-md border border-white/10 bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-violet-200"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => {
    // Block code is handled by the custom `code` renderer; avoid double wrappers.
    return <>{children}</>;
  },
  table: ({ children }) => (
    <div className="my-3 -mx-1 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1018]">
      <table className="min-w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/[0.06]">{children}</thead>,
  th: ({ children }) => (
    <th className="whitespace-nowrap border-b border-white/10 px-3 py-2.5 font-semibold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/5 px-3 py-2.5 text-zinc-200">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-violet-400/50 bg-violet-500/5 py-1 pl-3 text-zinc-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-white/10" />,
  input: ({ type, checked, disabled, ...props }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={Boolean(checked)}
          disabled={disabled}
          readOnly
          className="mr-2 mt-1 rounded border-white/20 bg-[#12121a] text-violet-500"
          {...props}
        />
      );
    }
    return <input type={type} checked={checked} disabled={disabled} {...props} />;
  },
};

/**
 * Renders Copilot assistant replies as Markdown (GFM) without dangerouslySetInnerHTML.
 */
export function CopilotMarkdown({ content }: { content: string }) {
  if (!content) return null;

  return (
    <div
      className={[
        "prose prose-sm prose-invert max-w-none dark:prose-invert",
        "prose-headings:mb-2 prose-headings:mt-3 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-white",
        "prose-h1:text-base prose-h2:text-sm prose-h3:text-sm",
        "prose-p:my-2 prose-p:leading-relaxed prose-p:text-zinc-200",
        "prose-strong:font-semibold prose-strong:text-white",
        "prose-em:text-zinc-100",
        "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5 prose-ul:text-zinc-200",
        "prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-zinc-200",
        "prose-li:my-0.5 prose-li:marker:text-zinc-500",
        "prose-blockquote:border-none prose-blockquote:p-0 prose-blockquote:not-italic",
        "prose-hr:border-white/10",
        "prose-a:no-underline",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0",
        "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
      ].join(" ")}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
