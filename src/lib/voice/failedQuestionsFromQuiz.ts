import type { Question } from "../../types";
import type { QuizSubmitGradingResult } from "../../components/InlineQuiz";

export type FailedQuestionInput = {
  questionId: string;
  text: string;
  type?: string;
  studentAnswer?: string;
  correctAnswer?: string;
  aiReasoning?: string;
};

function normalizeType(type: Question["type"]): string {
  return type === "boolean" ? "true_false" : type;
}

/** Build failed-question payloads for voice session create from quiz context. */
export function failedQuestionsFromQuiz(
  questions: Question[],
  answers?: Record<string, string>,
  grading?: QuizSubmitGradingResult | null,
  apiFailed?: FailedQuestionInput[]
): FailedQuestionInput[] {
  if (apiFailed && apiFailed.length > 0) return apiFailed;

  if (grading?.perQuestion && Object.keys(grading.perQuestion).length > 0) {
    const wrong = questions.filter((q) => {
      const row = grading.perQuestion![q.id];
      return row && !row.correct;
    });
    if (wrong.length > 0) {
      return wrong.map((q) => ({
        questionId: q.id,
        text: q.text,
        type: normalizeType(q.type),
        studentAnswer: answers?.[q.id],
        correctAnswer: String(q.correctAnswer ?? ""),
        aiReasoning: grading.perQuestion![q.id]?.aiReasoning,
      }));
    }
  }

  if (answers && Object.keys(answers).length > 0) {
    const wrong = questions.filter((q) => {
      const a = answers[q.id];
      if (a == null || a === "") return false;
      return String(a).trim().toLowerCase() !== String(q.correctAnswer ?? "").trim().toLowerCase();
    });
    if (wrong.length > 0) {
      return wrong.map((q) => ({
        questionId: q.id,
        text: q.text,
        type: normalizeType(q.type),
        studentAnswer: answers[q.id],
        correctAnswer: String(q.correctAnswer ?? ""),
      }));
    }
  }

  if (questions.length > 0) {
    return questions.map((q) => ({
      questionId: q.id,
      text: q.text,
      type: normalizeType(q.type),
      studentAnswer: answers?.[q.id],
      correctAnswer: String(q.correctAnswer ?? ""),
    }));
  }

  return [];
}

/** Returns null when there is nothing meaningful to coach on. */
export function resolveFailedQuestionsForVoice(params: {
  apiFailed?: FailedQuestionInput[];
  questions?: Question[];
  answers?: Record<string, string>;
  grading?: QuizSubmitGradingResult | null;
}): FailedQuestionInput[] | null {
  const built = failedQuestionsFromQuiz(
    params.questions ?? [],
    params.answers,
    params.grading,
    params.apiFailed?.length ? params.apiFailed : undefined
  );
  return built.length > 0 ? built : null;
}

export type StoredQuizAttemptAnswer = {
  questionId: string;
  answer?: string;
  correct?: boolean;
  aiReasoning?: string;
};

export type StoredQuizAttempt = {
  passed?: boolean;
  aiGenerated?: boolean;
  answers?: StoredQuizAttemptAnswer[];
};

/** Rebuild failed-question payloads from a saved quiz attempt + question bank. */
export function failedQuestionsFromStoredAttempt(
  questions: Question[],
  attempt?: StoredQuizAttempt | null
): FailedQuestionInput[] {
  if (!attempt?.answers?.length || !questions.length) return [];

  const byId = new Map(questions.map((q) => [q.id, q]));
  const wrong = attempt.answers.filter((a) => a.correct === false);
  const rows = wrong.length > 0 ? wrong : attempt.passed === false ? attempt.answers : [];

  return rows
    .map((a) => {
      const q = byId.get(a.questionId);
      if (!q) return null;
      const item: FailedQuestionInput = {
        questionId: q.id,
        text: q.text,
        type: normalizeType(q.type),
        studentAnswer: a.answer,
        correctAnswer: String(q.correctAnswer ?? ""),
        aiReasoning: a.aiReasoning,
      };
      return item;
    })
    .filter((x): x is FailedQuestionInput => x !== null);
}
