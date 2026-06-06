import type { QuestionFlagRecord } from "../repositories/questionFlagRepo";

export function buildFlagMessageBody(params: {
  flag: QuestionFlagRecord;
  adminMessage: string;
  topicName?: string;
  contextLabel?: string;
  studentName?: string | null;
}): string {
  const { flag, adminMessage, topicName, contextLabel, studentName } = params;
  const shortId = flag.id.slice(0, 8);
  const reasonLabel =
    flag.reasonType === "question_issue"
      ? "Question issue"
      : flag.reasonType === "grading_dispute"
        ? "Grading dispute"
        : "Other";

  const lines = [
    `[Question flag #${shortId}]`,
    "",
    adminMessage.trim(),
    "",
    "---",
    "Flag details",
    `Reason: ${reasonLabel}`,
    ...(flag.reasonText ? [`Student comment: ${flag.reasonText}`] : []),
    ...(studentName ? [`Student: ${studentName}`] : []),
    ...(topicName ? [`Topic: ${topicName}`] : []),
    ...(contextLabel ? [`Quiz: ${contextLabel}`] : []),
    "",
    "Question:",
    flag.questionSnapshot.text,
    "",
    `Student answer: ${flag.studentAnswer || "—"}`,
    `Expected answer: ${flag.questionSnapshot.correctAnswer ?? "—"}`,
    `System marked: ${flag.systemMarkedCorrect ? "Correct" : "Incorrect"}`,
    ...(flag.aiReasoning ? [`AI feedback: ${flag.aiReasoning}`] : []),
  ];

  const body = lines.join("\n").trim();
  return body.length > 4000 ? `${body.slice(0, 3997)}...` : body;
}
