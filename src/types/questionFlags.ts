export type QuestionFlagReasonType = "question_issue" | "grading_dispute" | "other";

export type QuestionFlagStatus = "open" | "in_review" | "resolved" | "rejected";

export type QuestionFlagSnapshot = {
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  imageUrl?: string;
};

export type QuestionFlag = {
  id: string;
  studentId: string;
  topicId: string;
  contextType: "prereq" | "subtopic" | "finaltest";
  contextId: string;
  subTopicId?: string | null;
  quizAttemptId?: string | null;
  questionId: string;
  reasonType: QuestionFlagReasonType;
  reasonText?: string;
  questionSnapshot: QuestionFlagSnapshot;
  studentAnswer: string;
  systemMarkedCorrect: boolean;
  aiReasoning?: string;
  status: QuestionFlagStatus;
  adminNotes?: string;
  scoreOverridden?: boolean;
  overriddenCorrect?: boolean;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  lastMessageThreadId?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuestionFlagDetail = QuestionFlag & {
  studentName?: string | null;
  studentEmail?: string;
  topicName?: string;
  contextLabel?: string;
};
