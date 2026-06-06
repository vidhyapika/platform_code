export const dynamic = "force-dynamic";
import { verifyJWT, requireRole } from "../../../../../backend/middleware/auth";
import { getTotalUnreadCount } from "../../../../../backend/repositories/messageRepo";

export async function GET(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireRole(user, "student");
  if (err) return err;

  const unreadCount = await getTotalUnreadCount(user!.sub, "student");
  return Response.json({ unreadCount });
}
