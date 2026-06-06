import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../firebase/admin";
import type { JWTPayload } from "../middleware/auth";
import {
  getClass,
  getStandard,
  getStudentEnrollments,
  listClassEnrollments,
  listClasses,
  getAllClasses,
} from "./curriculumRepo";
import { getUserById, listUsersByRole } from "./userRepo";

export type MessageAudience =
  | { type: "student"; studentId: string }
  | { type: "all" }
  | { type: "class"; classId: string }
  | { type: "standard"; standardId: string };

export type MessageThreadKind = "direct" | "group";

export type MessageThread = {
  id: string;
  kind: MessageThreadKind;
  audience: MessageAudience;
  title: string;
  createdBy: string;
  participantStudentIds?: string[];
  lastMessageAt?: FirebaseFirestore.Timestamp | null;
  lastMessagePreview?: string | null;
  lastMessageSenderId?: string | null;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
};

export type Message = {
  id: string;
  senderId: string;
  senderRole: "admin" | "student";
  body: string;
  createdAt?: FirebaseFirestore.Timestamp;
};

const MAX_BODY = 4000;
const MESSAGES_PAGE = 50;

function directThreadId(studentId: string) {
  return `direct_${studentId}`;
}

function threadFromDoc(id: string, data: FirebaseFirestore.DocumentData): MessageThread {
  return {
    id,
    kind: data.kind as MessageThreadKind,
    audience: data.audience as MessageAudience,
    title: data.title ?? "",
    createdBy: data.createdBy ?? "",
    participantStudentIds: data.participantStudentIds,
    lastMessageAt: data.lastMessageAt ?? null,
    lastMessagePreview: data.lastMessagePreview ?? null,
    lastMessageSenderId: data.lastMessageSenderId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function messageFromDoc(id: string, data: FirebaseFirestore.DocumentData): Message {
  return {
    id,
    senderId: data.senderId,
    senderRole: data.senderRole,
    body: data.body,
    createdAt: data.createdAt,
  };
}

export async function resolveAudienceStudentIds(audience: MessageAudience): Promise<string[]> {
  if (audience.type === "student") return [audience.studentId];
  if (audience.type === "all") {
    const students = await listUsersByRole("student");
    return students.map((s) => s.id);
  }
  if (audience.type === "class") {
    const enrollments = await listClassEnrollments(audience.classId);
    return [...new Set(enrollments.map((e) => e.studentId))];
  }
  if (audience.type === "standard") {
    const classes = await listClasses(audience.standardId);
    const ids = new Set<string>();
    for (const cls of classes) {
      const enrollments = await listClassEnrollments(cls.id);
      enrollments.forEach((e) => ids.add(e.studentId));
    }
    return [...ids];
  }
  return [];
}

export async function studentInAudience(studentId: string, audience: MessageAudience): Promise<boolean> {
  if (audience.type === "student") return audience.studentId === studentId;
  if (audience.type === "all") return true;
  const enrollments = await getStudentEnrollments(studentId);
  const classIds = new Set(enrollments.map((e) => e.classId));
  if (audience.type === "class") return classIds.has(audience.classId);
  if (audience.type === "standard") {
    const classes = await listClasses(audience.standardId);
    return classes.some((c) => classIds.has(c.id));
  }
  return false;
}

export async function getThreadById(threadId: string): Promise<MessageThread | null> {
  const doc = await getDb().collection("messageThreads").doc(threadId).get();
  if (!doc.exists) return null;
  return threadFromDoc(doc.id, doc.data()!);
}

export async function canAccessThread(
  thread: MessageThread,
  user: JWTPayload
): Promise<boolean> {
  if (user.role === "admin") return true;
  if (user.role !== "student") return false;
  return studentInAudience(user.sub, thread.audience);
}

export async function assertCanAccessThread(
  threadId: string,
  user: JWTPayload
): Promise<{ thread: MessageThread } | { error: string; status: number }> {
  const thread = await getThreadById(threadId);
  if (!thread) return { error: "Thread not found", status: 404 };
  const ok = await canAccessThread(thread, user);
  if (!ok) return { error: "Forbidden", status: 403 };
  return { thread };
}

function readDocId(threadId: string, userId: string) {
  return `${threadId}_${userId}`;
}

export async function markThreadRead(threadId: string, userId: string, role: string) {
  const db = getDb();
  await db
    .collection("messageReads")
    .doc(readDocId(threadId, userId))
    .set(
      {
        threadId,
        userId,
        role,
        lastReadAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

async function getLastReadAt(threadId: string, userId: string): Promise<number> {
  const doc = await getDb()
    .collection("messageReads")
    .doc(readDocId(threadId, userId))
    .get();
  if (!doc.exists) return 0;
  const t = doc.data()?.lastReadAt;
  return t?.toMillis?.() ?? 0;
}

export async function countUnreadInThread(
  threadId: string,
  userId: string
): Promise<number> {
  const lastRead = await getLastReadAt(threadId, userId);
  const snap = await getDb()
    .collection("messageThreads")
    .doc(threadId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();
  let count = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.senderId === userId) continue;
    const ms = data.createdAt?.toMillis?.() ?? 0;
    if (ms > lastRead) count++;
  }
  return count;
}

async function enrichThreadsWithUnread<T extends MessageThread>(
  threads: T[],
  userId: string
): Promise<(T & { unreadCount: number })[]> {
  return Promise.all(
    threads.map(async (t) => ({
      ...t,
      unreadCount: await countUnreadInThread(t.id, userId),
    }))
  );
}

function sortThreads(threads: MessageThread[]) {
  return [...threads].sort((a, b) => {
    const am = a.lastMessageAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
    const bm = b.lastMessageAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
    return bm - am;
  });
}

export async function listThreadsForAdmin(
  adminUserId: string,
  allowedStudentIds?: Set<string> | null
): Promise<(MessageThread & { unreadCount: number })[]> {
  const snap = await getDb().collection("messageThreads").get();
  let threads = snap.docs.map((d) => threadFromDoc(d.id, d.data()));
  if (allowedStudentIds) {
    threads = threads.filter((t) => {
      if (t.audience.type === "student") return allowedStudentIds.has(t.audience.studentId);
      return false;
    });
  }
  const sorted = sortThreads(threads);
  return enrichThreadsWithUnread(sorted, adminUserId);
}

export async function listThreadsForStudent(
  studentId: string
): Promise<(MessageThread & { unreadCount: number })[]> {
  const snap = await getDb().collection("messageThreads").get();
  const threads: MessageThread[] = [];
  for (const d of snap.docs) {
    const t = threadFromDoc(d.id, d.data());
    if (await studentInAudience(studentId, t.audience)) threads.push(t);
  }
  const sorted = sortThreads(threads);
  return enrichThreadsWithUnread(sorted, studentId);
}

export async function getOrCreateDirectThread(
  studentId: string,
  createdBy: string
): Promise<MessageThread> {
  const id = directThreadId(studentId);
  const db = getDb();
  const ref = db.collection("messageThreads").doc(id);
  const existing = await ref.get();
  if (existing.exists) return threadFromDoc(existing.id, existing.data()!);

  const student = await getUserById(studentId);
  const title = student?.name ? `Direct: ${student.name}` : `Direct: ${student?.email ?? studentId}`;

  const data = {
    kind: "direct" as const,
    audience: { type: "student" as const, studentId },
    title,
    createdBy,
    participantStudentIds: [studentId],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastMessageAt: null,
    lastMessagePreview: null,
    lastMessageSenderId: null,
  };
  await ref.set(data);
  const doc = await ref.get();
  return threadFromDoc(doc.id, doc.data()!);
}

export async function buildGroupTitle(audience: MessageAudience): Promise<string> {
  if (audience.type === "all") return "All students";
  if (audience.type === "standard") {
    const std = await getStandard(audience.standardId);
    return std ? `Standard: ${std.name}` : "Standard message";
  }
  if (audience.type === "class") {
    const cls = await getClass(audience.classId);
    return cls ? `Class: ${cls.name}` : "Class message";
  }
  return "Group message";
}

export async function createGroupThread(params: {
  audience: Exclude<MessageAudience, { type: "student" }>;
  title?: string;
  createdBy: string;
  initialBody: string;
  senderRole: "admin";
  senderId: string;
}): Promise<MessageThread> {
  const title = params.title?.trim() || (await buildGroupTitle(params.audience));
  const ref = await getDb().collection("messageThreads").add({
    kind: "group",
    audience: params.audience,
    title,
    createdBy: params.createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastMessageAt: null,
    lastMessagePreview: null,
    lastMessageSenderId: null,
  });
  const threadId = ref.id;
  await postMessage({
    threadId,
    senderId: params.senderId,
    senderRole: params.senderRole,
    body: params.initialBody,
  });
  const thread = await getThreadById(threadId);
  return thread!;
}

export async function createDirectThreadWithMessage(params: {
  studentId: string;
  createdBy: string;
  body: string;
  senderId: string;
  senderRole: "admin" | "student";
}): Promise<MessageThread> {
  const thread = await getOrCreateDirectThread(params.studentId, params.createdBy);
  await postMessage({
    threadId: thread.id,
    senderId: params.senderId,
    senderRole: params.senderRole,
    body: params.body,
  });
  return (await getThreadById(thread.id))!;
}

export async function postMessage(params: {
  threadId: string;
  senderId: string;
  senderRole: "admin" | "student";
  body: string;
}): Promise<Message> {
  const body = params.body.trim().slice(0, MAX_BODY);
  if (!body) throw new Error("Message body is required");

  const db = getDb();
  const threadRef = db.collection("messageThreads").doc(params.threadId);
  const threadDoc = await threadRef.get();
  if (!threadDoc.exists) throw new Error("Thread not found");

  const msgRef = await threadRef.collection("messages").add({
    senderId: params.senderId,
    senderRole: params.senderRole,
    body,
    createdAt: FieldValue.serverTimestamp(),
  });

  const preview = body.length > 120 ? `${body.slice(0, 117)}...` : body;
  await threadRef.update({
    lastMessageAt: FieldValue.serverTimestamp(),
    lastMessagePreview: preview,
    lastMessageSenderId: params.senderId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const msgDoc = await msgRef.get();
  return messageFromDoc(msgDoc.id, msgDoc.data()!);
}

export async function listMessages(
  threadId: string,
  limit = MESSAGES_PAGE
): Promise<Message[]> {
  const snap = await getDb()
    .collection("messageThreads")
    .doc(threadId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => messageFromDoc(d.id, d.data()));
}

export async function getTotalUnreadCount(userId: string, role: string): Promise<number> {
  const threads =
    role === "admin"
      ? await listThreadsForAdmin(userId, null)
      : await listThreadsForStudent(userId);
  return threads.reduce((sum, t) => sum + t.unreadCount, 0);
}

export async function getRecipientsForCompose(): Promise<{
  standards: { id: string; name: string }[];
  classes: { id: string; name: string; standardId: string }[];
  students: { id: string; name: string | null; email: string }[];
}> {
  const [standardsSnap, classes, students] = await Promise.all([
    getDb().collection("standards").get(),
    getAllClasses(),
    listUsersByRole("student"),
  ]);
  const standards = standardsSnap.docs
    .map((d) => ({ id: d.id, name: (d.data().name as string) ?? d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    standards,
    classes: classes.map((c) => ({ id: c.id, name: c.name, standardId: c.standardId })),
    students: students.map((s) => ({ id: s.id, name: s.name, email: s.email })),
  };
}
