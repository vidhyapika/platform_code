import { verifyJWT, requireAuth } from "../../../../backend/middleware/auth";
import { generateRetakeQuestions } from "../../../../backend/services/ai";
import {
  getTopic,
  getSubTopic,
  listQuestionsForStudent,
} from "../../../../backend/repositories/curriculumRepo";
import { countFailedAiRetakes } from "../../../../backend/repositories/progressRepo";
import { z } from "zod";

const MAX_AI_COACHING_CYCLES = 3;

const Schema = z.object({
  topicId: z.string().min(1),
  subTopicId: z.string().optional(),
  contextType: z.enum(["prereq", "subtopic", "finaltest"]),
  contextId: z.string().min(1),
  failedQuestions: z.array(
    z.object({
      questionId: z.string(),
      text: z.string(),
      studentAnswer: z.string().optional(),
      correctAnswer: z.string().optional(),
    })
  ),
  count: z.number().int().min(1).max(20).default(5),
});

export async function POST(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAuth(user);
  if (err) return err;

  const studentId = user!.sub;

  try {
    const body = Schema.parse(await req.json());
    const { topicId, subTopicId, contextType, contextId, failedQuestions, count } = body;

    const failedAi = await countFailedAiRetakes(studentId, contextType, contextId);
    if (failedAi >= MAX_AI_COACHING_CYCLES) {
      return Response.json(
        {
          error:
            "You have used all AI coaching and retest attempts for this quiz. Please contact your instructor for help.",
          code: "AI_COACHING_CAP",
          failedAiRetakes: failedAi,
          maxAiCoachingCycles: MAX_AI_COACHING_CYCLES,
        },
        { status: 403 }
      );
    }

    const [topic, subTopic] = await Promise.all([
      getTopic(topicId),
      subTopicId ? getSubTopic(subTopicId) : Promise.resolve(null),
    ]);

    if (!topic) return Response.json({ error: "Topic not found" }, { status: 404 });

    const questionIds = await generateRetakeQuestions({
      studentId,
      topicName: topic.name,
      subTopicName: subTopic?.name,
      failedQuestions,
      count,
      contextType,
      contextId,
    });

    const catalog = await listQuestionsForStudent(contextType, contextId, studentId);
    const adminQs = catalog.filter((q) => !q.isAIGenerated);
    const studentAiQs = catalog.filter((q) => q.isAIGenerated);
    const questions = [...adminQs, ...studentAiQs];

    return Response.json({ questionIds, questions });
  } catch (e: any) {
    if (e?.name === "ZodError") return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
