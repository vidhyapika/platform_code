"use client";

import React from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";

export function LiveKitVoiceRoom({
  token,
  serverUrl,
  roomName,
  children,
}: {
  token: string;
  serverUrl: string;
  /** Ensures remount when the API room changes; token grant still defines the LiveKit room. */
  roomName?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <LiveKitRoom
      key={roomName ?? token}
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video={false}
      className="contents"
    >
      <RoomAudioRenderer />
      {children}
    </LiveKitRoom>
  );
}
