import React from 'react';
import { DashboardCourse } from '../types';

interface DashboardCourseCardProps {
  course: DashboardCourse;
}

export const DashboardCourseCard: React.FC<DashboardCourseCardProps> = ({ course }) => {
  return (
    <div className="border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl ${course.bgColor} ${course.color} flex items-center justify-center mb-4`}>
        <course.icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-slate-800 mb-1">{course.subject}</h3>
      <p className="text-xs text-slate-500 font-medium mb-4">{course.unit}</p>
      
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
        <div className={`h-1.5 rounded-full ${course.subject === 'Mathematics' ? 'bg-[#0084B4]' : course.subject === 'Science' ? 'bg-[#7CB342]' : 'bg-[#8B5CF6]'}`} style={{ width: `${course.progress}%` }}></div>
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400">
        <span>{course.progress}% Completed</span>
        <span>{course.completed}/{course.total} Lessons</span>
      </div>
    </div>
  );
}
