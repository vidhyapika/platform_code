"use client";

import React, { useState } from "react";
import { HelpCircle, Loader2, Star } from "lucide-react";
import type { RpcResult } from "../../hooks/useVoiceAgentRpc";
import type { WhiteboardPayload } from "../../../../lib/voice/voiceEvents";
import {
  CodeBlock,
  PlainTextBlock,
  renderHighlightLatex,
  renderPlainWithMath,
  RichHtmlBlock,
} from "../../lib/formatWhiteboardContent";

export type BoardEntryRecord = {
  id?: string;
  type: string;
  payload: WhiteboardPayload;
  showMeta?: boolean;
  ts?: number;
};

const PREVIEW_MAX = 80;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function clipPreview(text: string): string {
  const t = text.trim();
  if (t.length <= PREVIEW_MAX) return t;
  return `${t.slice(0, PREVIEW_MAX - 1).trimEnd()}…`;
}

export function getEntryPreview(entry: BoardEntryRecord): string {
  const { type, payload: p } = entry;
  switch (type) {
    case "title":
      return clipPreview(String(p.content ?? "Section"));
    case "highlight":
      return clipPreview(`Formula: ${p.content ?? ""}`);
    case "step":
      return clipPreview(`Step ${p.number ?? "?"}: ${p.content ?? ""}`);
    case "question":
      return clipPreview(`Question: ${p.content ?? ""}`);
    case "code":
      return clipPreview(`Code (${p.language ?? "text"}): ${(p.content ?? "").split("\n")[0] ?? ""}`);
    case "rich_card":
      return clipPreview(String(p.title ?? stripTags(p.html ?? "Card")));
    case "diagram_loading":
    case "diagram_ready":
      return clipPreview(String(p.caption ?? "Diagram"));
    case "scene_loading":
    case "scene_ready":
      return clipPreview(String(p.caption ?? "Scene"));
    case "write":
    case "formula":
    default:
      return clipPreview(String(p.content ?? ""));
  }
}

function EntryShell({
  children,
  showMeta,
  meta,
  entryId,
  isLatest,
  isTitle,
  dimmed,
  toolbar,
}: {
  children: React.ReactNode;
  showMeta?: boolean;
  meta?: string;
  entryId?: string;
  isLatest?: boolean;
  isTitle?: boolean;
  dimmed?: boolean;
  toolbar?: React.ReactNode;
}) {
  const className = [
    "wb-entry",
    "wb-artifact-shell",
    isLatest ? "wb-entry--latest" : "",
    isTitle ? "wb-entry--title" : "",
    dimmed ? "wb-entry--dimmed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div id={entryId} className={className} data-board-entry={entryId}>
      {(showMeta && meta) || toolbar ? (
        <div className="wb-entry__meta-row">
          {showMeta && meta ? <div className="wb-entry__meta">{meta}</div> : <span />}
          {toolbar ? <div className="wb-entry__toolbar">{toolbar}</div> : null}
        </div>
      ) : null}
      <div className="wb-entry__host">{children}</div>
    </div>
  );
}

function EntryToolbar({
  readOnly,
  bookmarked,
  askLoading,
  onToggleBookmark,
  onAskAbout,
}: {
  readOnly?: boolean;
  bookmarked?: boolean;
  askLoading?: boolean;
  onToggleBookmark?: () => void;
  onAskAbout?: () => void;
}) {
  if (readOnly) return null;
  return (
    <>
      {onToggleBookmark ? (
        <button
          type="button"
          className={`wb-entry-btn ${bookmarked ? "wb-entry-btn--active" : ""}`}
          onClick={onToggleBookmark}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          title={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <Star className="w-3.5 h-3.5" fill={bookmarked ? "currentColor" : "none"} />
        </button>
      ) : null}
      {onAskAbout ? (
        <button
          type="button"
          className="wb-entry-btn wb-entry-btn--ask"
          onClick={onAskAbout}
          disabled={askLoading}
          aria-label="Ask tutor about this"
          title="Ask tutor about this"
        >
          {askLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="wb-entry-btn-label">Ask tutor</span>
            </>
          )}
        </button>
      ) : null}
    </>
  );
}

function QuestionDrillBlock({
  content,
  readOnly,
  onSubmitAnswer,
}: {
  content: string;
  readOnly?: boolean;
  onSubmitAnswer?: (question: string, answer: string) => Promise<RpcResult>;
}) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async () => {
    const trimmed = answer.trim();
    if (!trimmed || !onSubmitAnswer) return;
    setStatus("sending");
    const result = await onSubmitAnswer(content, trimmed);
    setStatus(result.ok ? "sent" : "error");
  };

  return (
    <div className="wb-question">
      <PlainTextBlock text={content} />
      {!readOnly ? (
        <div className="wb-question-drill">
          <textarea
            className="wb-question-input"
            rows={2}
            placeholder="Type your answer here…"
            value={answer}
            disabled={status === "sending" || status === "sent"}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (status === "error") setStatus("idle");
            }}
          />
          <button
            type="button"
            className="wb-question-submit"
            disabled={!answer.trim() || status === "sending" || status === "sent"}
            onClick={() => void handleSubmit()}
          >
            {status === "sending"
              ? "Sending to tutor…"
              : status === "sent"
                ? "Sent — listen for feedback"
                : status === "error"
                  ? "Retry send to tutor"
                  : "Send to tutor"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function WhiteboardEntryView({
  entry,
  isLatest = false,
  readOnly = false,
  dimmed = false,
  bookmarked = false,
  askLoading = false,
  onToggleBookmark,
  onAskAbout,
  onSubmitAnswer,
}: {
  entry: BoardEntryRecord;
  isLatest?: boolean;
  readOnly?: boolean;
  dimmed?: boolean;
  bookmarked?: boolean;
  askLoading?: boolean;
  onToggleBookmark?: () => void;
  onAskAbout?: () => void;
  onSubmitAnswer?: (question: string, answer: string) => Promise<RpcResult>;
}) {
  const { type, payload, showMeta, id } = entry;
  const p = payload;
  const isTitle = type === "title";
  const entryDomId = id ?? undefined;
  const toolbar = (
    <EntryToolbar
      readOnly={readOnly}
      bookmarked={bookmarked}
      askLoading={askLoading}
      onToggleBookmark={onToggleBookmark}
      onAskAbout={onAskAbout}
    />
  );

  switch (type) {
    case "title":
      return (
        <EntryShell entryId={entryDomId} isLatest={isLatest} isTitle toolbar={toolbar}>
          <div className="wb-title">{renderPlainWithMath(p.content ?? "")}</div>
        </EntryShell>
      );

    case "highlight":
      return (
        <EntryShell entryId={entryDomId} isLatest={isLatest} dimmed={dimmed} toolbar={toolbar}>
          <div className="wb-highlight">{renderHighlightLatex(p.content ?? "")}</div>
        </EntryShell>
      );

    case "write":
    case "formula":
      return (
        <EntryShell entryId={entryDomId} isLatest={isLatest} dimmed={dimmed} toolbar={toolbar}>
          <PlainTextBlock text={p.content ?? ""} />
        </EntryShell>
      );

    case "step":
      return (
        <EntryShell entryId={entryDomId} isLatest={isLatest} dimmed={dimmed} toolbar={toolbar}>
          <div className="wb-step">
            <span className="wb-step-num">{p.number}</span>
            <div className="wb-step-body">
              <PlainTextBlock text={p.content ?? ""} />
            </div>
          </div>
        </EntryShell>
      );

    case "question":
      return (
        <EntryShell entryId={entryDomId} isLatest={isLatest} dimmed={dimmed} toolbar={toolbar}>
          <QuestionDrillBlock
            content={p.content ?? ""}
            readOnly={readOnly}
            onSubmitAnswer={onSubmitAnswer}
          />
        </EntryShell>
      );

    case "code":
      return (
        <EntryShell entryId={entryDomId} isLatest={isLatest} dimmed={dimmed} toolbar={toolbar}>
          <CodeBlock content={p.content ?? ""} language={p.language} />
        </EntryShell>
      );

    case "rich_card":
      return (
        <EntryShell
          entryId={entryDomId}
          showMeta={!!p.title}
          meta={p.title}
          isLatest={isLatest}
          dimmed={dimmed}
          toolbar={toolbar}
        >
          <RichHtmlBlock html={p.html ?? ""} />
        </EntryShell>
      );

    case "diagram_loading":
      return (
        <EntryShell entryId={entryDomId} showMeta meta={p.caption ?? "Diagram"} isLatest={isLatest} dimmed={dimmed}>
          <div className="wb-diagram-loading">Generating diagram…</div>
        </EntryShell>
      );

    case "diagram_ready":
      return (
        <EntryShell
          entryId={entryDomId}
          showMeta
          meta={p.caption ?? "Diagram"}
          isLatest={isLatest}
          dimmed={dimmed}
          toolbar={toolbar}
        >
          <RichHtmlBlock html={p.html ?? ""} diagram />
        </EntryShell>
      );

    case "scene_loading":
      return (
        <EntryShell entryId={entryDomId} showMeta meta={p.caption ?? "Scene"} isLatest={isLatest} dimmed={dimmed}>
          <div className="wb-diagram-loading">Generating scene…</div>
        </EntryShell>
      );

    case "scene_ready":
      return (
        <EntryShell
          entryId={entryDomId}
          showMeta
          meta={p.caption ?? "Scene"}
          isLatest={isLatest}
          dimmed={dimmed}
          toolbar={toolbar}
        >
          {p.data_uri ? (
            <img className="wb-scene-img" src={p.data_uri} alt={p.caption ?? "Scene"} />
          ) : (
            <p className="wb-scene-error">{p.error ?? "Scene unavailable"}</p>
          )}
        </EntryShell>
      );

    default:
      return null;
  }
}
