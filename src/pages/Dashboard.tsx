import React from 'react';
import { Award, BookOpen, CheckCircle2, ChevronRight, PlayCircle, HelpCircle, Layers, Bot, Flame, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { LearningPath } from '../components/LearningPath';
import { ProgressRing } from '../components/ui/ProgressRing';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  MOCK_ACTIVITIES, 
  MOCK_QUICK_LINKS, 
  MOCK_DASHBOARD_ASSIGNMENTS, 
  MOCK_DASHBOARD_SCHEDULE,
  MOCK_STUDENT_CURRICULUM,
  MOCK_BADGES,
} from '../data/mockData';

export function Dashboard() {
  const navigate = useNavigate();
  const curriculum = MOCK_STUDENT_CURRICULUM;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const inProgressTopic = curriculum.topics.find(t => t.status === 'in-progress');
  const nextNotStarted  = curriculum.topics.find(t => t.status === 'not-started');
  const currentTopic    = inProgressTopic ?? nextNotStarted;

  const totalSubTopics  = curriculum.topics.reduce((a, t) => a + t.totalSubtopics, 0);
  const doneSubTopics   = curriculum.topics.reduce((a, t) => a + t.subtopicsCompleted, 0);
  const totalQuestions  = curriculum.topics.reduce((a, t) =>
    a + (t.preEvaluationQuiz?.length ?? 0) + (t.postEvaluationQuiz?.length ?? 0) +
    t.subTopics.reduce((b, s) => b + (s.quizzes?.length ?? 0), 0), 0);
  const aiSessionTotal  = curriculum.aiSessionCount ?? 0;
  const passRate        = totalSubTopics > 0 ? Math.round((doneSubTopics / totalSubTopics) * 100) : 0;

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-6">

        {/* â”€â”€ Welcome Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.div variants={itemVariants}
          className="bg-gradient-to-r from-[#006A91] via-[#0084B4] to-[#00A8C8] rounded-3xl p-8 sm:p-10
                     flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-lg">
          {/* Background decoration */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none hidden md:block">
            <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
              <circle cx="350" cy="50" r="120" fill="white" />
              <circle cx="250" cy="250" r="80" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 space-y-3 text-center md:text-left max-w-xl">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">{curriculum.standard}</span>
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">{curriculum.className}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, Arjun! <span className="inline-block animate-wave origin-bottom-right">ðŸ‘‹</span>
            </h1>
            <p className="text-blue-100 font-medium text-sm sm:text-base">
              {currentTopic
                ? <>You're on <span className="font-bold text-white">"{currentTopic.title}"</span> â€” keep going!</>
                : 'All topics completed â€” great work!'}
            </p>
            {currentTopic && (
              <button onClick={() => navigate('/learn')}
                className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-white text-[#006A91] text-sm font-extrabold rounded-xl hover:bg-blue-50 transition-colors shadow">
                <PlayCircle className="w-4 h-4" /> Continue Learning <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress ring + mini stats */}
          <div className="relative z-10 mt-8 md:mt-0 flex items-center gap-6">
            <ProgressRing
              percent={curriculum.overallProgress}
              size={110}
              strokeWidth={9}
              color="#7CB342"
              trackColor="rgba(255,255,255,0.2)"
              label={
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-white">{curriculum.overallProgress}%</p>
                  <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wider">Overall</p>
                </div>
              }
            />
            <div className="hidden sm:flex flex-col gap-3">
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Topics</p>
                <p className="text-xl font-extrabold text-white">{curriculum.completedTopics}<span className="text-sm text-blue-200">/{curriculum.totalTopics}</span></p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Sub-topics</p>
                <p className="text-xl font-extrabold text-white">{doneSubTopics}<span className="text-sm text-blue-200">/{totalSubTopics}</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* â”€â”€ Quick Stats Strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Topics Completed', value: `${curriculum.completedTopics}/${curriculum.totalTopics}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Current Streak',   value: '12 Days',                                                  icon: Flame,         color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-100' },
            { label: 'AI Sessions Used', value: aiSessionTotal.toString(),                                   icon: Bot,           color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
            { label: 'Quiz Pass Rate',   value: `${passRate}%`,                                              icon: TrendingUp,    color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100'   },
          ].map(stat => (
            <motion.div key={stat.label} variants={itemVariants}
              className={`bg-white rounded-2xl p-4 border ${stat.border} shadow-sm flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="text-xs font-bold text-slate-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* â”€â”€ Main content: roadmap + sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* â”€â”€ Learning Roadmap (left 2/3) â”€â”€â”€â”€ */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Your Learning Path</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Complete topics in sequence â€” each builds on the last</p>
                </div>
                <button onClick={() => navigate('/courses')} className="text-sm font-bold text-[#0084B4] hover:underline flex items-center gap-1">
                  Detail View <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <LearningPath topics={curriculum.topics} />
            </motion.div>

            {/* Recent Activity + Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-5">Recent Activity</h2>
                <div className="space-y-5">
                  {MOCK_ACTIVITIES.map(activity => (
                    <div key={activity.id} className="flex gap-4">
                      <div className={`w-9 h-9 rounded-full ${activity.bgColor} ${activity.color} flex items-center justify-center shrink-0`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight mb-0.5">{activity.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{activity.time} Â· {activity.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-5">Quick Links</h2>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_QUICK_LINKS.map(link => (
                    <button key={link.id} className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors gap-2.5">
                      <link.icon className={`w-7 h-7 ${link.color}`} />
                      <span className="text-xs font-bold text-slate-700">{link.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* â”€â”€ Right sidebar â”€â”€â”€â”€â”€ */}
          <div className="space-y-6">

            {/* Assignments */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Assignments</h2>
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">1 Pending</span>
              </div>
              <div className="space-y-4">
                {MOCK_DASHBOARD_ASSIGNMENTS.map(a => (
                  <div key={a.id} className="relative pl-4">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${a.isUrgent ? 'bg-red-500' : 'bg-[#0084B4]'}`} />
                    <p className={`text-xs font-bold mb-0.5 ${a.isUrgent ? 'text-red-500' : 'text-slate-500'}`}>{a.due}</p>
                    <h4 className="text-sm font-bold text-slate-800 mb-0.5">{a.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{a.subject}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Today's Schedule */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-5">Today's Schedule</h2>
              <div className="space-y-3">
                {MOCK_DASHBOARD_SCHEDULE.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="text-right min-w-[58px] pt-1 shrink-0">
                      <p className="text-xs font-bold text-slate-800">{item.time.split(' ')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-400">{item.time.split(' ')[1]}</p>
                    </div>
                    <div className="flex-1 border border-slate-100 rounded-xl p-3 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'live' ? 'bg-[#7CB342]' : 'bg-[#0084B4]'}`} />
                      <h4 className="text-sm font-bold text-slate-800 mb-0.5">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.teacher}</p>
                      {item.type === 'live' && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7CB342] animate-pulse" />
                          <span className="text-[10px] font-bold text-[#7CB342]">Live</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-gradient-to-r from-[#7CB342] to-[#8BC34A] rounded-2xl p-4 flex items-center gap-3 text-white shadow-sm">
                <div className="bg-white/20 p-2 rounded-xl shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Weekly Challenge</h4>
                  <p className="text-xs text-white/90">Complete {currentTopic?.title ?? 'next topic'} today</p>
                </div>
              </div>
            </motion.div>

            {/* Badges Strip */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Badges</h2>
                <button onClick={() => navigate('/achievements')} className="text-sm font-bold text-[#0084B4] hover:underline flex items-center gap-1">
                  All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {MOCK_BADGES.slice(0, 6).map(badge => (
                  <div key={badge.id} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${badge.unlocked ? `${badge.bgColor} border-transparent` : 'bg-slate-50 border-slate-100 opacity-50 grayscale'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${badge.unlocked ? badge.bgColor : 'bg-slate-200'}`}>
                      <badge.icon className={`w-5 h-5 ${badge.unlocked ? badge.color : 'text-slate-400'}`} />
                    </div>
                    <p className="text-[10px] font-bold text-center text-slate-700 leading-tight">{badge.title}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

