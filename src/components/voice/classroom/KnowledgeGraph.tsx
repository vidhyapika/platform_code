"use client";

import React, { useCallback, useState } from "react";
import type { WhiteboardPayload } from "../../../lib/voice/voiceEvents";

export type GraphNode = {
  id: string;
  label: string;
  position: string;
  state: string;
  student_teaser?: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  label?: string;
};

const POS: Record<string, { x: number; y: number }> = {
  center: { x: 50, y: 50 },
  left: { x: 20, y: 50 },
  right: { x: 80, y: 50 },
  top: { x: 50, y: 20 },
  bottom: { x: 50, y: 80 },
  "center-left": { x: 35, y: 50 },
  "center-right": { x: 65, y: 50 },
};

const STATE_COLOR: Record<string, string> = {
  unknown: "#94a3b8",
  active: "#0084b4",
  learning: "#f59e0b",
  mastered: "#10b981",
  misconception: "#ef4444",
};

export function useKnowledgeGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [zoomedOut, setZoomedOut] = useState(false);

  const handleEvent = useCallback((payload: WhiteboardPayload) => {
    const type = String(payload.type);
    if (type === "graph:add_node") {
      setNodes((prev) => {
        const filtered = prev.filter((n) => n.id !== payload.id);
        return [
          ...filtered,
          {
            id: String(payload.id),
            label: String(payload.label ?? ""),
            position: String(payload.position ?? "center"),
            state: String(payload.state ?? "unknown"),
            student_teaser: payload.student_teaser as string | undefined,
          },
        ];
      });
    } else if (type === "graph:connect") {
      setEdges((prev) => [
        ...prev,
        { from: String(payload.from), to: String(payload.to), label: payload.label as string | undefined },
      ]);
    } else if (type === "graph:set_state") {
      setNodes((prev) =>
        prev.map((n) => (n.id === payload.id ? { ...n, state: String(payload.state) } : n))
      );
    } else if (type === "graph:pulse") {
      setPulseId(String(payload.id));
      setTimeout(() => setPulseId(null), 2000);
    } else if (type === "graph:zoom_out") {
      setZoomedOut(true);
    }
  }, []);

  return { nodes, edges, pulseId, zoomedOut, handleEvent };
}

export function KnowledgeGraphPanel({
  nodes,
  edges,
  pulseId,
  zoomedOut,
  compact = false,
  onNodeClick,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pulseId: string | null;
  zoomedOut: boolean;
  compact?: boolean;
  onNodeClick?: (nodeId: string) => void;
}) {
  const heightClass = compact ? "h-40" : "min-h-[200px] h-[220px]";

  return (
    <div
      className={`flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden transition-transform ${
        zoomedOut ? "scale-[0.98] opacity-95" : ""
      }`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0084B4] px-3 py-2 border-b border-slate-100 bg-slate-50/80">
        Concept map
      </p>
      <div className={`relative w-full ${heightClass}`}>
        {nodes.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 px-3 text-center">
            Concepts appear as your tutor builds the lesson map.
          </p>
        ) : (
          <>
            <svg className="absolute inset-0 w-full h-full">
              {edges.map((e) => {
                const from = nodes.find((n) => n.id === e.from);
                const to = nodes.find((n) => n.id === e.to);
                if (!from || !to) return null;
                const p1 = POS[from.position] ?? POS.center;
                const p2 = POS[to.position] ?? POS.center;
                return (
                  <line
                    key={`${e.from}-${e.to}`}
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                  />
                );
              })}
            </svg>
            {nodes.map((n) => {
              const p = POS[n.position] ?? POS.center;
              const color = STATE_COLOR[n.state] ?? STATE_COLOR.unknown;
              return (
                <div
                  key={n.id}
                  role={onNodeClick ? "button" : undefined}
                  tabIndex={onNodeClick ? 0 : undefined}
                  onClick={onNodeClick ? () => onNodeClick(n.id) : undefined}
                  onKeyDown={
                    onNodeClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") onNodeClick(n.id);
                        }
                      : undefined
                  }
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow max-w-[90px] truncate ${
                    pulseId === n.id ? "ring-2 ring-[#0084B4] scale-110 z-10" : ""
                  } ${onNodeClick ? "cursor-pointer hover:scale-105" : ""}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: color }}
                  title={n.student_teaser ?? n.label}
                >
                  {n.label}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use useKnowledgeGraph + KnowledgeGraphPanel in VoiceClassroomPanel */
export function KnowledgeGraph({
  onMount,
  compact = false,
}: {
  onMount?: (handler: (p: WhiteboardPayload) => void) => void;
  compact?: boolean;
}) {
  const graph = useKnowledgeGraph();
  React.useEffect(() => {
    onMount?.(graph.handleEvent);
  }, [graph.handleEvent, onMount]);
  return (
    <KnowledgeGraphPanel
      nodes={graph.nodes}
      edges={graph.edges}
      pulseId={graph.pulseId}
      zoomedOut={graph.zoomedOut}
      compact={compact}
    />
  );
}
