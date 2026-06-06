"use client";

import React, { useEffect } from "react";
import {
  useConnectionState,
  useLocalParticipant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Mic, MicOff } from "lucide-react";

export function VoiceControlBar() {
  const state = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const isConnected = state === ConnectionState.Connected;

  useEffect(() => {
    if (isConnected) {
      void localParticipant.setMicrophoneEnabled(true);
    }
  }, [isConnected, localParticipant]);

  const toggleMic = () => {
    void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  return (
    <div className="vc-mic-bar shrink-0 flex items-center justify-center gap-3 px-4 py-2.5 bg-white/95 border-t border-slate-200 backdrop-blur-sm">
      <button
        type="button"
        onClick={toggleMic}
        disabled={!isConnected}
        className={`vc-mic-btn ${isMicrophoneEnabled && isConnected ? "vc-mic-btn--on" : ""}`}
        aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isMicrophoneEnabled && isConnected ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </button>
      <span className="text-xs text-slate-500 font-medium">
        {isConnected
          ? isMicrophoneEnabled
            ? "Mic on — speak anytime"
            : "Mic muted"
          : "Connecting…"}
      </span>
    </div>
  );
}
