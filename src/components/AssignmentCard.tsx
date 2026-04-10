import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Assignment } from '../types';
import { motion } from 'motion/react';

interface AssignmentCardProps {
  key?: React.Key;
  assignment: Assignment;
  variants?: any;
}

export function AssignmentCard({ assignment, variants }: AssignmentCardProps) {
  if (assignment.status === 'completed') {
    return (
      <motion.div variants={variants} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-75 hover:opacity-100">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-slate-100 text-slate-600">
            {assignment.subject}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
            {assignment.score}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 mb-2 line-through decoration-slate-300">{assignment.title}</h3>
        <button className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors mt-2">
          View Feedback
        </button>
      </motion.div>
    );
  }

  if (assignment.progress > 0) {
    return (
      <motion.div variants={variants} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-purple-100 text-purple-600">
            {assignment.subject}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 mb-2">{assignment.title}</h3>
        <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Due: {assignment.dueDate}
        </p>
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Progress</span>
            <span>{assignment.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${assignment.progress}%` }}></div>
          </div>
        </div>
        <button className="w-full py-2.5 bg-[#0084B4] hover:bg-[#006A91] text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
          Continue
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div variants={variants} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
          assignment.status === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {assignment.subject}
        </span>
        {assignment.status === 'urgent' && (
          <span className="flex items-center gap-1 text-xs font-bold text-red-500">
            <Clock className="w-3.5 h-3.5" /> Urgent
          </span>
        )}
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{assignment.title}</h3>
      <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" /> Due: {assignment.dueDate}
      </p>
      <button className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors">
        Start Assignment
      </button>
    </motion.div>
  );
}
