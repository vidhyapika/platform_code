export const dynamic = "force-dynamic";

import { z } from "zod";
import { verifyJWT, requireAdmin } from "../../../../../../backend/middleware/auth";
import { requireDemoScope } from "../../../../../../backend/utils/demoAdminScope";
import { getQuestionFlag } from "../../../../../../backend/repositories/questionFlagRepo";
import { overrideQuestionScore } from "../../../../../../backend/services/quizScoreOverride";

const OverrideSchema = z.object({
  markCorrect: z.boolean(),
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
    const body = OverrideSchema.parse(await req.json());
    const result = await overrideQuestionScore({
      flagId: id,
      adminId: user!.sub,
      markCorrect: body.markCorrect,
    });
    return Response.json({ success: true, ...result });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    }
    return Response.json({ error: e.message }, { status: 400 });
  }
}
