export const dynamic = "force-dynamic";
import { verifyJWT, requireAdmin } from "../../../../../backend/middleware/auth";
import { getTotalUnreadCount } from "../../../../../backend/repositories/messageRepo";

export async function GET(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const unreadCount = await getTotalUnreadCount(user!.sub, "admin");
  return Response.json({ unreadCount });
}
