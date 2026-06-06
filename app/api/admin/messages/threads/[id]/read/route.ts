export const dynamic = "force-dynamic";
import { verifyJWT, requireAdmin } from "../../../../../../../backend/middleware/auth";
import {
  assertCanAccessThread,
  markThreadRead,
} from "../../../../../../../backend/repositories/messageRepo";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const { id } = await params;
  const access = await assertCanAccessThread(id, user!);
  if ("error" in access) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  await markThreadRead(id, user!.sub, "admin");
  return Response.json({ ok: true });
}
