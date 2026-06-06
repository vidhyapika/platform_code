export const dynamic = "force-dynamic";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { verifyJWT, requireAdmin } from "../../../../../backend/middleware/auth";
import { requireDemoScope } from "../../../../../backend/utils/demoAdminScope";
import {
  getPrerequisite,
  getSubTopic,
  getTopic,
} from "../../../../../backend/repositories/curriculumRepo";
import {
  getQuestionFlag,
  updateQuestionFlag,
} from "../../../../../backend/repositories/questionFlagRepo";
import { getStudentEnrollments } from "../../../../../backend/repositories/curriculumRepo";
import { getUserById } from "../../../../../backend/repositories/userRepo";
import { serializeQuestionFlag } from "../../../../../backend/utils/serializeQuestionFlag";

const PatchSchema = z.object({
  status: z.enum(["open", "in_review", "resolved", "rejected"]).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const { id } = await params;
  const flag = await getQuestionFlag(id);
  if (!flag) return Response.json({ error: "Not found" }, { status: 404 });

  const demo = await requireDemoScope(user);
  if (demo && flag.studentId !== demo.studentId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await getUserById(flag.studentId);
  const topic = await getTopic(flag.topicId);
  let contextLabel: string = flag.contextType;
  if (flag.contextType === "prereq") {
    const p = await getPrerequisite(flag.topicId);
    contextLabel = p?.name ? `Prerequisite: ${p.name}` : "Prerequisite";
  } else if (flag.contextType === "subtopic") {
    const st = await getSubTopic(flag.contextId);
    contextLabel = st?.name ? `Subtopic: ${st.name}` : "Subtopic quiz";
  } else {
    contextLabel = "Final test";
  }

  const enrollments = await getStudentEnrollments(flag.studentId);

  return Response.json({
    flag: serializeQuestionFlag(flag),
    student: student
      ? { id: student.id, name: student.name, email: student.email }
      : null,
    topicName: topic?.name ?? "",
    contextLabel,
    enrollments: enrollments.map((e) => ({ classId: e.classId })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const { id } = await params;
  const flag = await getQuestionFlag(id);
  if (!flag) return Response.json({ error: "Not found" }, { status: 404 });

  const demo = await requireDemoScope(user);
  if (demo && flag.studentId !== demo.studentId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = PatchSchema.parse(await req.json());
    const patch: Record<string, unknown> = {};
    if (body.adminNotes !== undefined) patch.adminNotes = body.adminNotes;
    if (body.status) {
      patch.status = body.status;
      if (body.status === "resolved" || body.status === "rejected") {
        patch.resolvedAt = FieldValue.serverTimestamp();
        patch.resolvedBy = user!.sub;
      }
    }
    await updateQuestionFlag(id, patch as any);
    const updated = await getQuestionFlag(id);
    return Response.json({ flag: serializeQuestionFlag(updated!) });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}
