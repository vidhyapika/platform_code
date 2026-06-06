export const dynamic = "force-dynamic";

import { z } from "zod";
import { verifyJWT, requireAuth } from "../../../../backend/middleware/auth";
import { getQuestion } from "../../../../backend/repositories/curriculumRepo";
import {
  createQuestionFlag,
  listQuestionFlagsForStudent,
} from "../../../../backend/repositories/questionFlagRepo";
import { getQuizAttempt } from "../../../../backend/repositories/progressRepo";
import { serializeQuestionFlag } from "../../../../backend/utils/serializeQuestionFlag";

const CreateSchema = z.object({
  topicId: z.string().min(1),
  contextType: z.enum(["prereq", "subtopic", "finaltest"]),
  contextId: z.string().min(1),
  subTopicId: z.string().optional(),
  questionId: z.string().min(1),
  quizAttemptId: z.string().optional(),
  reasonType: z.enum(["question_issue", "grading_dispute", "other"]),
  reasonText: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAuth(user);
  if (err) return err;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as
    | "open"
    | "in_review"
    | "resolved"
    | "rejected"
    | null;

  const rows = await listQuestionFlagsForStudent(
    user!.sub,
    status ?? undefined
  );
  return Response.json({ flags: rows.map(serializeQuestionFlag) });
}

export async function POST(req: Request) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAuth(user);
  if (err) return err;

  try {
    const body = CreateSchema.parse(await req.json());
    const studentId = user!.sub;

    const question = await getQuestion(body.questionId);
    if (!question) {
      return Response.json({ error: "Question not found" }, { status: 404 });
    }

    let studentAnswer = "";
    let systemMarkedCorrect = false;
    let aiReasoning = "";

    if (body.quizAttemptId) {
      const attempt = await getQuizAttempt(body.quizAttemptId);
      if (!attempt || attempt.studentId !== studentId) {
        return Response.json({ error: "Quiz attempt not found" }, { status: 404 });
      }
      const row = attempt.answers.find((a) => a.questionId === body.questionId);
      if (!row) {
        return Response.json({ error: "Answer not found on this attempt" }, { status: 400 });
      }
      studentAnswer = row.answer;
      systemMarkedCorrect = !!row.correct;
      aiReasoning = row.aiReasoning ?? "";
    }

    const id = await createQuestionFlag({
      studentId,
      topicId: body.topicId,
      contextType: body.contextType,
      contextId: body.contextId,
      subTopicId: body.subTopicId ?? (body.contextType === "subtopic" ? body.contextId : null),
      quizAttemptId: body.quizAttemptId ?? null,
      questionId: body.questionId,
      reasonType: body.reasonType,
      reasonText: body.reasonText?.trim() || "",
      questionSnapshot: {
        text: question.text,
        type: question.type,
        options: question.options,
        correctAnswer: question.correctAnswer,
        imageUrl: question.imageUrl,
      },
      studentAnswer,
      systemMarkedCorrect,
      aiReasoning,
    });

    return Response.json({ id, success: true }, { status: 201 });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    }
    return Response.json({ error: e.message ?? "Could not create flag" }, { status: 400 });
  }
}
