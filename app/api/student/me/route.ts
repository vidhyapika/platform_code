export const dynamic = 'force-dynamic';
import { verifyJWT, requireRole } from "../../../../backend/middleware/auth";
import { getUserById } from "../../../../backend/repositories/userRepo";
import { getStudentEnrollment, getClass } from "../../../../backend/repositories/curriculumRepo";

function studentDisplayName(u: {
  name: string | null;
  email: string;
  parentName?: string | null;
}): string {
  const name = u.name?.trim();
  const parentName = u.parentName?.trim();
  if (name && (!parentName || name.toLowerCase() !== parentName.toLowerCase())) {
    return name;
  }
  const local = u.email.split("@")[0]?.trim();
  return local || "Student";
}

export async function GET(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireRole(user, "student");
  if (err) return err;

  const u = await getUserById(user!.sub);
  if (!u) return Response.json({ error: "User not found" }, { status: 404 });

  let cls: { id: string; name: string } | null = null;
  const enrollment = await getStudentEnrollment(u.id);
  if (enrollment) {
    const c = await getClass(enrollment.classId);
    if (c) cls = { id: c.id, name: c.name };
  }

  const displayName = studentDisplayName(u);

  return Response.json({
    user: { id: u.id, name: u.name, email: u.email, role: u.role, displayName },
    class: cls,
  });
}
