import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../firebase/admin";

export type QuestionFlagReasonType = "question_issue" | "grading_dispute" | "other";
export type QuestionFlagStatus = "open" | "in_review" | "resolved" | "rejected";

export type QuestionFlagSnapshot = {
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  imageUrl?: string;
};

export type QuestionFlagRecord = {
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
  resolvedAt?: FirebaseFirestore.Timestamp | null;
  resolvedBy?: string | null;
  lastMessageThreadId?: string | null;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
};

const COLLECTION = "questionFlags";
const MAX_OPEN_FLAGS_PER_STUDENT = 10;

function fromDoc(id: string, data: FirebaseFirestore.DocumentData): QuestionFlagRecord {
  return { id, ...data } as QuestionFlagRecord;
}

export async function countOpenFlagsForStudent(studentId: string): Promise<number> {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("studentId", "==", studentId)
    .where("status", "in", ["open", "in_review"])
    .get();
  return snap.size;
}

export async function findDuplicateOpenFlag(params: {
  studentId: string;
  questionId: string;
  quizAttemptId?: string | null;
  contextType: string;
  contextId: string;
}): Promise<QuestionFlagRecord | null> {
  let query = getDb()
    .collection(COLLECTION)
    .where("studentId", "==", params.studentId)
    .where("questionId", "==", params.questionId)
    .where("status", "in", ["open", "in_review"]);

  const snap = await query.get();
  for (const doc of snap.docs) {
    const row = fromDoc(doc.id, doc.data());
    if (params.quizAttemptId) {
      if (row.quizAttemptId === params.quizAttemptId) return row;
    } else if (
      row.contextType === params.contextType &&
      row.contextId === params.contextId &&
      !row.quizAttemptId
    ) {
      return row;
    }
  }
  return null;
}

export async function createQuestionFlag(
  data: Omit<QuestionFlagRecord, "id" | "createdAt" | "updatedAt" | "status"> & {
    status?: QuestionFlagStatus;
  }
): Promise<string> {
  const openCount = await countOpenFlagsForStudent(data.studentId);
  if (openCount >= MAX_OPEN_FLAGS_PER_STUDENT) {
    throw new Error("You have too many open question flags. Wait for instructor review on existing flags.");
  }

  const dup = await findDuplicateOpenFlag({
    studentId: data.studentId,
    questionId: data.questionId,
    quizAttemptId: data.quizAttemptId,
    contextType: data.contextType,
    contextId: data.contextId,
  });
  if (dup) {
    throw new Error("You already flagged this question and it is still under review.");
  }

  const ref = await getDb()
    .collection(COLLECTION)
    .add({
      ...data,
      status: data.status ?? "open",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  return ref.id;
}

export async function getQuestionFlag(id: string): Promise<QuestionFlagRecord | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return fromDoc(doc.id, doc.data()!);
}

export async function updateQuestionFlag(
  id: string,
  patch: Partial<
    Pick<
      QuestionFlagRecord,
      | "status"
      | "adminNotes"
      | "scoreOverridden"
      | "overriddenCorrect"
      | "resolvedAt"
      | "resolvedBy"
      | "lastMessageThreadId"
    >
  >
): Promise<void> {
  await getDb()
    .collection(COLLECTION)
    .doc(id)
    .update({
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function listQuestionFlagsForStudent(
  studentId: string,
  status?: QuestionFlagStatus
): Promise<QuestionFlagRecord[]> {
  let query = getDb().collection(COLLECTION).where("studentId", "==", studentId);
  if (status) query = query.where("status", "==", status) as FirebaseFirestore.Query;
  const snap = await query.get();
  return snap.docs
    .map((d) => fromDoc(d.id, d.data()))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export async function listQuestionFlagsForAdmin(params: {
  status?: QuestionFlagStatus;
  topicId?: string;
  studentId?: string;
  allowedStudentIds?: Set<string> | null;
  limit?: number;
}): Promise<QuestionFlagRecord[]> {
  let query: FirebaseFirestore.Query = getDb().collection(COLLECTION);
  if (params.status) query = query.where("status", "==", params.status);
  if (params.topicId) query = query.where("topicId", "==", params.topicId);
  if (params.studentId) query = query.where("studentId", "==", params.studentId);

  const snap = await query.get();
  let rows = snap.docs.map((d) => fromDoc(d.id, d.data()));

  if (params.allowedStudentIds) {
    rows = rows.filter((r) => params.allowedStudentIds!.has(r.studentId));
  }

  rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  const limit = params.limit ?? 100;
  return rows.slice(0, limit);
}

export async function countOpenQuestionFlags(
  allowedStudentIds?: Set<string> | null
): Promise<number> {
  const open = await listQuestionFlagsForAdmin({
    status: "open",
    allowedStudentIds,
    limit: 500,
  });
  return open.length;
}
