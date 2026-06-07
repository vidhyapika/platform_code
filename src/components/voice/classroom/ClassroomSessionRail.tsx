"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Network } from "lucide-react";
import { KnowledgeGraphPanel, type GraphEdge, type GraphNode } from "./KnowledgeGraph";
import { VoiceConnectionStatusView, type LoadingStep } from "./VoiceConnectionStatus";

export type TranscriptLine = { role: string; text: string; ts: number };

type DebugProps = {
  loadingStep: LoadingStep;
  bootstrapStatus?: "pending" | "ready" | "failed";
  sessionId?: string | null;
  roomName?: string | null;
  tutorDataConnected?: boolean;
  lastWhiteboardType?: string | null;
};

function TranscriptBubbles({ lines }: { lines: TranscriptLine[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines.length]);

  return (
    <div className="vc-transcript">
      {lines.length === 0 ? (
        <p className="vc-transcript-empty">Your conversation with the tutor will appear here.</p>
      ) : (
        lines.map((line, i) => (
          <div
            key={`${line.ts}-${i}`}
            className={`vc-transcript-bubble vc-transcript-bubble--${line.role === "student" ? "student" : "tutor"}`}
          >
            <span className="vc-transcript-role">{line.role === "student" ? "You" : "Tutor"}</span>
            <p className="vc-transcript-text">{line.text}</p>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

export function ClassroomConceptRail({
  nodes,
  edges,
  pulseId,
  zoomedOut,
  onNodeClick,
  showDebug,
  debugProps,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pulseId: string | null;
  zoomedOut: boolean;
  onNodeClick?: (nodeId: string) => void;
  showDebug?: boolean;
  debugProps?: DebugProps;
}) {
  return (
    <div className="vc-rail vc-rail--left flex flex-col h-full min-h-0 bg-white/95 backdrop-blur-sm">
      <div className="vc-rail-header shrink-0">
        <Network className="w-3.5 h-3.5 text-[#0084B4]" />
        <div className="min-w-0">
          <p className="vc-rail-header-title">Concept map</p>
          <p className="vc-rail-header-hint">Tap a node to jump on the board</p>
        </div>
      </div>
      <div className="vc-rail-body flex-1 overflow-y-auto min-h-0 p-3">
        <KnowledgeGraphPanel
          nodes={nodes}
          edges={edges}
          pulseId={pulseId}
          zoomedOut={zoomedOut}
          compact
          onNodeClick={onNodeClick}
        />
        {showDebug && debugProps ? (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <VoiceConnectionStatusView {...debugProps} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ClassroomTranscriptRail({ transcriptLines }: { transcriptLines: TranscriptLine[] }) {
  return (
    <div className="vc-rail vc-rail--right flex flex-col h-full min-h-0 bg-white/95 backdrop-blur-sm">
      <div className="vc-rail-header shrink-0">
        <MessageSquare className="w-3.5 h-3.5 text-[#0084B4]" />
        <div className="min-w-0 flex-1">
          <p className="vc-rail-header-title">Live transcript</p>
          {transcriptLines.length > 0 ? (
            <p className="vc-rail-header-hint">{transcriptLines.length} messages</p>
          ) : (
            <p className="vc-rail-header-hint">Speak anytime — lines appear here</p>
          )}
        </div>
      </div>
      <div className="vc-transcript-panel flex-1 overflow-y-auto min-h-0 p-3">
        <TranscriptBubbles lines={transcriptLines} />
      </div>
    </div>
  );
}

type MobileTab = "map" | "transcript";

/** Mobile/tablet: tabbed aux panel above the mic bar */
export function ClassroomMobileAux({
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
  debugProps?: DebugProps;
}) {
  const [tab, setTab] = useState<MobileTab>("transcript");

  return (
    <div className="vc-mobile-aux flex flex-col min-h-0 bg-white/95">
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
          <TranscriptBubbles lines={transcriptLines} />
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

/** @deprecated Use ClassroomConceptRail + ClassroomTranscriptRail on desktop */
export function ClassroomSessionRail(props: React.ComponentProps<typeof ClassroomMobileAux>) {
  return <ClassroomMobileAux {...props} />;
}
