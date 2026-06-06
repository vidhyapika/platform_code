"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { ChevronDown, Download, List, Search, X } from "lucide-react";
import type { RpcResult } from "../hooks/useVoiceAgentRpc";
import { slugCaption } from "../lib/sanitize";
import type { WhiteboardPayload } from "../../../lib/voice/voiceEvents";
import {
  downloadBoardMarkdown,
  entryKey,
  entrySearchText,
  findEntryForConcept,
  inferCurrentPhase,
  isOutlineType,
  logToBoardEntry,
  type BoardPhase,
} from "../lib/boardUtils";
import { WhiteboardEntryView, getEntryPreview, type BoardEntryRecord } from "./whiteboard/WhiteboardEntry";

type QueueItem = () => void;

const SCROLL_THRESHOLD = 100;

function isGraphEvent(type: string) {
  return type.startsWith("graph:");
}

function isBoardEntry(type: string) {
  return type !== "cognitive_state" && !isGraphEvent(type) && type !== "clear";
}

export type WhiteboardHandle = {
  scrollToEntry: (entryId: string) => void;
  scrollToConcept: (conceptId: string) => void;
  getEntries: () => BoardEntryRecord[];
};

export type WhiteboardProps = {
  onMount?: (handler: (p: WhiteboardPayload) => void) => void;
  initialLog?: Record<string, unknown>[];
  sessionId?: string;
  onAskAbout?: (context: string) => Promise<void>;
  onSubmitAnswer?: (question: string, answer: string) => Promise<RpcResult>;
};

const PHASE_LABELS: Record<BoardPhase, string> = {
  mistakes: "Mistakes",
  lesson: "Lesson",
  drills: "Practice",
  other: "Session",
};

function PhaseChips({ phase }: { phase: BoardPhase }) {
  const phases: BoardPhase[] = ["mistakes", "lesson", "drills"];
  return (
    <div className="wb-phase-chips">
      {phases.map((p) => (
        <span
          key={p}
          className={`wb-phase-chip ${phase === p ? "wb-phase-chip--active" : ""}`}
        >
          {PHASE_LABELS[p]}
        </span>
      ))}
    </div>
  );
}

function PinnedFormulasBar({ formulas }: { formulas: string[] }) {
  if (formulas.length === 0) return null;
  return (
    <div className="wb-pinned-bar">
      <span className="wb-pinned-label">Key formulas</span>
      <div className="wb-pinned-items">
        {formulas.map((f, i) => (
          <span key={`${i}-${f.slice(0, 12)}`} className="wb-pinned-item" title={f}>
            {f.length > 48 ? `${f.slice(0, 47)}…` : f}
          </span>
        ))}
      </div>
    </div>
  );
}

export const Whiteboard = forwardRef<WhiteboardHandle, WhiteboardProps>(function Whiteboard(
  { onMount, initialLog, sessionId, onAskAbout, onSubmitAnswer },
  ref
) {
  const [entries, setEntries] = useState<BoardEntryRecord[]>(() => {
    if (!initialLog?.length) return [];
    return initialLog
      .map((raw, i) => logToBoardEntry(raw, i))
      .filter((e): e is BoardEntryRecord => e !== null);
  });
  const [followLatest, setFollowLatest] = useState(true);
  const [showJumpFab, setShowJumpFab] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
  const [askingEntryKey, setAskingEntryKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const queueRef = useRef<QueueItem[]>([]);
  const runningRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const entryCounterRef = useRef(entries.length);

  const bookmarkStorageKey = sessionId ? `wb-bookmarks-${sessionId}` : null;

  useEffect(() => {
    if (!bookmarkStorageKey) return;
    try {
      const raw = localStorage.getItem(bookmarkStorageKey);
      if (raw) setBookmarks(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, [bookmarkStorageKey]);

  const persistBookmarks = useCallback(
    (next: Set<string>) => {
      setBookmarks(next);
      if (bookmarkStorageKey) {
        localStorage.setItem(bookmarkStorageKey, JSON.stringify([...next]));
      }
    },
    [bookmarkStorageKey]
  );

  const runQueue = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    while (queueRef.current.length > 0) {
      const fn = queueRef.current.shift();
      fn?.();
      await new Promise((r) => setTimeout(r, 80));
    }
    runningRef.current = false;
  }, []);

  const enqueue = useCallback(
    (fn: QueueItem) => {
      queueRef.current.push(fn);
      void runQueue();
    },
    [runQueue]
  );

  const upsertEntry = useCallback((record: BoardEntryRecord) => {
    setEntries((prev) => {
      if (!record.id) {
        const id = `wb-entry-${entryCounterRef.current++}`;
        return [...prev, { ...record, id, ts: record.ts ?? Date.now() }];
      }
      const idx = prev.findIndex((e) => e.id === record.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...record, ts: record.ts ?? next[idx].ts ?? Date.now() };
        return next;
      }
      return [...prev, { ...record, ts: record.ts ?? Date.now() }];
    });
  }, []);

  const handleEvent = useCallback(
    (payload: WhiteboardPayload) => {
      const type = String(payload.type);
      if (isGraphEvent(type)) return;

      enqueue(() => {
        if (type === "clear") return;

        if (type === "diagram_loading" || type === "diagram_ready") {
          const id = `wbdiag-${slugCaption(payload.caption ?? "diagram")}`;
          upsertEntry({ id, type, payload: { ...payload, type }, showMeta: true });
          return;
        }

        if (type === "scene_loading" || type === "scene_ready") {
          const id = `wbscene-${slugCaption(payload.caption ?? "scene")}`;
          upsertEntry({ id, type, payload: { ...payload, type }, showMeta: true });
          return;
        }

        upsertEntry({ type, payload: { ...payload, type } });
      });
    },
    [enqueue, upsertEntry]
  );

  useEffect(() => {
    onMount?.(handleEvent);
  }, [handleEvent, onMount]);

  useEffect(() => {
    if (!initialLog?.length || entries.length > 0) return;
    const hydrated = initialLog
      .map((raw, i) => logToBoardEntry(raw, i))
      .filter((e): e is BoardEntryRecord => e !== null);
    if (hydrated.length) setEntries(hydrated);
  }, [initialLog, entries.length]);

  const boardEntries = useMemo(
    () => entries.filter((e) => isBoardEntry(e.type)),
    [entries]
  );

  const currentPhase = useMemo(() => inferCurrentPhase(boardEntries), [boardEntries]);

  const pinnedFormulas = useMemo(() => {
    return boardEntries
      .filter((e) => e.type === "highlight")
      .map((e) => String(e.payload.content ?? ""))
      .slice(-3);
  }, [boardEntries]);

  const outlineEntries = useMemo(
    () =>
      boardEntries
        .map((entry, i) => ({ entry, index: i, key: entryKey(entry, i) }))
        .filter(({ entry }) => isOutlineType(entry.type)),
    [boardEntries]
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
  }, []);

  const scrollToEntryId = useCallback((entryId: string) => {
    const el = document.getElementById(entryId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFollowLatest(false);
    setShowJumpFab(true);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToEntry: scrollToEntryId,
      scrollToConcept: (conceptId: string) => {
        const target = findEntryForConcept(boardEntries, conceptId);
        if (target) scrollToEntryId(target);
      },
      getEntries: () => boardEntries,
    }),
    [boardEntries, scrollToEntryId]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const near = isNearBottom();
      setFollowLatest(near);
      setShowJumpFab(!near && boardEntries.length > 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [boardEntries.length, isNearBottom]);

  useEffect(() => {
    if (!followLatest) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [boardEntries.length, followLatest]);

  const jumpToLatest = useCallback(() => {
    setFollowLatest(true);
    setShowJumpFab(false);
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  const toggleBookmark = useCallback(
    (key: string) => {
      const next = new Set(bookmarks);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      persistBookmarks(next);
    },
    [bookmarks, persistBookmarks]
  );

  const handleAskAbout = useCallback(
    async (entry: BoardEntryRecord, key: string) => {
      if (!onAskAbout) return;
      setAskingEntryKey(key);
      try {
        await onAskAbout(getEntryPreview(entry));
      } catch (err) {
        setToast(err instanceof Error ? err.message : "Could not ask the tutor.");
      } finally {
        setAskingEntryKey(null);
      }
    },
    [onAskAbout]
  );

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="wb-shell flex flex-col h-full min-h-0">
      {toast ? <div className="wb-toast">{toast}</div> : null}
      <div className="wb-toolbar shrink-0">
        <PhaseChips phase={currentPhase} />
        <div className="wb-toolbar-actions">
          <div className="wb-search-wrap">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="search"
              className="wb-search-input"
              placeholder="Search board…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button type="button" className="wb-icon-btn" onClick={() => setSearchQuery("")} aria-label="Clear search">
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className={`wb-icon-btn ${outlineOpen ? "wb-icon-btn--active" : ""}`}
            onClick={() => setOutlineOpen((v) => !v)}
            title="Board outline"
          >
            <List className="w-4 h-4" />
          </button>
          {boardEntries.length > 0 ? (
            <button
              type="button"
              className="wb-icon-btn"
              onClick={() => downloadBoardMarkdown(boardEntries)}
              title="Download board"
            >
              <Download className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      <PinnedFormulasBar formulas={pinnedFormulas} />

      <div className="wb-body flex flex-1 min-h-0">
        {outlineOpen ? (
          <aside className="wb-outline">
            <p className="wb-outline-title">Outline</p>
            {outlineEntries.length === 0 ? (
              <p className="wb-outline-empty">Steps and sections appear here.</p>
            ) : (
              <ul className="wb-outline-list">
                {outlineEntries.map(({ entry, key }) => (
                  <li key={key}>
                    <button type="button" className="wb-outline-item" onClick={() => scrollToEntryId(key)}>
                      {getEntryPreview(entry)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        ) : null}

        <div ref={scrollRef} className="wb-root flex-1 overflow-y-auto px-4 py-4 bg-slate-50/80 min-h-0">
          <div id="whiteboard" className="min-h-full w-full max-w-5xl mx-auto space-y-3">
            {boardEntries.length === 0 ? (
              <div className="wb-empty flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
                <p className="text-sm font-semibold text-slate-500">Your lesson board</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Titles, steps, math, code, and diagrams accumulate here. Scroll anytime to review earlier content.
                </p>
              </div>
            ) : (
              boardEntries.map((entry, i) => {
                const key = entryKey(entry, i);
                const isLatest = i === boardEntries.length - 1;
                const dimmed =
                  normalizedSearch.length > 0 && !entrySearchText(entry).includes(normalizedSearch);
                return (
                  <WhiteboardEntryView
                    key={key}
                    entry={{ ...entry, id: key }}
                    isLatest={isLatest}
                    dimmed={dimmed}
                    bookmarked={bookmarks.has(key)}
                    onToggleBookmark={() => toggleBookmark(key)}
                    askLoading={askingEntryKey === key}
                    onAskAbout={onAskAbout ? () => void handleAskAbout(entry, key) : undefined}
                    onSubmitAnswer={onSubmitAnswer}
                  />
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {showJumpFab ? (
            <button type="button" className="wb-jump-latest" onClick={jumpToLatest}>
              <ChevronDown className="w-4 h-4" />
              Jump to latest
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
});
