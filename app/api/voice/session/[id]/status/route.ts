import { verifyJWT, requireAuth } from "../../../../../../backend/middleware/auth";
import { getVoiceSessionStatus } from "../../../../../../backend/lib/voiceSession";
import { getAISession } from "../../../../../../backend/repositories/progressRepo";

export async function GET(
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

  const status = await getVoiceSessionStatus(id);
  if (!status) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json(status);
}
