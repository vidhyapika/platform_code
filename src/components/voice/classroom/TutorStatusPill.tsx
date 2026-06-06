"use client";

import React from "react";
import type { LoadingStep } from "./VoiceConnectionStatus";

export function TutorStatusPill({
  loadingStep,
  tutorDataConnected,
}: {
  loadingStep: LoadingStep;
  tutorDataConnected?: boolean;
}) {
  let label = "Connecting…";
  let className = "vc-pill vc-pill--connecting";

  if (loadingStep === "ready" && tutorDataConnected) {
    label = "Live";
    className = "vc-pill vc-pill--live";
  } else if (loadingStep === "ready") {
    label = "Tutor ready";
    className = "vc-pill vc-pill--live";
  } else if (loadingStep === "agent") {
    label = "Joining tutor…";
    className = "vc-pill vc-pill--connecting";
  } else if (loadingStep === "livekit") {
    label = "Connecting voice…";
    className = "vc-pill vc-pill--connecting";
  }

  return (
    <span className={className}>
      <span className="vc-pill__dot" aria-hidden />
      {label}
    </span>
  );
}
