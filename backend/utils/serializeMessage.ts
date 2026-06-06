import type { Message, MessageThread } from "../repositories/messageRepo";

function ts(v: FirebaseFirestore.Timestamp | null | undefined): string | null {
  if (!v?.toDate) return null;
  return v.toDate().toISOString();
}

export function serializeThread(t: MessageThread & { unreadCount?: number }) {
  return {
    id: t.id,
    kind: t.kind,
    audience: t.audience,
    title: t.title,
    createdBy: t.createdBy,
    participantStudentIds: t.participantStudentIds,
    lastMessageAt: ts(t.lastMessageAt),
    lastMessagePreview: t.lastMessagePreview,
    lastMessageSenderId: t.lastMessageSenderId,
    createdAt: ts(t.createdAt),
    updatedAt: ts(t.updatedAt),
    unreadCount: t.unreadCount ?? 0,
  };
}

export function serializeMessage(m: Message) {
  return {
    id: m.id,
    senderId: m.senderId,
    senderRole: m.senderRole,
    body: m.body,
    createdAt: ts(m.createdAt),
  };
}
