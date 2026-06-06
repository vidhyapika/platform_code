import React, { useCallback, useEffect, useState } from "react";
import { Plus, MessageCircle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useApiGet, apiFetch } from "../../hooks/useApi";
import type { ComposeRecipients, Message, MessageThread } from "../../types/messages";
import { MessageThreadList } from "./MessageThreadList";
import { MessageThreadView } from "./MessageThreadView";

type Mode = "admin" | "student";

export function MessagesPanel({ mode }: { mode: Mode }) {
  const apiBase = mode === "admin" ? "/api/admin/messages" : "/api/student/messages";
  const viewerRole = mode === "admin" ? "admin" : "student";

  const { data: threadsData, loading: threadsLoading, refetch: refetchThreads } = useApiGet<{
    threads: MessageThread[];
  }>(`${apiBase}/threads`, []);

  const threads = threadsData?.threads ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: recipientsData } = useApiGet<ComposeRecipients>(
    mode === "admin" ? "/api/admin/messages/recipients" : "/api/healthz",
    [mode]
  );
  const recipients = mode === "admin" ? recipientsData : null;

  const loadThread = useCallback(
    async (id: string) => {
      setLoadingThread(true);
      const { data, error } = await apiFetch<{ thread: MessageThread; messages: Message[] }>(
        `${apiBase}/threads/${id}`
      );
      setLoadingThread(false);
      if (error || !data) return;
      setActiveThread(data.thread);
      setMessages(data.messages);
      void refetchThreads();
    },
    [apiBase, refetchThreads]
  );

  useEffect(() => {
    if (selectedId) void loadThread(selectedId);
    else {
      setActiveThread(null);
      setMessages([]);
    }
  }, [selectedId, loadThread]);

  useEffect(() => {
    if (!selectedId && threads.length > 0) {
      setSelectedId(threads[0]!.id);
    }
  }, [threads, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => {
      void loadThread(selectedId);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedId, loadThread]);

  const handleSend = async (body: string) => {
    if (!selectedId) return;
    setSending(true);
    const { data, error } = await apiFetch<{ message: Message }>(
      `${apiBase}/threads/${selectedId}/messages`,
      { method: "POST", body: JSON.stringify({ body }) }
    );
    setSending(false);
    if (error || !data) return;
    setMessages((prev) => [...prev, data.message]);
    void refetchThreads();
    void loadThread(selectedId);
  };

  const handleMessageAdmin = async () => {
    const direct = threads.find(
      (t) => t.kind === "direct" && t.audience.type === "student"
    );
    if (direct) {
      setSelectedId(direct.id);
      return;
    }
    setSending(true);
    const { data, error } = await apiFetch<{ thread: MessageThread }>(
      `${apiBase}/threads/direct`,
      { method: "POST", body: JSON.stringify({ body: "Hello, I have a question." }) }
    );
    setSending(false);
    if (error || !data) return;
    await refetchThreads();
    setSelectedId(data.thread.id);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)] min-h-[480px]">
      <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Inbox
          </h2>
          <div className="flex items-center gap-1">
            {mode === "student" && (
              <button
                type="button"
                onClick={() => void handleMessageAdmin()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0084B4] text-white hover:bg-[#006A91]"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Admin
              </button>
            )}
            {mode === "admin" && (
              <button
                type="button"
                onClick={() => setComposeOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            )}
          </div>
        </div>
        <MessageThreadList
          threads={threads}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={threadsLoading}
          emptyLabel={
            mode === "student"
              ? "No messages yet. Tap Admin to contact support."
              : "No conversations yet. Compose a message."
          }
        />
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        <MessageThreadView
          thread={activeThread}
          messages={messages}
          loading={loadingThread}
          sending={sending}
          viewerRole={viewerRole}
          onSend={handleSend}
        />
      </div>

      {mode === "admin" && recipients && (
        <ComposeModal
          isOpen={composeOpen}
          onClose={() => setComposeOpen(false)}
          recipients={recipients}
          onSent={async (threadId) => {
            setComposeOpen(false);
            await refetchThreads();
            setSelectedId(threadId);
          }}
        />
      )}
    </div>
  );
}

function ComposeModal({
  isOpen,
  onClose,
  recipients,
  onSent,
}: {
  isOpen: boolean;
  onClose: () => void;
  recipients: ComposeRecipients;
  onSent: (threadId: string) => void;
}) {
  const [audienceType, setAudienceType] = useState<"all" | "standard" | "class" | "student">("all");
  const [standardId, setStandardId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: Record<string, string> = { audienceType, body };
    if (title.trim()) payload.title = title.trim();
    if (audienceType === "standard") payload.standardId = standardId;
    if (audienceType === "class") payload.classId = classId;
    if (audienceType === "student") payload.studentId = studentId;

    const { data, error: err } = await apiFetch<{ thread: MessageThread }>(
      "/api/admin/messages/threads",
      { method: "POST", body: JSON.stringify(payload) }
    );
    setSubmitting(false);
    if (err || !data) {
      setError(err ?? "Failed to send");
      return;
    }
    onSent(data.thread.id);
    setBody("");
    setTitle("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New message" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Send to</label>
          <select
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value as typeof audienceType)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All students</option>
            <option value="standard">Standard / grade</option>
            <option value="class">Class</option>
            <option value="student">One student</option>
          </select>
        </div>

        {audienceType === "standard" && (
          <select
            value={standardId}
            onChange={(e) => {
              setStandardId(e.target.value);
              setClassId("");
            }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select standard…</option>
            {recipients.standards.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {audienceType === "class" && (
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select class…</option>
            {recipients.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {audienceType === "student" && (
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select student…</option>
            {recipients.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>
        )}

        {(audienceType === "standard" || audienceType === "class") && (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional subject"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        )}

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Your message…"
          rows={5}
          required
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none"
        />

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
