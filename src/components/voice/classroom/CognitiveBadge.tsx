import React from "react";
import type { CognitiveState } from "../../../lib/voice/voiceEvents";

const STYLES: Record<CognitiveState, { bg: string; text: string; label: string }> = {
  FLOW: { bg: "bg-emerald-100", text: "text-emerald-800", label: "In flow" },
  CONFUSED: { bg: "bg-amber-100", text: "text-amber-900", label: "Confused" },
  BORED: { bg: "bg-slate-200", text: "text-slate-700", label: "Bored" },
  LOST: { bg: "bg-rose-100", text: "text-rose-800", label: "Lost" },
};

export function CognitiveBadge({
  state,
  reason,
}: {
  state: CognitiveState | null;
  reason?: string;
}) {
  if (!state) return null;
  const s = STYLES[state];
  return (
    <div
      className={`inline-flex flex-col gap-0.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}
      title={reason}
    >
      <span>{s.label}</span>
      {reason ? <span className="font-normal opacity-80 max-w-[200px] truncate">{reason}</span> : null}
    </div>
  );
}
