"use client";

import React, { useMemo } from "react";
import { logToBoardEntry } from "../../lib/boardUtils";
import { WhiteboardEntryView } from "./WhiteboardEntry";

export function WhiteboardReplay({ log }: { log: Record<string, unknown>[] }) {
  const entries = useMemo(
    () =>
      log
        .map((raw, i) => logToBoardEntry(raw, i))
        .filter((e): e is NonNullable<typeof e> => e !== null),
    [log]
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic px-1">
        No whiteboard content was saved for this session.
      </p>
    );
  }

  return (
    <div className="wb-replay space-y-3 max-h-[min(70vh,640px)] overflow-y-auto pr-1">
      {entries.map((entry, i) => (
        <WhiteboardEntryView key={entry.id ?? `replay-${i}`} entry={entry} readOnly />
      ))}
    </div>
  );
}
