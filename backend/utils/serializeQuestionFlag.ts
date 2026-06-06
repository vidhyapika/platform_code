import type { QuestionFlagRecord } from "../repositories/questionFlagRepo";

export function tsToIso(t: unknown): string | null {
  if (t && typeof t === "object" && "toMillis" in t && typeof (t as { toMillis: () => number }).toMillis === "function") {
    try {
      return new Date((t as { toMillis: () => number }).toMillis()).toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export function serializeQuestionFlag(row: QuestionFlagRecord) {
  return {
    id: row.id,
    studentId: row.studentId,
    topicId: row.topicId,
    contextType: row.contextType,
    contextId: row.contextId,
    subTopicId: row.subTopicId ?? null,
    quizAttemptId: row.quizAttemptId ?? null,
    questionId: row.questionId,
    reasonType: row.reasonType,
    reasonText: row.reasonText ?? "",
    questionSnapshot: row.questionSnapshot,
    studentAnswer: row.studentAnswer,
    systemMarkedCorrect: row.systemMarkedCorrect,
    aiReasoning: row.aiReasoning ?? "",
    status: row.status,
    adminNotes: row.adminNotes ?? "",
    scoreOverridden: !!row.scoreOverridden,
    overriddenCorrect: row.overriddenCorrect ?? null,
    resolvedAt: tsToIso(row.resolvedAt),
    resolvedBy: row.resolvedBy ?? null,
    lastMessageThreadId: row.lastMessageThreadId ?? null,
    createdAt: tsToIso(row.createdAt),
    updatedAt: tsToIso(row.updatedAt),
  };
}
