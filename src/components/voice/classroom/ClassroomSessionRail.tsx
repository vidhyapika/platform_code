"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Network } from "lucide-react";
import { KnowledgeGraphPanel, type GraphEdge, type GraphNode } from "./KnowledgeGraph";
import { VoiceConnectionStatusView, type LoadingStep } from "./VoiceConnectionStatus";

export type TranscriptLine = { role: string; text: string; ts: number };

type RailTab = "map" | "transcript";

export function ClassroomSessionRail({
  nodes,
  edges,
  pulseId,
  zoomedOut,
  transcriptLines,
  onNodeClick,
  showDebug,
  debugProps,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pulseId: string | null;
  zoomedOut: boolean;
  transcriptLines: TranscriptLine[];
  onNodeClick?: (nodeId: string) => void;
  showDebug?: boolean;
  debugProps?: {
    loadingStep: LoadingStep;
    bootstrapStatus?: "pending" | "ready" | "failed";
    sessionId?: string | null;
    roomName?: string | null;
    tutorDataConnected?: boolean;
    lastWhiteboardType?: string | null;
  };
}) {
  const [tab, setTab] = useState<RailTab>("map");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === "transcript") {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [transcriptLines.length, tab]);

  return (
    <div className="vc-rail flex flex-col h-full min-h-0 bg-white/95 backdrop-blur-sm">
      <div className="vc-rail-tabs shrink-0">
        <button
          type="button"
          className={`vc-rail-tab ${tab === "map" ? "vc-rail-tab--active" : ""}`}
          onClick={() => setTab("map")}
        >
          <Network className="w-3.5 h-3.5" />
          Concept map
        </button>
        <button
          type="button"
          className={`vc-rail-tab ${tab === "transcript" ? "vc-rail-tab--active" : ""}`}
          onClick={() => setTab("transcript")}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Transcript
          {transcriptLines.length > 0 ? (
            <span className="vc-rail-tab-count">{transcriptLines.length}</span>
          ) : null}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-3">
        {tab === "map" ? (
          <KnowledgeGraphPanel
            nodes={nodes}
            edges={edges}
            pulseId={pulseId}
            zoomedOut={zoomedOut}
            compact
            onNodeClick={onNodeClick}
          />
        ) : (
          <div className="vc-transcript">
            {transcriptLines.length === 0 ? (
              <p className="vc-transcript-empty">Your conversation with the tutor will appear here.</p>
            ) : (
              transcriptLines.map((line, i) => (
                <div
                  key={`${line.ts}-${i}`}
                  className={`vc-transcript-bubble vc-transcript-bubble--${line.role === "student" ? "student" : "tutor"}`}
                >
                  <span className="vc-transcript-role">
                    {line.role === "student" ? "You" : "Tutor"}
                  </span>
                  <p className="vc-transcript-text">{line.text}</p>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
        )}

        {showDebug && debugProps ? (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <VoiceConnectionStatusView {...debugProps} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
