export const dynamic = "force-dynamic";
import { z } from "zod";
import { verifyJWT, requireAdmin } from "../../../../../backend/middleware/auth";
import { requireDemoScope } from "../../../../../backend/utils/demoAdminScope";
import {
  createDirectThreadWithMessage,
  createGroupThread,
  listThreadsForAdmin,
  type MessageAudience,
} from "../../../../../backend/repositories/messageRepo";
import { serializeThread } from "../../../../../backend/utils/serializeMessage";
import { getUserById } from "../../../../../backend/repositories/userRepo";

const ComposeSchema = z.object({
  audienceType: z.enum(["all", "standard", "class", "student"]),
  standardId: z.string().optional(),
  classId: z.string().optional(),
  studentId: z.string().optional(),
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(4000),
});

export async function GET(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const demo = await requireDemoScope(user);
  const allowedStudentIds = demo ? new Set([demo.studentId]) : null;
  const threads = await listThreadsForAdmin(user!.sub, allowedStudentIds);
  return Response.json({ threads: threads.map(serializeThread) });
}

export async function POST(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const body = ComposeSchema.parse(await req.json());
  const demo = await requireDemoScope(user);

  if (demo) {
    if (body.audienceType !== "student" || body.studentId !== demo.studentId) {
      return Response.json(
        { error: "Demo admin can only message the demo student" },
        { status: 403 }
      );
    }
  }

  if (body.audienceType === "student") {
    if (!body.studentId) {
      return Response.json({ error: "studentId is required" }, { status: 400 });
    }
    const student = await getUserById(body.studentId);
    if (!student || student.role !== "student") {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }
    const thread = await createDirectThreadWithMessage({
      studentId: body.studentId,
      createdBy: user!.sub,
      body: body.body,
      senderId: user!.sub,
      senderRole: "admin",
    });
    return Response.json({ thread: serializeThread({ ...thread, unreadCount: 0 }) }, { status: 201 });
  }

  let audience: MessageAudience;
  if (body.audienceType === "all") {
    audience = { type: "all" };
  } else if (body.audienceType === "standard") {
    if (!body.standardId) {
      return Response.json({ error: "standardId is required" }, { status: 400 });
    }
    audience = { type: "standard", standardId: body.standardId };
  } else if (body.audienceType === "class") {
    if (!body.classId) {
      return Response.json({ error: "classId is required" }, { status: 400 });
    }
    audience = { type: "class", classId: body.classId };
  } else {
    return Response.json({ error: "Invalid audience" }, { status: 400 });
  }

  const thread = await createGroupThread({
    audience,
    title: body.title,
    createdBy: user!.sub,
    initialBody: body.body,
    senderId: user!.sub,
    senderRole: "admin",
  });
  return Response.json({ thread: serializeThread({ ...thread, unreadCount: 0 }) }, { status: 201 });
}
