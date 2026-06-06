import { z } from "zod";
import { verifyJWT, requireAdmin } from "../../../../../../backend/middleware/auth";
import {
  createVoiceSessionFast,
  bootstrapVoiceSession,
} from "../../../../../../backend/lib/voiceSession";
import { after } from "next/server";

const DEFAULT_FAILED = [
  {
    questionId: "sandbox-q1",
    text: "Solve for x: 2x + 5 = 13",
    studentAnswer: "x = 3",
    correctAnswer: "x = 4",
    aiReasoning: "You subtracted incorrectly when isolating x.",
    type: "mcq",
  },
];

const SandboxSchema = z.object({
  topicId: z.string().optional(),
  topicTitle: z.string().optional(),
  subTopicTitle: z.string().optional(),
  subTopicId: z.string().optional(),
  contextType: z.enum(["prereq", "subtopic", "finaltest"]).optional(),
  failedQuestions: z
    .array(
      z.object({
        questionId: z.string(),
        text: z.string(),
        studentAnswer: z.string().optional(),
        correctAnswer: z.string().optional(),
        aiReasoning: z.string().optional(),
        type: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAdmin(user);
  if (err) return err;

  try {
    const body = SandboxSchema.parse(await req.json());
    const studentId = process.env.VOICE_TEST_STUDENT_ID ?? user!.sub;
    const topicId = body.topicId ?? "voice-lab";
    const topicTitle = body.topicTitle ?? "Voice Lab (Algebra)";
    const failedQuestions = body.failedQuestions?.length ? body.failedQuestions : DEFAULT_FAILED;

    const result = await createVoiceSessionFast({
      studentId,
      topicId,
      subTopicId: body.subTopicId,
      contextType: body.contextType ?? "subtopic",
      failedQuestions,
      skipCoachingCap: true,
      skipAttemptCounters: true,
      topicNameOverride: topicTitle,
      subTopicNameOverride: body.subTopicTitle,
    });

    after(() => {
      void bootstrapVoiceSession(result.sessionId, result.roomName).catch((e) => {
        console.error("[voice] sandbox bootstrap error", e);
      });
    });

    return Response.json({ ...result, sandbox: true });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    }
    return Response.json({ error: e.message ?? "Failed to create sandbox session" }, { status: 500 });
  }
}
