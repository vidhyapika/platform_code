import { randomUUID } from "node:crypto";
import type { LocalParticipant } from "@livekit/rtc-node";
import {
  encodeTutorEnvelope,
  LIVEKIT_DATA_MAX_BYTES,
  LIVEKIT_TUTOR_TOPIC,
  type TutorDataEnvelope,
  type WhiteboardPayload,
} from "../../lib/voiceEvents.js";
import { normalizeBoardPayload } from "./normalizeBoardPayload.js";

export class WhiteboardPublisher {
  constructor(
    private participant: LocalParticipant,
    private sessionId?: string
  ) {}

  private async publishEnvelope(envelope: TutorDataEnvelope) {
    const bytes = encodeTutorEnvelope(envelope);
    if (bytes.byteLength <= LIVEKIT_DATA_MAX_BYTES) {
      await this.participant.publishData(bytes, {
        reliable: true,
        topic: LIVEKIT_TUTOR_TOPIC,
      });
      return;
    }

    const chunkId = randomUUID();
    const full = new TextDecoder().decode(bytes);
    const chunkSize = 50_000;
    const total = Math.ceil(full.length / chunkSize);
    for (let index = 0; index < total; index++) {
      const chunkEnvelope: TutorDataEnvelope = {
        kind: "chunk",
        payload: {
          chunkId,
          index,
          total,
          data: full.slice(index * chunkSize, (index + 1) * chunkSize),
        },
      };
      await this.participant.publishData(encodeTutorEnvelope(chunkEnvelope), {
        reliable: true,
        topic: LIVEKIT_TUTOR_TOPIC,
      });
    }
  }

  async publish(payload: Record<string, unknown>) {
    const normalized = normalizeBoardPayload(payload) as WhiteboardPayload;
    await this.publishEnvelope({ kind: "whiteboard", payload: normalized });
  }

  async transcript(text: string) {
    await this.publishEnvelope({ kind: "transcript", payload: { text } });
  }

  async endSession(notes: string, assignment: string) {
    await this.publishEnvelope({
      kind: "session_end",
      payload: { notes, assignment },
    });

    if (this.sessionId) {
      void this.notifyComplete(notes, assignment);
    }
  }

  private async notifyComplete(notes: string, assignment: string) {
    const base =
      process.env.NEXT_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
    const secret = process.env.VOICE_AGENT_SERVICE_SECRET;
    if (!secret || !this.sessionId) return;

    try {
      await fetch(`${base.replace(/\/$/, "")}/api/voice/session/${this.sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          assignment,
          serviceSecret: secret,
        }),
      });
    } catch (e) {
      console.error("[voice-agent] complete callback failed", e);
    }
  }

  async title(content: string) {
    await this.publish({ type: "title", content });
    return "Title written on board.";
  }

  async highlight(content: string) {
    await this.publish({ type: "highlight", content });
    return "Highlight written.";
  }

  async write(content: string) {
    await this.publish({ type: "write", content });
    return "Content written.";
  }

  async step(number: number, content: string) {
    await this.publish({ type: "step", number, content });
    return "Step shown.";
  }

  async question(content: string) {
    await this.publish({ type: "question", content });
    return "Question shown.";
  }

  async code(content: string, language = "text") {
    await this.publish({ type: "code", content, language });
    return "Code shown.";
  }

  async richCard(title: string, html: string) {
    await this.publish({ type: "rich_card", title, html });
    return "Rich card shown.";
  }

  async clear() {
    await this.publish({ type: "clear" });
    return "Board cleared.";
  }

  async cognitiveState(state: string, reason: string) {
    await this.publish({ type: "cognitive_state", state, reason });
    return `Cognitive state set to ${state}.`;
  }

  async graphAddNode(params: Record<string, unknown>) {
    await this.publish({ type: "graph:add_node", ...params });
    return "Concept node added.";
  }

  async graphConnect(params: Record<string, unknown>) {
    await this.publish({ type: "graph:connect", ...params });
    return "Concepts connected.";
  }

  async graphSetState(id: string, state: string) {
    await this.publish({ type: "graph:set_state", id, state });
    return "Node state updated.";
  }

  async graphPulse(id: string) {
    await this.publish({ type: "graph:pulse", id });
    return "Concept focused.";
  }

  async graphZoomOut() {
    await this.publish({ type: "graph:zoom_out" });
    return "Graph zoomed out.";
  }

  async diagramLoading(caption: string) {
    await this.publish({ type: "diagram_loading", caption });
    return "Diagram loading.";
  }

  async diagramReady(caption: string, html: string) {
    await this.publish({ type: "diagram_ready", caption, html });
    return "Diagram ready.";
  }

  async sceneLoading(caption: string) {
    await this.publish({ type: "scene_loading", caption });
    return "Scene loading.";
  }

  async sceneReady(caption: string, data_uri: string, error?: string) {
    await this.publish({ type: "scene_ready", caption, data_uri, error });
    return "Scene ready.";
  }
}
