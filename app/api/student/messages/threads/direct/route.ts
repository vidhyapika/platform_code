export const dynamic = "force-dynamic";
import { z } from "zod";
import { verifyJWT, requireRole } from "../../../../../../backend/middleware/auth";
import { createDirectThreadWithMessage } from "../../../../../../backend/repositories/messageRepo";
import { serializeThread } from "../../../../../../backend/utils/serializeMessage";

const BodySchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireRole(user, "student");
  if (err) return err;

  const body = BodySchema.parse(await req.json());
  const thread = await createDirectThreadWithMessage({
    studentId: user!.sub,
    createdBy: user!.sub,
    body: body.body,
    senderId: user!.sub,
    senderRole: "student",
  });
  return Response.json({ thread: serializeThread({ ...thread, unreadCount: 0 }) }, { status: 201 });
}
