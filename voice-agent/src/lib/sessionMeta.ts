import type { SessionMeta } from "./voiceEvents.js";

export async function fetchSessionMeta(roomName: string): Promise<SessionMeta | null> {
  const base =
    process.env.NEXT_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const secret = process.env.VOICE_AGENT_SERVICE_SECRET;
  if (!secret) {
    console.error("[voice-agent] VOICE_AGENT_SERVICE_SECRET not set — cannot fetch session meta", {
      baseUrl: base,
      roomName,
    });
    return null;
  }

  const url = `${base.replace(/\/$/, "")}/api/voice/internal/session-meta?roomName=${encodeURIComponent(roomName)}`;
  try {
    const res = await fetch(url, {
      headers: { "x-voice-agent-secret": secret },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[voice-agent] session-meta HTTP error", {
        status: res.status,
        url,
        baseUrl: base,
        roomName,
        body: body.slice(0, 200),
      });
      return null;
    }
    return (await res.json()) as SessionMeta;
  } catch (e) {
    console.error("[voice-agent] session-meta fetch failed", {
      url,
      baseUrl: base,
      roomName,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
