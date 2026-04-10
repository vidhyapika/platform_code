import React from 'react';
import { PlayCircle, Clock, Star } from 'lucide-react';
import { Course } from '../types';
import { motion } from 'motion/react';

interface CourseCardProps {
  key?: React.Key;
  course: Course;
  variants?: any;
}

export function CourseCard({ course, variants }: CourseCardProps) {
  return (
    <motion.div 
      variants={variants}
      className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="h-40 w-full relative overflow-hidden">
        <img 
          src={course.image} 
          alt={course.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className={`w-10 h-10 rounded-xl ${course.bgColor} ${course.color} flex items-center justify-center shadow-sm`}>
            <course.icon className="w-5 h-5" />
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-white">4.8</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1">{course.title}</h3>
        <p className="text-sm font-medium text-slate-500 mb-4">{course.instructor}</p>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Progress</span>
            <span>{course.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${course.color.replace('text-', 'bg-')}`} 
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{course.completedLessons} of {course.totalLessons} lessons completed</span>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 transition-colors">
          <PlayCircle className="w-4 h-4" />
          Continue Learning
        </button>
      </div>
    </motion.div>
  );
}
