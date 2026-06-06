import { verifyJWT, requireAuth } from "../../../../../../backend/middleware/auth";
import { getAISession } from "../../../../../../backend/repositories/progressRepo";
import { createLiveKitToken } from "../../../../../../backend/lib/livekit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAuth(user);
  if (err) return err;

  const { id } = await params;
  const session = await getAISession(id);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.studentId !== user!.sub) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.roomName) {
    return Response.json({ error: "Not a voice session" }, { status: 400 });
  }

  const token = await createLiveKitToken({
    roomName: session.roomName,
    identity: `student-${user!.sub}`,
    name: "Student",
    metadata: { sessionId: id, role: "student" },
  });

  return Response.json({
    token,
    livekitUrl: session.livekitUrl,
    roomName: session.roomName,
  });
}
