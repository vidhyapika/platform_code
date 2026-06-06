import { useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import {
  LIVEKIT_TUTOR_TOPIC,
  parseTutorEnvelope,
  type CognitiveState,
  type TutorDataEnvelope,
  type WhiteboardPayload,
} from "../../../lib/voice/voiceEvents";

type ChunkBuffer = { parts: string[]; total: number };

export function useVoiceLiveKitData(params: {
  enabled?: boolean;
  onWhiteboard: (payload: WhiteboardPayload) => void;
  onCognitive: (state: CognitiveState, reason?: string) => void;
  onTranscript: (text: string) => void;
  onSessionEnded: (notes: string, assignment: string) => void;
  onDataConnected?: () => void;
}) {
  const room = useRoomContext();
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const chunkBuffersRef = useRef(new Map<string, ChunkBuffer>());
  const connectedRef = useRef(false);

  useEffect(() => {
    if (params.enabled === false) return;

    const dispatchEnvelope = (envelope: TutorDataEnvelope) => {
      if (envelope.kind === "whiteboard") {
        const payload = envelope.payload;
        if (payload.type === "cognitive_state") {
          paramsRef.current.onCognitive(
            payload.state as CognitiveState,
            payload.reason as string | undefined
          );
        } else {
          paramsRef.current.onWhiteboard(payload);
        }
      } else if (envelope.kind === "transcript") {
        if (envelope.payload.text) paramsRef.current.onTranscript(envelope.payload.text);
      } else if (envelope.kind === "session_end") {
        paramsRef.current.onSessionEnded(
          envelope.payload.notes ?? "",
          envelope.payload.assignment ?? ""
        );
      }
    };

    const handleEnvelope = (envelope: TutorDataEnvelope | null) => {
      if (!envelope) return;

      if (envelope.kind === "chunk") {
        const { chunkId, index, total, data } = envelope.payload;
        let buf = chunkBuffersRef.current.get(chunkId);
        if (!buf) {
          buf = { parts: new Array(total).fill(""), total };
          chunkBuffersRef.current.set(chunkId, buf);
        }
        buf.parts[index] = data;
        if (buf.parts.every((p) => p !== "")) {
          chunkBuffersRef.current.delete(chunkId);
          const full = buf.parts.join("");
          handleEnvelope(parseTutorEnvelope(full));
        }
        return;
      }

      dispatchEnvelope(envelope);
    };

    const onDataReceived = (
      payload: Uint8Array,
      _participant: unknown,
      _kind: unknown,
      topic?: string
    ) => {
      if (topic && topic !== LIVEKIT_TUTOR_TOPIC) return;
      if (!connectedRef.current) {
        connectedRef.current = true;
        paramsRef.current.onDataConnected?.();
      }
      handleEnvelope(parseTutorEnvelope(payload));
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
      chunkBuffersRef.current.clear();
      connectedRef.current = false;
    };
  }, [room, params.enabled]);
}
