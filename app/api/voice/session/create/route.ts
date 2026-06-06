import { after } from "next/server";
import { verifyJWT, requireAuth } from "../../../../../backend/middleware/auth";
import {
  createVoiceSessionFast,
  bootstrapVoiceSession,
  MAX_AI_COACHING_CYCLES,
} from "../../../../../backend/lib/voiceSession";
import { z } from "zod";

const TeachSchema = z.object({
  topicId: z.string().min(1),
  subTopicId: z.string().optional(),
  contextId: z.string().optional(),
  contextType: z.enum(["prereq", "subtopic", "finaltest"]),
  failedQuestions: z.array(
    z.object({
      questionId: z.string(),
      text: z.string(),
      studentAnswer: z.string().optional(),
      correctAnswer: z.string().optional(),
      aiReasoning: z.string().optional(),
      type: z.string().optional(),
    })
  ),
});

export async function POST(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAuth(user);
  if (err) return err;

  try {
    const body = TeachSchema.parse(await req.json());
    if (body.failedQuestions.length === 0) {
      return Response.json(
        { error: "At least one failed question is required to start voice coaching." },
        { status: 400 }
      );
    }
    const result = await createVoiceSessionFast({
      studentId: user!.sub,
      ...body,
    });

    after(() => {
      void bootstrapVoiceSession(result.sessionId, result.roomName).catch((e) => {
        console.error("[voice] background bootstrap error", e);
      });
    });

    return Response.json(result);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    }
    if (e?.code === "AI_COACHING_CAP") {
      return Response.json(
        {
          error: e.message,
          code: "AI_COACHING_CAP",
          failedAiRetakes: e.failedAiRetakes,
          maxAiCoachingCycles: MAX_AI_COACHING_CYCLES,
        },
        { status: 403 }
      );
    }
    return Response.json({ error: e.message ?? "Failed to create voice session" }, { status: 500 });
  }
}
