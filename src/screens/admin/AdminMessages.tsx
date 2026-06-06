import { AdminLayout } from "../../components/AdminLayout";
import { MessagesPanel } from "../../components/messages/MessagesPanel";

export function AdminMessages() {
  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Messages</h1>
          <p className="text-sm text-slate-600 mt-1">
            Message all students, a standard, a class, or an individual student.
          </p>
        </div>
        <MessagesPanel mode="admin" />
      </div>
    </AdminLayout>
  );
}
