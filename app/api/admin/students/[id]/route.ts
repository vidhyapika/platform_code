import { verifyJWT, requireAdmin } from "../../../../../backend/middleware/auth";
import {
  getUserById,
  getParentUserLinkedToStudent,
  updateUser,
  deleteUser,
  isEmailUsedByOtherUser,
  listUsersByEmail,
} from "../../../../../backend/repositories/userRepo";
import { syncStudentEnrollments, getStudentEnrollments } from "../../../../../backend/repositories/curriculumRepo";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  classIds: z.array(z.string()).optional(),
  phone: z.string().nullable().optional(),
  parentName: z.string().nullable().optional(),
  parentEmail: z.string().email().nullable().optional().or(z.literal("")).transform(v => v === "" ? null : v),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const { id } = await params;
  const student = await getUserById(id);
  if (!student || student.role !== "student") return Response.json({ error: "Not found" }, { status: 404 });

  const enrollments = await getStudentEnrollments(id);
  const classIds = enrollments.map((e) => e.classId);
  if (classIds.length === 0 && student.class_id) {
    classIds.push(student.class_id);
  }

  const linkedParent = await getParentUserLinkedToStudent(id);
  const parentName =
    (student.parentName && String(student.parentName).trim()) || linkedParent?.name || null;
  const parentEmail =
    (student.parentEmail && String(student.parentEmail).trim()) || linkedParent?.email || null;

  return Response.json({
    student: {
      ...student,
      classIds,
      parentName,
      parentEmail,
    },
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const { id } = await params;
  try {
    const before = await getUserById(id);
    if (!before || before.role !== "student") return Response.json({ error: "Not found" }, { status: 404 });

    const body = UpdateSchema.parse(await req.json());
    const { classIds, ...rest } = body;

    const nextEmail = rest.email?.toLowerCase();
    const nextParentEmail = rest.parentEmail?.toLowerCase() ?? null;
    if (nextEmail && nextParentEmail && nextEmail === nextParentEmail) {
      return Response.json(
        { error: "Student email and parent email must be different." },
        { status: 400 }
      );
    }

    if (nextEmail && nextEmail !== before.email.toLowerCase()) {
      if (await isEmailUsedByOtherUser(nextEmail, id)) {
        return Response.json({ error: "A user with this email already exists." }, { status: 409 });
      }
    }

    const patch: Record<string, unknown> = {};
    if (rest.name !== undefined) patch.name = rest.name;
    if (rest.email !== undefined) patch.email = rest.email.toLowerCase();
    if (rest.phone !== undefined) patch.phone = rest.phone;
    if (rest.parentName !== undefined) patch.parentName = rest.parentName;
    if (rest.parentEmail !== undefined) patch.parentEmail = rest.parentEmail;
    if (Object.keys(patch).length > 0) await updateUser(id, patch as Parameters<typeof updateUser>[1]);

    if (classIds) {
      await syncStudentEnrollments(id, classIds);
    }

    let warning: string | undefined;
    if (nextEmail && nextEmail !== before.email.toLowerCase()) {
      const dupes = await listUsersByEmail(before.email.toLowerCase());
      const otherParent = dupes.find((u) => u.id !== id && u.role === "parent");
      if (otherParent) {
        warning =
          "Student email updated, but a parent account still uses the previous email. Update the parent login email separately.";
      }
    }

    return Response.json({ success: true, ...(warning ? { warning } : {}) });
  } catch (e: any) {
    if (e?.name === "ZodError") return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const { id } = await params;
  await deleteUser(id);
  return Response.json({ success: true });
}
