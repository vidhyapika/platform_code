"use client";

import React, { useImperativeHandle, forwardRef } from "react";
import type { CognitiveState, WhiteboardPayload } from "../../../lib/voice/voiceEvents";
import { useVoiceLiveKitData } from "../hooks/useVoiceLiveKitData";
import { useVoiceAgentRpc } from "../hooks/useVoiceAgentRpc";

export type VoiceLiveKitSessionBridgeHandle = {
  requestWrapUp: () => Promise<void>;
  injectImageAnalysis: (text: string) => Promise<void>;
};

export const VoiceLiveKitSessionBridge = forwardRef<
  VoiceLiveKitSessionBridgeHandle,
  {
    enabled?: boolean;
    onWhiteboard: (payload: WhiteboardPayload) => void;
    onCognitive: (state: CognitiveState, reason?: string) => void;
    onTranscript: (text: string) => void;
    onSessionEnded: (notes: string, assignment: string) => void;
    onDataConnected?: () => void;
  }
>(function VoiceLiveKitSessionBridge(
  {
    enabled = true,
    onWhiteboard,
    onCognitive,
    onTranscript,
    onSessionEnded,
    onDataConnected,
  },
  ref
) {
  const { requestWrapUp, injectImageAnalysis } = useVoiceAgentRpc();

  useVoiceLiveKitData({
    enabled,
    onWhiteboard,
    onCognitive,
    onTranscript,
    onSessionEnded,
    onDataConnected,
  });

  useImperativeHandle(ref, () => ({ requestWrapUp, injectImageAnalysis }), [
    requestWrapUp,
    injectImageAnalysis,
  ]);

  return null;
});
