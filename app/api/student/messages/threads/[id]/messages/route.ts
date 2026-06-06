export const dynamic = "force-dynamic";
import { z } from "zod";
import { verifyJWT, requireRole } from "../../../../../../../backend/middleware/auth";
import {
  assertCanAccessThread,
  postMessage,
} from "../../../../../../../backend/repositories/messageRepo";
import { serializeMessage } from "../../../../../../../backend/utils/serializeMessage";

const BodySchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireRole(user, "student");
  if (err) return err;

  const { id } = await params;
  const access = await assertCanAccessThread(id, user!);
  if ("error" in access) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const body = BodySchema.parse(await req.json());
  const message = await postMessage({
    threadId: id,
    senderId: user!.sub,
    senderRole: "student",
    body: body.body,
  });
  return Response.json({ message: serializeMessage(message) }, { status: 201 });
}
