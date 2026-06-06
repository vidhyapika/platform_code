import type { WhiteboardPayload } from "../../../lib/voice/voiceEvents";
import type { BoardEntryRecord } from "../classroom/whiteboard/WhiteboardEntry";
import { getEntryPreview } from "../classroom/whiteboard/WhiteboardEntry";

export type BoardPhase = "mistakes" | "lesson" | "drills" | "other";

export function entryKey(entry: BoardEntryRecord, index: number): string {
  return entry.id ?? `entry-${index}-${entry.type}`;
}

export function isOutlineType(type: string): boolean {
  return type === "title" || type === "step" || type === "question";
}

export function detectPhaseFromTitle(text: string): BoardPhase {
  const t = text.toLowerCase();
  if (/mistake|wrong|error|diagnos|review/.test(t)) return "mistakes";
  if (/lesson|learn|concept|topic/.test(t)) return "lesson";
  if (/drill|practice|question|quiz|exercise/.test(t)) return "drills";
  return "other";
}

export function inferCurrentPhase(entries: BoardEntryRecord[]): BoardPhase {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].type === "title") {
      return detectPhaseFromTitle(String(entries[i].payload.content ?? ""));
    }
  }
  return "other";
}

export function logToBoardEntry(raw: Record<string, unknown>, index: number): BoardEntryRecord | null {
  const type = String(raw.type ?? "");
  if (!type || type === "cognitive_state" || type.startsWith("graph:") || type === "clear") {
    return null;
  }
  const ts = typeof raw.ts === "number" ? raw.ts : undefined;
  const id =
    typeof raw.id === "string"
      ? raw.id
      : type === "diagram_loading" || type === "diagram_ready"
        ? `wbdiag-${index}`
        : type === "scene_loading" || type === "scene_ready"
          ? `wbscene-${index}`
          : `wb-entry-${index}`;
  return {
    id,
    type,
    ts,
    payload: raw as WhiteboardPayload,
    showMeta: type.startsWith("diagram_") || type.startsWith("scene_") || type === "rich_card",
  };
}

export function exportBoardAsMarkdown(entries: BoardEntryRecord[]): string {
  const lines: string[] = ["# Lesson board", ""];
  entries.forEach((entry, i) => {
    const p = entry.payload;
    switch (entry.type) {
      case "title":
        lines.push(`## ${p.content ?? "Section"}`, "");
        break;
      case "highlight":
        lines.push(`**Formula:** \`${p.content ?? ""}\``, "");
        break;
      case "step":
        lines.push(`**Step ${p.number ?? i + 1}:** ${p.content ?? ""}`, "");
        break;
      case "question":
        lines.push(`**Question:** ${p.content ?? ""}`, "");
        break;
      case "rich_card":
        lines.push(`### ${p.title ?? "Card"}`, p.html ? String(p.html).replace(/<[^>]+>/g, " ").trim() : "", "");
        break;
      case "write":
      case "formula":
        lines.push(String(p.content ?? ""), "");
        break;
      case "code":
        lines.push("```" + (p.language ?? "text"), String(p.content ?? ""), "```", "");
        break;
      default:
        if (p.caption) lines.push(`*${p.caption}*`, "");
        break;
    }
  });
  return lines.join("\n");
}

export function downloadBoardMarkdown(entries: BoardEntryRecord[], filename = "lesson-board.md") {
  const md = exportBoardAsMarkdown(entries);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function entrySearchText(entry: BoardEntryRecord): string {
  return getEntryPreview(entry).toLowerCase();
}

export function findEntryForConcept(entries: BoardEntryRecord[], conceptId: string): string | null {
  const needle = conceptId.toLowerCase();
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    const text = entrySearchText(entry);
    if (text.includes(needle)) return entryKey(entry, i);
  }
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].type === "title") return entryKey(entries[i], i);
  }
  return entries.length ? entryKey(entries[entries.length - 1], entries.length - 1) : null;
}
