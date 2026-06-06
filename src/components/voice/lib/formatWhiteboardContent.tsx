"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex";
import { sanitizeArtifactHtml, sanitizeDiagramHtml } from "./sanitize";

import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.min.css";

let hljs: typeof import("highlight.js").default | null = null;
let hljsLoaded = false;

async function loadHljs() {
  if (hljsLoaded) return;
  try {
    const mod = await import("highlight.js");
    hljs = mod.default;
    hljsLoaded = true;
  } catch {
    /* highlight unavailable */
  }
}

if (typeof window !== "undefined") {
  void loadHljs();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderLatexString(source: string, displayMode: boolean): string {
  try {
    return katex.renderToString(source, {
      displayMode,
      throwOnError: false,
      trust: false,
    });
  } catch {
    return source;
  }
}

/** Parse $...$ and $$...$$ in plain text into React nodes. */
export function renderPlainWithMath(text: string, className = ""): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    const isBlock = match[1] !== undefined;
    const latex = isBlock ? match[1]! : match[2]!;
    const html = renderLatexString(latex, isBlock);
    parts.push(
      <span
        key={key++}
        className={isBlock ? "wb-math-block" : "wb-math-inline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{parts.length ? parts : text}</span>;
}

/** Raw LaTeX without dollar signs (write_highlight). */
export function renderHighlightLatex(text: string): React.ReactNode {
  if (!text) return null;
  const trimmed = text.trim();
  const displayMode =
    trimmed.includes("\\begin{") ||
    trimmed.includes("\\frac") && trimmed.length > 40 ||
    trimmed.length > 60;
  const html = renderLatexString(trimmed, displayMode);
  return (
    <div
      className={`wb-highlight-math ${displayMode ? "wb-math-block" : "wb-math-inline"}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const MARKDOWN_HINT = /^(#{1,6}\s|[-*]\s|\d+\.\s|```|>\s)/m;

export function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_HINT.test(text.trim());
}

function softenLongParagraph(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 200 || trimmed.includes("\n")) return trimmed;
  return trimmed.replace(/([.!?])\s+(?=[A-Z0-9"(\[])/g, "$1\n\n");
}

const markdownProseClass = "wb-prose";

export function MarkdownWhiteboardBlock({ content }: { content: string }) {
  return (
    <div className={markdownProseClass}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function CodeBlock({ content, language = "text" }: { content: string; language?: string }) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const lang = (language || "text").toLowerCase().replace(/[^a-z0-9+#-]/gi, "") || "text";

  React.useEffect(() => {
    if (!hljsLoaded) void loadHljs().then(() => forceUpdate());
  }, []);

  let highlighted = escapeHtml(content);
  if (hljs && lang !== "text") {
    try {
      if (hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(content, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(content).value;
      }
    } catch {
      highlighted = escapeHtml(content);
    }
  }

  return (
    <div className="wb-code-wrap">
      <span className="wb-code-lang">{lang}</span>
      <pre className="wb-code">
        <code className={`hljs language-${lang}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

/** Post-typeset $...$ / $$...$$ inside sanitized HTML string. */
export function typesetMathInHtml(html: string): string {
  if (!html) return "";
  let out = html;
  out = out.replace(/\$\$([^$]+)\$\$/g, (_, latex) => {
    return renderLatexString(latex.trim(), true);
  });
  out = out.replace(/\$([^$]+)\$/g, (_, latex) => {
    return renderLatexString(latex.trim(), false);
  });
  return out;
}

export function RichHtmlBlock({ html, diagram = false }: { html: string; diagram?: boolean }) {
  const safe = diagram ? sanitizeDiagramHtml(html) : sanitizeArtifactHtml(html);
  const typeset = typesetMathInHtml(safe);
  const paragraphWall =
    (safe.match(/<p[\s>]/gi) ?? []).length >= 3 && !/<ul[\s>]|<ol[\s>]/i.test(safe);
  return (
    <div
      className={`wb-prose ${diagram ? "wb-diagram-host" : ""} ${paragraphWall ? "wb-prose-paragraphs" : ""}`}
      dangerouslySetInnerHTML={{ __html: typeset }}
    />
  );
}

export function PlainTextBlock({ text }: { text: string }) {
  const normalized = softenLongParagraph(text);
  if (looksLikeMarkdown(normalized)) {
    return <MarkdownWhiteboardBlock content={normalized} />;
  }
  return <div className="wb-plain">{renderPlainWithMath(normalized)}</div>;
}
