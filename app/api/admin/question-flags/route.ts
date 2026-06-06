export const dynamic = "force-dynamic";

import { verifyJWT, requireAdmin } from "../../../../backend/middleware/auth";
import { requireDemoScope } from "../../../../backend/utils/demoAdminScope";
import {
  countOpenQuestionFlags,
  listQuestionFlagsForAdmin,
} from "../../../../backend/repositories/questionFlagRepo";
import { serializeQuestionFlag } from "../../../../backend/utils/serializeQuestionFlag";

export async function GET(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  const demo = await requireDemoScope(user);
  const allowedStudentIds = demo ? new Set([demo.studentId]) : null;

  const url = new URL(req.url);
  const countOnly = url.searchParams.get("countOnly") === "1";
  if (countOnly) {
    const count = await countOpenQuestionFlags(allowedStudentIds);
    return Response.json({ count });
  }

  const status = url.searchParams.get("status") as
    | "open"
    | "in_review"
    | "resolved"
    | "rejected"
    | undefined;
  const topicId = url.searchParams.get("topicId") ?? undefined;
  const studentId = url.searchParams.get("studentId") ?? undefined;

  const rows = await listQuestionFlagsForAdmin({
    status: status || undefined,
    topicId,
    studentId,
    allowedStudentIds,
    limit: 200,
  });

  return Response.json({ flags: rows.map(serializeQuestionFlag) });
}
