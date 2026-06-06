import { useEffect, useRef } from "react";
import { useConnectionState, useParticipants } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import type { LoadingStep } from "./VoiceConnectionStatus";

export function VoiceLiveKitTracker({
  sessionId,
  mode,
  onLoadingStep,
  onLiveKitConnected,
}: {
  sessionId: string | null;
  mode: "default" | "sandbox";
  onLoadingStep: (step: LoadingStep) => void;
  onLiveKitConnected?: () => void;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const startedRef = useRef(false);

  useEffect(() => {
    if (connectionState === ConnectionState.Connecting) {
      onLoadingStep("livekit");
    }
    if (connectionState === ConnectionState.Connected) {
      onLoadingStep("agent");
      if (!startedRef.current && sessionId && mode === "default") {
        startedRef.current = true;
        void onLiveKitConnected?.();
      }
    }
  }, [connectionState, sessionId, mode, onLoadingStep, onLiveKitConnected]);

  useEffect(() => {
    const agentPresent = participants.some((p) => {
      if (p.isLocal) return false;
      const identity = p.identity.toLowerCase();
      const name = (p.name ?? "").toLowerCase();
      return (
        identity.includes("agent") ||
        identity.startsWith("agent-") ||
        identity.includes("tutor") ||
        name.includes("agent") ||
        name.includes("tutor") ||
        (typeof p.metadata === "string" &&
          (p.metadata.includes("agent") || p.metadata.includes("tutor")))
      );
    });
    if (connectionState === ConnectionState.Connected && agentPresent) {
      onLoadingStep("ready");
    }
  }, [participants, connectionState, onLoadingStep]);

  return null;
}
