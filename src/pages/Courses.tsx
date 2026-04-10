import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { motion } from 'motion/react';
import { MOCK_COURSES } from '../data/mockData';
import { PlayCircle, Clock, Award } from 'lucide-react';

export function Courses() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <DashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Learning</h1>
            <p className="text-slate-500 font-medium mt-1">Pick up where you left off and track your progress.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
              In Progress
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">
              Completed
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_COURSES.map((course) => (
            <motion.div 
              variants={itemVariants} 
              key={course.id} 
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer"
              onClick={() => navigate('/learn')}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-900 shadow-lg">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${course.bgColor} ${course.color}`}>
                    <course.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{course.instructor}</span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
                
                <div className="mt-auto">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500">{course.progress}% Complete</span>
                    <span className="text-slate-700">{course.completedLessons}/{course.totalLessons} Lessons</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
