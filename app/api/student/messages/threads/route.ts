export const dynamic = "force-dynamic";
import { verifyJWT, requireRole } from "../../../../../backend/middleware/auth";
import { listThreadsForStudent } from "../../../../../backend/repositories/messageRepo";
import { serializeThread } from "../../../../../backend/utils/serializeMessage";

export async function GET(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireRole(user, "student");
  if (err) return err;

  const threads = await listThreadsForStudent(user!.sub);
  return Response.json({ threads: threads.map(serializeThread) });
}
