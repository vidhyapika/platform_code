import { verifyJWT, requireAuth } from "../../../../../../backend/middleware/auth";
import { bootstrapVoiceSession } from "../../../../../../backend/lib/voiceSession";
import { getAISession } from "../../../../../../backend/repositories/progressRepo";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAuth(user);
  if (err) return err;

  const { id } = await params;
  const session = await getAISession(id);
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.studentId !== user!.sub && user!.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.roomName) {
    return Response.json({ error: "Session has no room" }, { status: 400 });
  }

  void bootstrapVoiceSession(id, session.roomName).catch((e) => {
    console.error("[voice] retry bootstrap error", e);
  });

  return Response.json({ ok: true, bootstrapStatus: "pending" });
}
