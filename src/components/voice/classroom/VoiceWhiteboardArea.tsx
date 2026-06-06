"use client";

import React from "react";
import { Whiteboard, type WhiteboardHandle } from "./Whiteboard";
import { useVoiceAgentRpc } from "../hooks/useVoiceAgentRpc";
import type { WhiteboardPayload } from "../../../lib/voice/voiceEvents";

export type VoiceWhiteboardAreaProps = {
  onMount: (handler: (p: WhiteboardPayload) => void) => void;
  sessionId?: string;
  initialLog?: Record<string, unknown>[];
  whiteboardRef?: React.Ref<WhiteboardHandle>;
};

export function VoiceWhiteboardArea({
  onMount,
  sessionId,
  initialLog,
  whiteboardRef,
}: VoiceWhiteboardAreaProps) {
  const { askAboutBoard, submitBoardAnswer } = useVoiceAgentRpc();

  const handleAsk = async (context: string) => {
    const result = await askAboutBoard(context);
    if (!result.ok) throw new Error(result.error);
  };

  return (
    <Whiteboard
      ref={whiteboardRef}
      onMount={onMount}
      sessionId={sessionId}
      initialLog={initialLog}
      onAskAbout={handleAsk}
      onSubmitAnswer={submitBoardAnswer}
    />
  );
}
