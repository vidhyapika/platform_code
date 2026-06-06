import { verifyJWT, requireAuth } from "../../../../../../backend/middleware/auth";
import { getAISession } from "../../../../../../backend/repositories/progressRepo";
import { completeVoiceSession } from "../../../../../../backend/lib/voiceSession";
import { z } from "zod";

const CompleteSchema = z.object({
  notes: z.string(),
  assignment: z.string(),
  transcript: z
    .array(z.object({ role: z.string(), text: z.string(), ts: z.number() }))
    .optional(),
  whiteboardLog: z.array(z.record(z.string(), z.unknown())).optional(),
  serviceSecret: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = CompleteSchema.parse(await req.json());

  const serviceSecret = process.env.VOICE_AGENT_SERVICE_SECRET;
  const isService =
    serviceSecret && body.serviceSecret && body.serviceSecret === serviceSecret;

  if (!isService) {
    const user = await verifyJWT(req.headers.get("authorization"));
    const err = requireAuth(user);
    if (err) return err;
    const session = await getAISession(id);
    if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
    if (session.studentId !== user!.sub) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await completeVoiceSession(id, {
    notes: body.notes,
    assignment: body.assignment,
    transcript: body.transcript,
    whiteboardLog: body.whiteboardLog,
  });

  return Response.json({ ok: true });
}
