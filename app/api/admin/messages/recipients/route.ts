export const dynamic = "force-dynamic";
import { verifyJWT, requireAdmin } from "../../../../../backend/middleware/auth";
import { requireDemoScope } from "../../../../../backend/utils/demoAdminScope";
import { getRecipientsForCompose } from "../../../../../backend/repositories/messageRepo";

export async function GET(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const data = await getRecipientsForCompose();
  const demo = await requireDemoScope(user);
  if (demo) {
    return Response.json({
      standards: data.standards,
      classes: data.classes,
      students: data.students.filter((s) => s.id === demo.studentId),
    });
  }
  return Response.json(data);
}
