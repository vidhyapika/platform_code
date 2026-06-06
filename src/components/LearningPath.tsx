import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CheckCircle2, PlayCircle, BookOpen, Network,
  HelpCircle, Video, Brain, ChevronRight, Bot
} from 'lucide-react';
import type { StudentTopicProgress } from '../types';

interface LearningPathProps {
  topics: StudentTopicProgress[];
  onTopicClick?: (topic: StudentTopicProgress, idx: number) => void;
}

const STATUS_COLORS = {
  completed:   { ring: '#22c55e', bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', line: '#22c55e' },
  'in-progress': { ring: '#3b82f6', bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-700',   line: '#94a3b8' },
  'not-started': { ring: '#94a3b8', bg: 'bg-slate-50',   border: 'border-slate-200',  text: 'text-slate-500',  line: '#e2e8f0' },
};

const CATEGORY_COLORS = {
  Major:        'bg-red-100 text-red-700',
  Intermediate: 'bg-orange-100 text-orange-700',
  Minor:        'bg-yellow-100 text-yellow-700',
};

export function LearningPath({ topics, onTopicClick }: LearningPathProps) {
  const navigate = useNavigate();

  const handleTopicClick = (topic: StudentTopicProgress, idx: number) => {
    if (onTopicClick) onTopicClick(topic, idx);
    else navigate('/learn', { state: { topicIdx: idx } });
  };

  return (
    <div className="relative">
      {topics.map((topic, idx) => {
        const colors = STATUS_COLORS[topic.status];
        const videoCount = topic.subTopics.filter(s => s.videoUrl).length;
        const quizCount = topic.subTopics.reduce((n, s) => n + (s.quizzes?.length ?? 0), 0);
        const prereqCount = topic.prerequisites?.length ?? 0;
        const hasAI = (topic.aiSessionCount ?? 0) > 0;

        return (
          <div key={topic.id} className="relative">
            {/* Connector line */}
            {idx < topics.length - 1 && (
              <div
                className="absolute left-[27px] top-full w-0.5 z-0"
                style={{
                  height: '2rem',
                  backgroundColor: topic.status === 'completed' ? '#22c55e' : '#e2e8f0',
                }}
              />
            )}

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              className="relative flex gap-4 mb-8"
            >
              {/* Sequence circle */}
              <div className="flex-shrink-0 z-10">
                {topic.status === 'completed' ? (
                  <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                ) : topic.status === 'in-progress' ? (
                  <motion.div
                    animate={{ boxShadow: ['0 0 0 0 rgba(59,130,246,0)', '0 0 0 8px rgba(59,130,246,0.15)', '0 0 0 0 rgba(59,130,246,0)'] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-md"
                  >
                    <span className="text-white font-bold text-lg">{idx + 1}</span>
                  </motion.div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center">
                    <span className="text-slate-500 font-bold text-lg">{idx + 1}</span>
                  </div>
                )}
              </div>

              {/* Card */}
              <div
                className={`flex-1 rounded-2xl border-2 ${colors.bg} ${colors.border} p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => handleTopicClick(topic, idx)}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        topic.status === 'completed'   ? 'bg-emerald-100 text-emerald-700' :
                        topic.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {topic.status === 'completed' ? 'Completed' : topic.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                      </span>
                      {hasAI && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                          <Bot className="w-3 h-3" /> AI assisted
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{topic.title}</h3>
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleTopicClick(topic, idx);
                    }}
                      className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                        topic.status === 'completed'   ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                        topic.status === 'in-progress' ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm' :
                        'bg-slate-800 text-white hover:bg-slate-700 shadow-sm'
                      }`}
                    >
                      {topic.status === 'completed'   ? 'Review' :
                       topic.status === 'in-progress' ? <><PlayCircle className="w-3.5 h-3.5" /> Continue</> :
                       <><PlayCircle className="w-3.5 h-3.5" /> Start</>
                      }
                      {topic.status !== 'completed' && <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{topic.subtopicsCompleted}/{topic.totalSubtopics} subtopics</span>
                    <span>{topic.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progress}%` }}
                      transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                      className={`h-full rounded-full ${topic.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                  </div>
                </div>

                {/* Stat chips */}
                <div className="flex flex-wrap gap-2">
                  {prereqCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      <Network className="w-3 h-3" /> {prereqCount} prereq{prereqCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {videoCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      <Video className="w-3 h-3" /> {videoCount} video{videoCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {quizCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      <HelpCircle className="w-3 h-3" /> {quizCount} question{quizCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {(topic.finalTestQuiz?.length ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      <Brain className="w-3 h-3" /> Final test
                    </span>
                  )}
                  {/* Prereq category badges */}
                  {(topic.prerequisites ?? []).map(p => (
                    <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[p.category]}`}>
                      {p.category}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
