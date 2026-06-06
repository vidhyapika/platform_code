import { verifyJWT, requireAuth } from "../../../../../../backend/middleware/auth";
import { recordVoiceSessionStarted } from "../../../../../../backend/lib/voiceSession";
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
  if (session.studentId !== user!.sub) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await recordVoiceSessionStarted(id);
  return Response.json({ ok: true });
}
