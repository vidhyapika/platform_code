import { useCallback, useMemo } from "react";
import { useLocalParticipant, useParticipants } from "@livekit/components-react";
import { ParticipantKind } from "livekit-client";
import {
  LIVEKIT_RPC_ASK_BOARD,
  LIVEKIT_RPC_IMAGE_ANALYSIS,
  LIVEKIT_RPC_SUBMIT_BOARD_ANSWER,
  LIVEKIT_RPC_WRAP_UP,
} from "../../../lib/voice/voiceEvents";

export type RpcResult = { ok: true } | { ok: false; error: string };

function findAgentIdentity(
  participants: ReturnType<typeof useParticipants>
): string | null {
  for (const p of participants) {
    if (p.isLocal) continue;
    if (p.kind === ParticipantKind.AGENT) return p.identity;
    const identity = p.identity.toLowerCase();
    const name = (p.name ?? "").toLowerCase();
    if (
      identity.includes("agent") ||
      identity.startsWith("agent-") ||
      identity.includes("tutor") ||
      name.includes("agent") ||
      name.includes("tutor")
    ) {
      return p.identity;
    }
  }
  return null;
}

export function useVoiceAgentRpc() {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  const agentIdentity = useMemo(
    () => findAgentIdentity(participants),
    [participants]
  );

  const rpcToAgent = useCallback(
    async (method: string, payload: string): Promise<RpcResult> => {
      if (!agentIdentity) {
        return { ok: false, error: "Tutor not connected yet — wait a moment and try again." };
      }
      try {
        await localParticipant.performRpc({
          destinationIdentity: agentIdentity,
          method,
          payload,
        });
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the tutor. Please try again." };
      }
    },
    [agentIdentity, localParticipant]
  );

  const requestWrapUp = useCallback(async () => {
    await rpcToAgent(LIVEKIT_RPC_WRAP_UP, "");
  }, [rpcToAgent]);

  const injectImageAnalysis = useCallback(
    async (text: string) => {
      await rpcToAgent(LIVEKIT_RPC_IMAGE_ANALYSIS, JSON.stringify({ text }));
    },
    [rpcToAgent]
  );

  const askAboutBoard = useCallback(
    async (context: string): Promise<RpcResult> => {
      return rpcToAgent(LIVEKIT_RPC_ASK_BOARD, JSON.stringify({ context }));
    },
    [rpcToAgent]
  );

  const submitBoardAnswer = useCallback(
    async (question: string, answer: string): Promise<RpcResult> => {
      return rpcToAgent(
        LIVEKIT_RPC_SUBMIT_BOARD_ANSWER,
        JSON.stringify({ question, answer })
      );
    },
    [rpcToAgent]
  );

  return {
    agentIdentity,
    requestWrapUp,
    injectImageAnalysis,
    askAboutBoard,
    submitBoardAnswer,
  };
}
