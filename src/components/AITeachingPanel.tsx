import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Brain, AlertTriangle, Lightbulb, CheckCircle2,
  RotateCcw, ChevronRight, BookOpen, Zap, Target
} from 'lucide-react';
import { InlineQuiz } from './InlineQuiz';
import { AIBadge } from './ui/AIBadge';
import type { Question } from '../types';

interface WrongAnswer {
  questionText: string;
  yourAnswer: string;
  correctAnswer: string;
  explanation: string;
}

interface AITeachingPanelProps {
  topicTitle: string;
  subtopicTitle?: string;
  kind: 'prerequisite' | 'subtopic' | 'final-test';
  wrongAnswers?: WrongAnswer[];
  retakeQuestions: Question[];
  onPassed: () => void;
  onBack?: () => void;
}

// Mock concept cards per kind
const CONCEPT_CARDS = {
  prerequisite: [
    { icon: BookOpen,  title: 'Foundation First',   body: 'Every topic builds on basics. Make sure you solidify core concepts before moving forward.' },
    { icon: Zap,       title: 'Active Recall',       body: 'Testing yourself is more effective than re-reading. Challenge your memory regularly.' },
    { icon: Target,    title: 'Focus on Errors',     body: 'Mistakes are your best teachers — the questions you got wrong reveal exactly what to review.' },
  ],
  subtopic: [
    { icon: BookOpen,  title: 'Step-by-Step',        body: 'Break complex problems into smaller steps. Show your work clearly.' },
    { icon: Zap,       title: 'Apply the Formula',   body: 'Understanding when and how to apply each formula is key to mastery.' },
    { icon: Target,    title: 'Practice Patterns',   body: 'Look for patterns in similar problems — they share the same underlying logic.' },
  ],
  'final-test': [
    { icon: BookOpen,  title: 'Connect the Dots',    body: 'Final tests examine how well you connect all the sub-topics together.' },
    { icon: Zap,       title: 'Review Weak Areas',   body: 'Focus your revision on the subtopics where you lost the most points.' },
    { icon: Target,    title: 'Manage Your Time',    body: 'Read each question carefully. If stuck, move on and come back.' },
  ],
};

type PanelState = 'teaching' | 'quiz' | 'passed';

export function AITeachingPanel({
  topicTitle,
  subtopicTitle,
  kind,
  wrongAnswers = [],
  retakeQuestions,
  onPassed,
  onBack,
}: AITeachingPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>('teaching');
  const [passed, setPassed] = useState(false);

  const conceptCards = CONCEPT_CARDS[kind];
  const subjectLine = kind === 'prerequisite'
    ? `Let's strengthen the prerequisite: "${topicTitle}"`
    : kind === 'subtopic'
    ? `Let's revisit: "${subtopicTitle ?? topicTitle}"`
    : `Let's review the topic: "${topicTitle}"`;

  function handleQuizComplete(score: number, total: number) {
    const pct = total > 0 ? (score / total) * 100 : 0;
    if (pct >= 60) {
      setPassed(true);
      setPanelState('passed');
    } else {
      // Let the quiz component show the review, user can retake
      setPanelState('teaching');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="w-full space-y-5"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Your AI Tutor</h2>
              <AIBadge label="AI Teaching Session" size="sm" className="bg-white/20 text-white mt-0.5" />
            </div>
          </div>
          <p className="text-indigo-100 text-sm font-medium">{subjectLine}</p>
        </div>

        {/* ── Teaching content ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {panelState === 'teaching' && (
            <motion.div key="teaching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white border border-indigo-100 p-6 space-y-5 rounded-b-3xl shadow-sm">

              {/* AI avatar + explanation */}
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="bg-indigo-50 rounded-2xl rounded-tl-none p-4 flex-1">
                  <p className="text-sm text-indigo-900 font-semibold mb-1">AI Tutor</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    I've analyzed your answers and identified where things went wrong.
                    Let me walk you through the key ideas you should revisit before trying again.
                  </p>
                </div>
              </div>

              {/* Concept cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {conceptCards.map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <card.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{card.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.body}</p>
                  </motion.div>
                ))}
              </div>

              {/* Common mistakes — only if we have wrong answers */}
              {wrongAnswers.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-sm font-bold text-amber-800">What you missed</p>
                  </div>
                  <div className="space-y-2">
                    {wrongAnswers.map((wa, i) => (
                      <div key={i} className="bg-white border border-amber-100 rounded-xl p-3 text-xs space-y-1">
                        <p className="font-semibold text-slate-700 truncate">{wa.questionText}</p>
                        <p className="text-red-600">Your answer: <span className="font-medium">{wa.yourAnswer}</span></p>
                        <p className="text-emerald-600">Correct: <span className="font-medium">{wa.correctAnswer}</span></p>
                        <p className="text-slate-500 italic">{wa.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tip */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  <span className="font-bold">Tip:</span> The new quiz focuses on the exact concepts you struggled with.
                  Take your time on each question and use the explanations to reinforce your understanding.
                </p>
              </div>

              {/* Ready button */}
              <button
                onClick={() => setPanelState('quiz')}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold rounded-2xl transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                I'm Ready — Take the New Test
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── AI quiz ──────────────────────────────────────── */}
          {panelState === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white border border-indigo-100 p-5 rounded-b-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AIBadge size="md" />
                  <span className="text-sm font-bold text-slate-700">Personalized Retake Quiz</span>
                </div>
                <button onClick={() => setPanelState('teaching')} className="text-xs text-slate-500 hover:text-slate-700 underline">
                  Back to explanations
                </button>
              </div>
              <InlineQuiz
                title="AI Personalized Retake"
                questions={retakeQuestions}
                onSubmit={(score, total) => handleQuizComplete(score, total)}
              />
            </motion.div>
          )}

          {/* ── Passed state ──────────────────────────────────── */}
          {panelState === 'passed' && (
            <motion.div key="passed"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-emerald-100 p-8 rounded-b-3xl shadow-sm flex flex-col items-center gap-4 text-center">
              <motion.div
                initial={{ scale: 0.5 }} animate={{ scale: [0.5, 1.2, 1] }}
                transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </motion.div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">Great job! You passed! 🎉</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  The AI helped you understand the key concepts. You're ready to continue to the next step.
                </p>
              </div>
              <button
                onClick={onPassed}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl transition-colors shadow-sm"
              >
                Continue Learning <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
