export type MessageAudience =
  | { type: "student"; studentId: string }
  | { type: "all" }
  | { type: "class"; classId: string }
  | { type: "standard"; standardId: string };

export type MessageThread = {
  id: string;
  kind: "direct" | "group";
  audience: MessageAudience;
  title: string;
  createdBy: string;
  participantStudentIds?: string[];
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageSenderId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  unreadCount: number;
};

export type Message = {
  id: string;
  senderId: string;
  senderRole: "admin" | "student";
  body: string;
  createdAt: string | null;
};

export type ComposeRecipients = {
  standards: { id: string; name: string }[];
  classes: { id: string; name: string; standardId: string }[];
  students: { id: string; name: string | null; email: string }[];
};
