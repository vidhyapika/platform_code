import React from 'react';
import { Award } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { motion } from 'motion/react';
import { 
  MOCK_DASHBOARD_COURSES, 
  MOCK_ACTIVITIES, 
  MOCK_QUICK_LINKS, 
  MOCK_DASHBOARD_ASSIGNMENTS, 
  MOCK_DASHBOARD_SCHEDULE 
} from '../data/mockData';
import { DashboardCourseCard } from '../components/DashboardCourseCard';

export function Dashboard() {
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
        className="w-full max-w-[1600px] mx-auto space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#006A91] to-[#0084B4] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-md">
          <div className="relative z-10 space-y-3 text-center md:text-left max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">
                Grade 9
              </span>
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">
                Section A
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, Arjun! <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-blue-100 font-medium text-sm sm:text-base max-w-lg">
              You've completed 85% of your weekly goals. Finish your Science project to hit your milestone!
            </p>
          </div>
          
          <div className="relative z-10 mt-6 md:mt-0 flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Study Streak</p>
              <p className="text-2xl font-extrabold text-white">12 Days</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Total Points</p>
              <p className="text-2xl font-extrabold text-white">2,450</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Takes up 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Course Progress */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">Course Progress</h2>
                <a href="#" className="text-sm font-bold text-[#0084B4] hover:underline">View All</a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {MOCK_DASHBOARD_COURSES.map(course => (
                  <DashboardCourseCard key={course.id} course={course} />
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h2>
                <div className="space-y-6">
                  {MOCK_ACTIVITIES.map(activity => (
                    <div key={activity.id} className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full ${activity.bgColor} ${activity.color} flex items-center justify-center shrink-0`}>
                        <activity.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">{activity.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{activity.time} - {activity.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Quick Links</h2>
                <div className="grid grid-cols-2 gap-4">
                  {MOCK_QUICK_LINKS.map(link => (
                    <button key={link.id} className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors gap-3">
                      <link.icon className={`w-8 h-8 ${link.color}`} />
                      <span className="text-xs font-bold text-slate-700">{link.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>

          {/* Right Column (Takes up 1/3) */}
          <div className="space-y-6">
            
            {/* Assignments */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">Assignments</h2>
                <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">3 Pending</span>
              </div>
              <div className="space-y-5">
                {MOCK_DASHBOARD_ASSIGNMENTS.map(assignment => (
                  <div key={assignment.id} className="relative pl-4">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${assignment.isUrgent ? 'bg-red-500' : 'bg-[#0084B4]'}`}></div>
                    <p className={`text-xs font-bold mb-1 ${assignment.isUrgent ? 'text-red-500' : 'text-slate-500'}`}>{assignment.due}</p>
                    <h4 className="text-sm font-bold text-slate-800 mb-0.5">{assignment.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{assignment.subject}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                View Deadline Calendar
              </button>
            </motion.div>

            {/* Today's Schedule */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Today's Schedule</h2>
              <div className="space-y-4">
                {MOCK_DASHBOARD_SCHEDULE.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="text-right min-w-[60px] pt-1">
                      <p className="text-xs font-bold text-slate-800">{item.time.split(' ')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-400">{item.time.split(' ')[1]}</p>
                    </div>
                    <div className="flex-1 border border-slate-100 rounded-2xl p-4 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'live' ? 'bg-[#7CB342]' : 'bg-[#0084B4]'}`}></div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mb-2">{item.teacher}</p>
                      {item.type === 'live' && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#7CB342]"></div>
                          <span className="text-[10px] font-bold text-[#7CB342]">Link Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly Challenge Banner */}
              <div className="mt-6 bg-gradient-to-r from-[#7CB342] to-[#8BC34A] rounded-2xl p-4 flex items-center gap-4 text-white shadow-sm">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Weekly Challenge</h4>
                  <p className="text-xs font-medium text-white/90">Solve 5 Math problems today</p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </motion.div>
    </DashboardLayout>
  );
}
