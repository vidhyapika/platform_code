import { DashboardLayout } from "../components/DashboardLayout";
import { MessagesPanel } from "../components/messages/MessagesPanel";
import { motion } from "motion/react";

export function Messages() {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1600px] mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Messages</h1>
          <p className="text-sm text-slate-600 mt-1">
            Contact your admin or reply in class and school announcements.
          </p>
        </div>
        <MessagesPanel mode="student" />
      </motion.div>
    </DashboardLayout>
  );
}
