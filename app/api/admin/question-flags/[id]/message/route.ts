export const dynamic = "force-dynamic";

import { z } from "zod";
import { verifyJWT, requireAdmin } from "../../../../../../backend/middleware/auth";
import { requireDemoScope } from "../../../../../../backend/utils/demoAdminScope";
import {
  getPrerequisite,
  getSubTopic,
  getTopic,
} from "../../../../../../backend/repositories/curriculumRepo";
import {
  createDirectThreadWithMessage,
  createGroupThread,
  type MessageAudience,
} from "../../../../../../backend/repositories/messageRepo";
import {
  getQuestionFlag,
  updateQuestionFlag,
} from "../../../../../../backend/repositories/questionFlagRepo";
import { getUserById } from "../../../../../../backend/repositories/userRepo";
import { buildFlagMessageBody } from "../../../../../../backend/services/flagMessageTemplate";
import { serializeThread } from "../../../../../../backend/utils/serializeMessage";

const MessageSchema = z.object({
  audienceType: z.enum(["student", "class", "standard", "all"]),
  classId: z.string().optional(),
  standardId: z.string().optional(),
  body: z.string().min(1).max(2000),
});

export async function POST(
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
    const body = MessageSchema.parse(await req.json());
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

    const fullBody = buildFlagMessageBody({
      flag,
      adminMessage: body.body,
      topicName: topic?.name,
      contextLabel,
      studentName: student?.name,
    });

    let threadId: string;

    if (body.audienceType === "student") {
      const thread = await createDirectThreadWithMessage({
        studentId: flag.studentId,
        createdBy: user!.sub,
        body: fullBody,
        senderId: user!.sub,
        senderRole: "admin",
      });
      threadId = thread.id;
    } else {
      let audience: MessageAudience;
      if (body.audienceType === "all") {
        audience = { type: "all" };
      } else if (body.audienceType === "standard") {
        if (!body.standardId) {
          return Response.json({ error: "standardId is required" }, { status: 400 });
        }
        audience = { type: "standard", standardId: body.standardId };
      } else {
        if (!body.classId) {
          return Response.json({ error: "classId is required" }, { status: 400 });
        }
        audience = { type: "class", classId: body.classId };
      }
      const thread = await createGroupThread({
        audience,
        createdBy: user!.sub,
        initialBody: fullBody,
        senderId: user!.sub,
        senderRole: "admin",
      });
      threadId = thread.id;
    }

    await updateQuestionFlag(id, {
      lastMessageThreadId: threadId,
      ...(flag.status === "open" ? { status: "in_review" } : {}),
    });

    const thread = await import("../../../../../../backend/repositories/messageRepo").then((m) =>
      m.getThreadById(threadId)
    );

    return Response.json({
      threadId,
      thread: thread ? serializeThread({ ...thread, unreadCount: 0 }) : null,
    });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}
