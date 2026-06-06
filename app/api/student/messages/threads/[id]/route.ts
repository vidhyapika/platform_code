export const dynamic = "force-dynamic";
import { verifyJWT, requireRole } from "../../../../../../backend/middleware/auth";
import {
  assertCanAccessThread,
  listMessages,
  markThreadRead,
} from "../../../../../../backend/repositories/messageRepo";
import { serializeMessage, serializeThread } from "../../../../../../backend/utils/serializeMessage";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireRole(user, "student");
  if (err) return err;

  const { id } = await params;
  const access = await assertCanAccessThread(id, user!);
  if ("error" in access) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const messages = await listMessages(id);
  await markThreadRead(id, user!.sub, "student");

  return Response.json({
    thread: serializeThread({ ...access.thread, unreadCount: 0 }),
    messages: messages.map(serializeMessage),
  });
}
