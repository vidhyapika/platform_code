import { buildSessionMetaForRoom } from "../../../../../backend/lib/voiceSession";

function verifyServiceSecret(req: Request): boolean {
  const secret = process.env.VOICE_AGENT_SERVICE_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-voice-agent-secret");
  if (header && header === secret) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  if (!verifyServiceSecret(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomName = new URL(req.url).searchParams.get("roomName")?.trim();
  if (!roomName) {
    return Response.json({ error: "roomName query parameter is required" }, { status: 400 });
  }

  const meta = await buildSessionMetaForRoom(roomName);
  if (!meta) {
    return Response.json({ error: "Session not found for room" }, { status: 404 });
  }

  return Response.json(meta);
}
