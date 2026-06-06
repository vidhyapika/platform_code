import { MessageSquare } from "lucide-react";
import type { MessageThread } from "../../types/messages";
import { AudienceBadge } from "./AudienceBadge";

function formatWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessageThreadList({
  threads,
  selectedId,
  onSelect,
  loading,
  emptyLabel,
}: {
  threads: MessageThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  emptyLabel?: string;
}) {
  if (loading) {
    return <div className="p-6 text-sm text-slate-500 font-medium">Loading conversations…</div>;
  }

  if (threads.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">{emptyLabel ?? "No conversations yet"}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-y-auto flex-1">
      {threads.map((t) => {
        const active = t.id === selectedId;
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-slate-50 ${
                active ? "bg-slate-50 border-l-4 border-[#0084B4]" : "border-l-4 border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className={`text-sm font-bold truncate ${active ? "text-[#006A91]" : "text-slate-900"}`}>
                      {t.title}
                    </p>
                    {t.kind === "group" && <AudienceBadge thread={t} />}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {t.lastMessagePreview || "No messages yet"}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {formatWhen(t.lastMessageAt)}
                  </span>
                  {t.unreadCount > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#0084B4] text-white text-[10px] font-bold flex items-center justify-center">
                      {t.unreadCount > 9 ? "9+" : t.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
