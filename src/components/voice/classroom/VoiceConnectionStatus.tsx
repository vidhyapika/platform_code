"use client";



import React, { useMemo } from "react";

import { useConnectionState, useParticipants } from "@livekit/components-react";

import { ConnectionState } from "livekit-client";

import { Loader2, Radio } from "lucide-react";



export type LoadingStep = "api" | "livekit" | "agent" | "ready";



export type VoiceConnectionStatusProps = {

  loadingStep: LoadingStep;

  bootstrapStatus?: "pending" | "ready" | "failed";

  sessionId?: string | null;

  roomName?: string | null;

  tutorDataConnected?: boolean;

  lastWhiteboardType?: string | null;

  livekitLabel?: string;

  agentPresent?: boolean;

};



/** Connection/bootstrap checklist — safe outside LiveKit room (no LiveKit hooks). */

export function VoiceConnectionStatusView({

  loadingStep,

  bootstrapStatus,

  sessionId,

  roomName,

  tutorDataConnected,

  lastWhiteboardType,

  livekitLabel = "—",

  agentPresent = false,

}: VoiceConnectionStatusProps) {

  const steps: { key: LoadingStep; label: string }[] = [

    { key: "api", label: "Preparing session…" },

    { key: "livekit", label: "Connecting to voice…" },

    { key: "agent", label: "Waiting for AI tutor…" },

    { key: "ready", label: "Tutor connected" },

  ];



  const stepIndex = steps.findIndex((s) => s.key === loadingStep);



  return (

    <div className="space-y-3 text-xs">

      <ul className="space-y-1.5">

        {steps.map((step, i) => {

          const done = i < stepIndex || loadingStep === "ready";

          const active = step.key === loadingStep && loadingStep !== "ready";

          return (

            <li

              key={step.key}

              className={`flex items-center gap-2 ${

                done ? "text-emerald-700" : active ? "text-[#0084B4]" : "text-slate-400"

              }`}

            >

              {active ? (

                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />

              ) : done ? (

                <Radio className="w-3.5 h-3.5 shrink-0" />

              ) : (

                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />

              )}

              <span className="font-semibold">{step.label}</span>

            </li>

          );

        })}

      </ul>



      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-1 font-mono text-[10px] text-slate-600">

        <p>

          <span className="font-bold text-slate-500">LiveKit:</span> {livekitLabel}

          {agentPresent ? " · agent in room" : ""}

        </p>

        <p>

          <span className="font-bold text-slate-500">Tutor events:</span>{" "}

          {tutorDataConnected ? (

            <span className="text-emerald-700">receiving</span>

          ) : agentPresent ? (

            <span className="text-slate-500">waiting for first event…</span>

          ) : (

            <span className="text-slate-400">—</span>

          )}

        </p>

        {bootstrapStatus ? (

          <p>

            <span className="font-bold text-slate-500">Bootstrap:</span> {bootstrapStatus}

          </p>

        ) : null}

        {lastWhiteboardType ? (

          <p>

            <span className="font-bold text-slate-500">Last board:</span> {lastWhiteboardType}

          </p>

        ) : null}

        {sessionId ? <p className="truncate">session: {sessionId}</p> : null}

        {roomName ? <p className="truncate">room: {roomName}</p> : null}

      </div>

    </div>

  );

}



/** Must render inside LiveKitRoom — reads connection state from room context. */

export function VoiceConnectionStatus(props: Omit<VoiceConnectionStatusProps, "livekitLabel" | "agentPresent">) {

  const connectionState = useConnectionState();

  const participants = useParticipants();



  const agentPresent = useMemo(

    () =>

      participants.some(

        (p) =>

          !p.isLocal &&

          (p.identity.includes("agent") ||

            p.name?.toLowerCase().includes("agent") ||

            (typeof p.metadata === "string" && p.metadata.includes("agent")))

      ),

    [participants]

  );



  const livekitLabel =

    connectionState === ConnectionState.Connected

      ? "Connected"

      : connectionState === ConnectionState.Connecting

        ? "Connecting…"

        : connectionState === ConnectionState.Reconnecting

          ? "Reconnecting…"

          : "Disconnected";



  return (

    <VoiceConnectionStatusView

      {...props}

      livekitLabel={livekitLabel}

      agentPresent={agentPresent}

    />

  );

}

