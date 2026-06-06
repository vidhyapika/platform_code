"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function TranscriptStrip({ lines }: { lines: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length, expanded]);

  return (
    <div
      className={`shrink-0 flex flex-col border-t border-slate-200 bg-white transition-[max-height] ${
        expanded ? "max-h-[40vh]" : "max-h-[7.5rem]"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Transcript
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0084B4] hover:text-[#006a92]"
        >
          {expanded ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Collapse
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Expand
            </>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 text-sm text-slate-700 min-h-0">
        {lines.length === 0 ? (
          <p className="text-slate-400 italic text-xs">Transcript will appear here…</p>
        ) : (
          lines.map((line, i) => (
            <p key={i} className="mb-1 leading-relaxed">
              {line}
            </p>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
