import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { motion } from 'motion/react';
import { MOCK_STUDENT_CURRICULUM } from '../data/mockData';
import {
  PlayCircle, CheckCircle2, Clock, HelpCircle, Target, Layers,
  Video, ChevronRight, Lock, BookOpen, Network, TrendingUp,
  Award, BarChart2, Brain
} from 'lucide-react';
import type { StudentTopicProgress } from '../types';

const STATUS_FILTERS = ['All', 'In Progress', 'Completed', 'Not Started'] as const;
type FilterKey = typeof STATUS_FILTERS[number];

// ── Mini attempt sparkline ───────────────────────────────────────────────────
function AttemptSparkline({ attempts }: { attempts: { score: number; total: number }[] }) {
  if (!attempts || attempts.length === 0) return null;
  return (
    <div className="flex items-end gap-0.5 h-4" title="Score history (oldest → latest)">
      {attempts.map((a, i) => {
        const pct = a.total > 0 ? (a.score / a.total) * 100 : 0;
        const isLast = i === attempts.length - 1;
        return (
          <div key={i} className={`w-2 rounded-sm ${isLast ? 'bg-emerald-500' : 'bg-slate-300'}`}
            style={{ height: `${Math.max(20, pct)}%` }} />
        );
      })}
    </div>
  );
}

// ── Topic card ───────────────────────────────────────────────────────────────
function TopicCard({ topic, idx, isLocked, onClick }: {
  topic: StudentTopicProgress;
  idx: number;
  isLocked: boolean;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isCompleted  = topic.status === 'completed';
  const isInProgress = topic.status === 'in-progress';

  const headerGradient = isCompleted
    ? 'from-emerald-500 to-teal-600'
    : isInProgress
      ? 'from-blue-500 to-indigo-600'
      : isLocked
        ? 'from-slate-300 to-slate-400'
        : 'from-slate-500 to-slate-600';

  const borderColor = isCompleted ? 'border-emerald-200'
    : isInProgress ? 'border-blue-200'
    : 'border-slate-200';

  const prereqCount = topic.prerequisites?.length ?? 0;
  const videoCount  = topic.subTopics.filter(s => !!s.videoUrl).length;
  const totalQs     = topic.subTopics.reduce((a, s) => a + (s.quizzes?.length ?? 0), 0)
    + (topic.preEvaluationQuiz?.length ?? 0)
    + (topic.postEvaluationQuiz?.length ?? 0);

  return (
    <div className={`bg-white rounded-2xl border ${borderColor} shadow-sm hover:shadow-md flex flex-col overflow-hidden transition-shadow`}>

      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${headerGradient} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 bg-white/20 text-white">
            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : <span>{idx + 1}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-extrabold text-base leading-tight">{topic.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                {isLocked ? 'Locked' : topic.status.replace('-', ' ')}
              </span>
              {isCompleted && <Award className="w-3.5 h-3.5 text-yellow-300" />}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-black text-white">{topic.progress}%</span>
            <p className="text-[10px] text-white/70 mt-0.5">{topic.subtopicsCompleted}/{topic.totalSubtopics}</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${topic.progress}%` }} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-0 flex-1 flex flex-col gap-4">

        {/* Quick stat chips */}
        <div className="flex flex-wrap gap-1.5">
          {videoCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg">
              <Video className="w-3.5 h-3.5" /> {videoCount} Video{videoCount > 1 ? 's' : ''}
            </span>
          )}
          {totalQs > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg">
              <HelpCircle className="w-3.5 h-3.5" /> {totalQs} Q{totalQs > 1 ? 's' : ''}
            </span>
          )}
          {prereqCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg">
              <Network className="w-3.5 h-3.5" /> {prereqCount} Prereq{prereqCount > 1 ? 's' : ''}
            </span>
          )}
          {(topic.preEvaluationQuiz?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg">
              <Target className="w-3.5 h-3.5" /> Pre-eval
            </span>
          )}
          {(topic.postEvaluationQuiz?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-lg">
              <BarChart2 className="w-3.5 h-3.5" /> Post-eval
            </span>
          )}
        </div>

        {/* Evaluation scores */}
        {(topic.preEvaluationScore || topic.postEvaluationScore) && (
          <div className="flex gap-2">
            {topic.preEvaluationScore && (
              <div className="flex items-center gap-2 flex-1 bg-orange-50 border border-orange-100 rounded-xl p-2.5">
                <Target className="w-4 h-4 text-orange-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider">Pre-Eval</p>
                  <p className="text-sm font-extrabold text-orange-800 leading-tight">
                    {topic.preEvaluationScore.score}/{topic.preEvaluationScore.total}
                  </p>
                </div>
                {topic.preEvaluationScore.attempts && (
                  <AttemptSparkline attempts={topic.preEvaluationScore.attempts} />
                )}
              </div>
            )}
            {topic.postEvaluationScore && (
              <div className="flex items-center gap-2 flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                <BarChart2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Post-Eval</p>
                  <p className="text-sm font-extrabold text-emerald-800 leading-tight">
                    {topic.postEvaluationScore.score}/{topic.postEvaluationScore.total}
                  </p>
                </div>
                {topic.postEvaluationScore.attempts && (
                  <AttemptSparkline attempts={topic.postEvaluationScore.attempts} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Prerequisites */}
        {topic.prerequisites && topic.prerequisites.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Network className="w-3 h-3" /> Prerequisites
            </p>
            <div className="space-y-1.5">
              {topic.prerequisites.map(p => {
                const score = topic.prerequisiteScores.find(s => s.id === p.id);
                const pct = score ? Math.round((score.score / score.total) * 100) : null;
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    {score
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />}
                    <span className="text-xs text-slate-700 flex-1 truncate">{p.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {score?.attempts && <AttemptSparkline attempts={score.attempts} />}
                      {pct !== null
                        ? <span className="text-xs font-extrabold text-emerald-600">{pct}%</span>
                        : <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase
                            ${p.category === 'Major' ? 'bg-red-100 text-red-700'
                              : p.category === 'Intermediate' ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-500'}`}>
                            {p.category}
                          </span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subtopics */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" /> Subtopics
          </p>
          <div className="space-y-1.5">
            {topic.subTopics.slice(0, expanded ? undefined : 3).map(sub => (
              <div key={sub.id} className="flex items-center gap-2">
                {sub.status === 'completed'
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : sub.status === 'in-progress'
                    ? <PlayCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    : <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                <span className={`text-xs flex-1 truncate ${sub.status === 'not-started' ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                  {sub.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {sub.quizScore?.attempts && <AttemptSparkline attempts={sub.quizScore.attempts} />}
                  {sub.quizScore && (
                    <span className="text-[10px] font-extrabold text-emerald-600">
                      {sub.quizScore.score}/{sub.quizScore.total}
                    </span>
                  )}
                  <div className="flex gap-0.5">
                    {sub.videoUrl && <Video className="w-3 h-3 text-blue-400" />}
                    {(sub.quizzes?.length ?? 0) > 0 && <HelpCircle className="w-3 h-3 text-amber-400" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {topic.subTopics.length > 3 && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mt-2">
              {expanded ? '↑ Show less' : `+${topic.subTopics.length - 3} more`}
            </button>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pt-4 pb-5">
        <button
          onClick={onClick}
          disabled={isLocked}
          className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
            ${isLocked
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isCompleted
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : isInProgress
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md'}`}>
          {isLocked
            ? <><Lock className="w-4 h-4" /> Complete previous topic first</>
            : isCompleted
              ? <><CheckCircle2 className="w-4 h-4" /> Review Topic <ChevronRight className="w-4 h-4 ml-auto" /></>
              : isInProgress
                ? <><PlayCircle className="w-4 h-4" /> Continue Learning <ChevronRight className="w-4 h-4 ml-auto" /></>
                : <><PlayCircle className="w-4 h-4" /> Start Topic <ChevronRight className="w-4 h-4 ml-auto" /></>}
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const prereqsVerified = topics.filter(t =>
    (t.prerequisites?.length ?? 0) === 0 ||
    t.prerequisiteScores.length >= (t.prerequisites?.length ?? 0)
  ).length;

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Curriculum</h1>
            <p className="text-slate-500 font-medium mt-1">
              {standard} · {section} · {completedTopics}/{totalTopics} topics completed
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${filter === f
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Summary stat cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Overall Progress', value: `${overallProgress}%`,       icon: TrendingUp,  color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'Topics Completed', value: `${completedTopics}/${totalTopics}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Prereqs Tested',   value: `${prereqsVerified}/${totalTopics}`, icon: Network,      color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'AI Coach',         value: 'Coming Soon',               icon: Brain,       color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
                <p className="text-lg font-extrabold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Learning path progress bar */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-700">Learning Path Progress</span>
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
          <div className="flex justify-between mt-2">
            {topics.map((t, i) => (
              <div key={t.id} className="flex flex-col items-center" style={{ width: `${100 / topics.length}%` }}>
                <div className={`w-2 h-2 rounded-full mt-0.5
                  ${t.status === 'completed' ? 'bg-indigo-500'
                    : t.status === 'in-progress' ? 'bg-blue-400 ring-2 ring-blue-200'
                    : 'bg-slate-200'}`} />
                <span className="hidden md:block text-[9px] text-slate-400 font-medium mt-1 text-center truncate w-full px-1">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Topic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((topic) => {
            const trueIdx = topics.indexOf(topic);
            const isLocked = topic.status === 'not-started' && trueIdx > 0 && topics[trueIdx - 1].status !== 'completed';
            return (
              <motion.div key={topic.id} variants={itemVariants}>
                <TopicCard
                  topic={topic}
                  idx={trueIdx}
                  isLocked={isLocked}
                  onClick={() => !isLocked && navigate('/learn')}
                />
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
