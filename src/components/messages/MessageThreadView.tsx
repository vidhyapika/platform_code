import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import type { Message, MessageThread } from "../../types/messages";
import { AudienceBadge } from "./AudienceBadge";

export function MessageThreadView({
  thread,
  messages,
  loading,
  sending,
  viewerRole,
  onSend,
}: {
  thread: MessageThread | null;
  messages: Message[];
  loading?: boolean;
  sending?: boolean;
  viewerRole: "admin" | "student";
  onSend: (body: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thread?.id]);

  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <p className="text-sm font-medium text-slate-500">Select a conversation to view messages</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    await onSend(text);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 py-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-black text-slate-900">{thread.title}</h2>
          {thread.kind === "group" && <AudienceBadge thread={thread} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/80 min-h-0">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === viewerRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    mine
                      ? "bg-[#0084B4] text-white rounded-br-md"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-blue-100" : "text-slate-400"}`}>
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 p-4 border-t border-slate-200 bg-white flex gap-2 items-end"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your message…"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0084B4]/30 focus:border-[#0084B4]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#0084B4] text-white hover:bg-[#006A91] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
