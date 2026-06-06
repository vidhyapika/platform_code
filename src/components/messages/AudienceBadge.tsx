import { Users, GraduationCap, BookOpen, User } from "lucide-react";
import type { MessageThread } from "../../types/messages";

export function AudienceBadge({ thread }: { thread: MessageThread }) {
  const a = thread.audience;
  if (a.type === "student") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
        <User className="w-3 h-3" /> Direct
      </span>
    );
  }
  if (a.type === "all") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
        <Users className="w-3 h-3" /> All students
      </span>
    );
  }
  if (a.type === "standard") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
        <GraduationCap className="w-3 h-3" /> Standard
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
      <BookOpen className="w-3 h-3" /> Class
    </span>
  );
}
