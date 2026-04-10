import React from 'react';
import { Award, BookOpen, CheckCircle2, ChevronRight, PlayCircle, HelpCircle, Clock, Target, Layers } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  MOCK_ACTIVITIES, 
  MOCK_QUICK_LINKS, 
  MOCK_DASHBOARD_ASSIGNMENTS, 
  MOCK_DASHBOARD_SCHEDULE,
  MOCK_STUDENT_CURRICULUM,
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

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-6">

        {/* Welcome Banner */}
        <motion.div variants={itemVariants}
          className="bg-gradient-to-r from-[#006A91] to-[#0084B4] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-md">
          <div className="relative z-10 space-y-3 text-center md:text-left max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">
                {curriculum.standard}
              </span>
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">
                {curriculum.className}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, Arjun! <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-blue-100 font-medium text-sm sm:text-base max-w-lg">
              You're {curriculum.overallProgress}% through your curriculum. {currentTopic ? `Keep going — "${currentTopic.title}" is next!` : 'All topics completed!'}
            </p>
            {currentTopic && (
              <button onClick={() => navigate('/learn')}
                className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-white text-[#006A91] text-sm font-extrabold rounded-xl hover:bg-blue-50 transition-colors shadow">
                <PlayCircle className="w-4 h-4" /> Continue Learning
              </button>
            )}
          </div>
          <div className="relative z-10 mt-6 md:mt-0 flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Completed</p>
              <p className="text-2xl font-extrabold text-white">{curriculum.completedTopics}/{curriculum.totalTopics}</p>
              <p className="text-[10px] text-blue-200 font-medium mt-0.5">Topics</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Sub-topics</p>
              <p className="text-2xl font-extrabold text-white">{doneSubTopics}/{totalSubTopics}</p>
              <p className="text-[10px] text-blue-200 font-medium mt-0.5">Done</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Topic Progress */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">Curriculum Topics</h2>
                <button onClick={() => navigate('/courses')} className="text-sm font-bold text-[#0084B4] hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {curriculum.topics.map((topic, idx) => {
                  const prereqCount  = topic.prerequisites?.length ?? 0;
                  const quizCount    = (topic.preEvaluationQuiz?.length ?? 0) + (topic.postEvaluationQuiz?.length ?? 0) +
                                       topic.subTopics.reduce((a, s) => a + (s.quizzes?.length ?? 0), 0);
                  const statusColor  = topic.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                       topic.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500';
                  const barColor     = topic.status === 'completed' ? 'bg-emerald-500' :
                                       topic.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-200';
                  return (
                    <div key={topic.id}
                      onClick={() => navigate('/learn')}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0
                        ${topic.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : topic.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {topic.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{topic.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${statusColor}`}>
                            {topic.status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{topic.subtopicsCompleted}/{topic.totalSubtopics} subtopics</span>
                          {prereqCount > 0 && <span className="flex items-center gap-1"><Target className="w-3 h-3" />{prereqCount} prereqs</span>}
                          {quizCount > 0 && <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" />{quizCount} questions</span>}
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${topic.progress}%` }} />
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-slate-700 shrink-0">{topic.progress}%</div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Summary stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Topics Total', value: curriculum.totalTopics, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Completed', value: curriculum.completedTopics, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Sub-topics Done', value: doneSubTopics, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Quiz Questions', value: totalQuestions, icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map(stat => (
                <motion.div key={stat.label} variants={itemVariants}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
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

          {/* Right 1/3 */}
          <div className="space-y-6">
            {/* Assignments */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">Assignments</h2>
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">1 Pending</span>
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

              <div className="mt-6 bg-gradient-to-r from-[#7CB342] to-[#8BC34A] rounded-2xl p-4 flex items-center gap-4 text-white shadow-sm">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Weekly Challenge</h4>
                  <p className="text-xs font-medium text-white/90">Complete {curriculum.topics.find(t => t.status === 'in-progress')?.title ?? 'next topic'} today</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
