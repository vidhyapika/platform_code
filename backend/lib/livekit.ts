import {
  AccessToken,
  AgentDispatchClient,
  RoomServiceClient,
} from "livekit-server-sdk";

export function getLiveKitConfig() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    throw new Error("LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET must be set");
  }
  return { url, apiKey, apiSecret };
}

export function getLiveKitAgentName() {
  return process.env.LIVEKIT_AGENT_NAME ?? "vidhyapika-tutor";
}

/** LiveKit server APIs expect https/ws host, not wss. */
export function getLiveKitApiHost(livekitUrl?: string) {
  const url = livekitUrl ?? getLiveKitConfig().url;
  return url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
}

function isBenignRoomError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /already exists|duplicate|409/i.test(msg);
}

/**
 * Create the LiveKit room and dispatch exactly one named voice agent worker.
 * Idempotent when the room or dispatch already exists.
 */
export async function ensureLiveKitRoom(roomName: string) {
  const { apiKey, apiSecret } = getLiveKitConfig();
  const host = getLiveKitApiHost();
  const agentName = getLiveKitAgentName();

  const roomClient = new RoomServiceClient(host, apiKey, apiSecret);
  const dispatchClient = new AgentDispatchClient(host, apiKey, apiSecret);

  try {
    await roomClient.createRoom({
      name: roomName,
      emptyTimeout: 600,
    });
    console.log("[livekit] room created", { roomName });
  } catch (err) {
    if (!isBenignRoomError(err)) throw err;
    console.log("[livekit] room already exists", { roomName });
  }

  const existing = await dispatchClient.listDispatch(roomName);
  const alreadyDispatched = existing.some((d) => d.agentName === agentName);
  if (alreadyDispatched) {
    console.log("[livekit] agent already dispatched", { roomName, agentName });
    return;
  }

  try {
    await dispatchClient.createDispatch(roomName, agentName);
    console.log("[livekit] agent dispatched", { roomName, agentName });
  } catch (err) {
    if (!isBenignRoomError(err)) {
      console.warn("[livekit] agent dispatch failed", {
        roomName,
        agentName,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}

export async function createLiveKitToken(params: {
  roomName: string;
  identity: string;
  name?: string;
  metadata?: Record<string, unknown>;
}) {
  const { apiKey, apiSecret } = getLiveKitConfig();
  const at = new AccessToken(apiKey, apiSecret, {
    identity: params.identity,
    name: params.name ?? params.identity,
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    ttl: "2h",
  });
  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: true,
    canSubscribe: true,
  });
  return at.toJwt();
}
