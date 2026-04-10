import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { motion } from 'motion/react';
import { MOCK_STUDENT_CURRICULUM } from '../data/mockData';
import {
  PlayCircle, CheckCircle2, Clock, HelpCircle, Target, Layers,
  Video, ChevronRight, Lock, BookOpen, Network
} from 'lucide-react';

const STATUS_FILTERS = ['All', 'In Progress', 'Completed', 'Not Started'] as const;
type FilterKey = typeof STATUS_FILTERS[number];

export function Courses() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('All');
  const { topics, standard, className: section, overallProgress, completedTopics, totalTopics } = MOCK_STUDENT_CURRICULUM;

  const filtered = topics.filter(t => {
    if (filter === 'All')          return true;
    if (filter === 'In Progress')  return t.status === 'in-progress';
    if (filter === 'Completed')    return t.status === 'completed';
    if (filter === 'Not Started')  return t.status === 'not-started';
    return true;
  });

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Curriculum</h1>
            <p className="text-slate-500 font-medium mt-1">
              {standard} · {section} · {completedTopics}/{totalTopics} topics completed · {overallProgress}% overall
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Overall progress bar */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-slate-700">Overall Progress</span>
            <span className="text-sm font-extrabold text-slate-900">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-slate-400">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </motion.div>

        {/* Topic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((topic, idx) => {
            const isLocked    = topic.status === 'not-started' && idx > 0 && topics[idx - 1].status !== 'completed';
            const prereqCount = topic.prerequisites?.length ?? 0;
            const preQs       = topic.preEvaluationQuiz?.length ?? 0;
            const postQs      = topic.postEvaluationQuiz?.length ?? 0;
            const subQuizQs   = topic.subTopics.reduce((a, s) => a + (s.quizzes?.length ?? 0), 0);
            const totalQs     = preQs + postQs + subQuizQs;
            const hasVideo    = topic.subTopics.some(s => !!s.videoUrl);

            const borderColor = topic.status === 'completed' ? 'border-emerald-200 hover:border-emerald-400'
              : topic.status === 'in-progress' ? 'border-blue-200 hover:border-blue-400'
              : 'border-slate-200 hover:border-slate-300';
            const topBg = topic.status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : topic.status === 'in-progress' ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
              : 'bg-gradient-to-br from-slate-400 to-slate-500';

            return (
              <motion.div key={topic.id} variants={itemVariants}
                className={`bg-white rounded-2xl border ${borderColor} shadow-sm flex flex-col overflow-hidden transition-all cursor-pointer group`}
                onClick={() => !isLocked && navigate('/learn')}>

                {/* Top accent */}
                <div className={`${topBg} p-5 relative`}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-extrabold text-lg">
                      {topic.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                    </div>
                    {isLocked && (
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-white font-extrabold text-lg mt-3 leading-tight">{topic.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider
                      ${topic.status === 'completed' ? 'bg-white/25 text-white' : topic.status === 'in-progress' ? 'bg-white/25 text-white' : 'bg-white/15 text-white/80'}`}>
                      {topic.status.replace('-', ' ')}
                    </span>
                    <span className="text-white/70 text-xs font-medium">Sequence #{topic.progress !== undefined ? idx + 1 : '—'}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${topic.progress}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-white/70 font-semibold">
                    <span>{topic.subtopicsCompleted}/{topic.totalSubtopics} sub-topics</span>
                    <span>{topic.progress}%</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2">
                    {prereqCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                        <Network className="w-3 h-3" /> {prereqCount} Prereq{prereqCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {preQs > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg">
                        <Target className="w-3 h-3" /> Pre-eval
                      </span>
                    )}
                    {postQs > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-lg">
                        <BookOpen className="w-3 h-3" /> Post-eval
                      </span>
                    )}
                    {hasVideo && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg">
                        <Video className="w-3 h-3" /> Video
                      </span>
                    )}
                    {totalQs > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg">
                        <HelpCircle className="w-3 h-3" /> {totalQs} Q{totalQs > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Subtopics list */}
                  {topic.subTopics.length > 0 && (
                    <div className="space-y-1.5">
                      {topic.subTopics.map(sub => (
                        <div key={sub.id} className="flex items-center gap-2 text-xs text-slate-600">
                          {sub.status === 'completed'
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            : sub.status === 'in-progress'
                              ? <PlayCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              : <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                          <span className={`font-medium truncate ${sub.status === 'not-started' ? 'text-slate-400' : 'text-slate-700'}`}>
                            {sub.title}
                          </span>
                          <div className="ml-auto flex gap-1 shrink-0">
                            {sub.videoUrl && <Video className="w-3 h-3 text-blue-400" />}
                            {(sub.quizzes?.length ?? 0) > 0 && <HelpCircle className="w-3 h-3 text-orange-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Scores if completed */}
                  {topic.status === 'completed' && (
                    <div className="mt-auto pt-3 border-t border-slate-100 flex gap-4 text-xs">
                      {topic.preEvaluationScore && (
                        <div className="text-slate-500 font-medium">
                          Pre-eval: <span className="font-extrabold text-emerald-600">{topic.preEvaluationScore.score}/{topic.preEvaluationScore.total}</span>
                        </div>
                      )}
                      {topic.postEvaluationScore && (
                        <div className="text-slate-500 font-medium">
                          Post-eval: <span className="font-extrabold text-emerald-600">{topic.postEvaluationScore.score}/{topic.postEvaluationScore.total}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!isLocked) navigate('/learn'); }}
                    disabled={isLocked}
                    className={`mt-auto w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors
                      ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : topic.status === 'completed' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : topic.status === 'in-progress' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      : 'bg-slate-900 text-white hover:bg-slate-700 shadow-sm'}`}>
                    {isLocked ? <><Lock className="w-4 h-4" /> Locked</> :
                     topic.status === 'completed' ? <><CheckCircle2 className="w-4 h-4" /> Review</> :
                     topic.status === 'in-progress' ? <><PlayCircle className="w-4 h-4" /> Continue</> :
                     <><PlayCircle className="w-4 h-4" /> Start</>}
                    {!isLocked && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Layers className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No topics match this filter.</p>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
