import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { motion } from 'motion/react';
import { MOCK_STUDENT_CURRICULUM } from '../data/mockData';
import {
  PlayCircle, CheckCircle2, HelpCircle, Video,
  ChevronRight, Lock, Network, TrendingUp,
} from 'lucide-react';
import type { StudentTopicProgress } from '../types';

// ── Topic card ───────────────────────────────────────────────────────────────
function TopicCard({ topic, idx, isLocked, onClick }: {
  topic: StudentTopicProgress;
  idx: number;
  isLocked: boolean;
  onClick: () => void;
}) {
  const isCompleted  = topic.status === 'completed';
  const isInProgress = topic.status === 'in-progress';

  const videoCount = topic.subTopics.filter(s => !!s.videoUrl).length;
  const quizCount  = topic.subTopics.reduce((a, s) => a + (s.quizzes?.length ?? 0), 0)
    + (topic.preEvaluationQuiz?.length ?? 0)
    + (topic.postEvaluationQuiz?.length ?? 0);
  const prereqCount = topic.prerequisites?.length ?? 0;

  const stripe = isCompleted ? 'bg-emerald-500'
    : isInProgress ? 'bg-[#0084B4]'
    : isLocked ? 'bg-slate-200'
    : 'bg-slate-300';

  const border = isCompleted ? 'border-emerald-200'
    : isInProgress ? 'border-blue-200'
    : 'border-slate-200';

  return (
    <div className={`bg-white rounded-2xl border ${border} shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden`}>
      <div className={`h-1.5 ${stripe}`} />

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Number + title + status */}
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0
            ${isCompleted ? 'bg-emerald-100 text-emerald-700'
              : isInProgress ? 'bg-blue-100 text-blue-700'
              : isLocked ? 'bg-slate-100 text-slate-400'
              : 'bg-slate-900 text-white'}`}>
            {isCompleted
              ? <CheckCircle2 className="w-4 h-4" />
              : isLocked
                ? <Lock className="w-3.5 h-3.5" />
                : idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-slate-900 text-base leading-tight line-clamp-2">{topic.title}</h3>
            <span className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase
              ${isCompleted ? 'bg-emerald-100 text-emerald-700'
                : isInProgress ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-500'}`}>
              {isLocked ? 'Locked' : topic.status.replace('-', ' ')}
            </span>
          </div>
          <span className="text-2xl font-black text-slate-200 shrink-0">{topic.progress}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-[#0084B4]'}`}
            style={{ width: `${topic.progress}%` }}
          />
        </div>

        {/* Stat chips */}
        <div className="flex gap-2 flex-wrap">
          {videoCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg">
              <Video className="w-3 h-3" /> {videoCount}
            </span>
          )}
          {quizCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg">
              <HelpCircle className="w-3 h-3" /> {quizCount}
            </span>
          )}
          {prereqCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg">
              <Network className="w-3 h-3" /> {prereqCount} prereq{prereqCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={onClick}
          disabled={isLocked}
          className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
            ${isLocked
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isCompleted
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : isInProgress
                  ? 'bg-[#0084B4] text-white hover:bg-[#006A91] shadow-sm'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'}`}
        >
          {isLocked
            ? <><Lock className="w-4 h-4" /> Locked</>
            : isCompleted
              ? <><CheckCircle2 className="w-4 h-4" /> Review <ChevronRight className="w-4 h-4 ml-auto" /></>
              : isInProgress
                ? <><PlayCircle className="w-4 h-4" /> Continue <ChevronRight className="w-4 h-4 ml-auto" /></>
                : <><PlayCircle className="w-4 h-4" /> Start Topic <ChevronRight className="w-4 h-4 ml-auto" /></>}
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function Courses() {
  const navigate = useNavigate();
  const {
    topics, standard, className: section,
    overallProgress, completedTopics, totalTopics,
  } = MOCK_STUDENT_CURRICULUM;

  const inProgressTopic = topics.find(t => t.status === 'in-progress');

  const containerVariants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants} initial="hidden" animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Curriculum</h1>
            <p className="text-slate-500 font-medium mt-1">
              {standard} · {section} · {completedTopics}/{totalTopics} topics completed
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Progress</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0084B4] rounded-full" style={{ width: `${overallProgress}%` }} />
                </div>
                <span className="text-sm font-extrabold text-[#0084B4]">{overallProgress}%</span>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-[#0084B4] shrink-0" />
          </div>
        </motion.div>

        {/* Continue banner */}
        {inProgressTopic && (
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-[#0084B4] to-[#006A91] rounded-2xl p-5 flex items-center gap-4 text-white shadow"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Continue where you left off</p>
              <p className="font-extrabold truncate">{inProgressTopic.title}</p>
            </div>
            <button
              onClick={() => navigate('/learn', { state: { topicIdx: topics.indexOf(inProgressTopic) } })}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white text-[#006A91] font-extrabold text-sm rounded-xl hover:bg-blue-50 transition-colors shadow"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Topic grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {topics.map((topic, idx) => {
            const isLocked = idx > 0 && topics[idx - 1].status === 'not-started';
            return (
              <motion.div key={topic.id} variants={itemVariants}>
                <TopicCard
                  topic={topic}
                  idx={idx}
                  isLocked={isLocked}
                  onClick={() => navigate('/learn', { state: { topicIdx: idx } })}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
