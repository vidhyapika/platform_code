import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Sparkles, CheckCircle2, XCircle, ChevronRight,
  RotateCcw, ClipboardCheck, Brain, AlertTriangle, Star
} from 'lucide-react';
import { AIBadge } from './ui/AIBadge';
import { AITeachingPanel } from './AITeachingPanel';
import type { Question } from '../types';

interface FinalTestScreenProps {
  topicTitle: string;
  questions: Question[];
  videosWatched: number;
  quizzesCompleted: number;
  onCompleted: () => void;
  onBack: () => void;
}

type TestState = 'intro' | 'testing' | 'results' | 'ai-teaching' | 'topic-complete';

export function FinalTestScreen({
  topicTitle,
  questions,
  videosWatched,
  quizzesCompleted,
  onCompleted,
  onBack,
}: FinalTestScreenProps) {
  const [testState, setTestState]       = useState<TestState>('intro');
  const [currentQ, setCurrentQ]         = useState(0);
  const [answers, setAnswers]           = useState<Record<string, string>>({});
  const [score, setScore]               = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = pct >= 60;

  const wrongAnswers = questions.filter(q => answers[q.id] && answers[q.id] !== q.correctAnswer).map(q => ({
    questionText: q.text,
    yourAnswer:   answers[q.id] ?? '',
    correctAnswer: q.correctAnswer,
    explanation:   q.explanation,
  }));

  function submitTest() {
    let s = 0;
    questions.forEach(q => { if (answers[q.id] === q.correctAnswer) s++; });
    setScore(s);
    setTestState('results');
  }

  function handleTopicComplete() {
    setShowConfetti(true);
    setTimeout(() => setTestState('topic-complete'), 300);
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <ClipboardCheck className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm">No final test questions have been set for this topic yet.</p>
        <button onClick={onBack} className="text-sm font-bold text-[#0084B4] hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ── Intro ──────────────────────────────────────── */}
        {testState === 'intro' && (
          <motion.div key="intro"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            className="space-y-6">
            {/* Trophy announcement */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-center text-white shadow-xl overflow-hidden relative">
              <div className="absolute inset-0 opacity-10">
                <svg viewBox="0 0 400 200" className="w-full h-full"><circle cx="200" cy="100" r="180" fill="white"/></svg>
              </div>
              <motion.div
                initial={{ scale: 0.5, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="relative z-10 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="relative z-10 text-2xl font-extrabold mb-2">All Subtopics Complete!</h2>
              <p className="relative z-10 text-orange-100 font-medium">Time for your Final Topic Test</p>
            </div>

            {/* Stats recap */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-sm font-bold text-slate-600 mb-4 text-center">Your journey so far</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Topic', value: topicTitle, small: true },
                  { label: 'Videos Watched', value: videosWatched },
                  { label: 'Quizzes Passed', value: quizzesCompleted },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <p className={`font-extrabold text-slate-900 mb-0.5 ${s.small ? 'text-xs' : 'text-xl'}`}>{s.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Test info */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-indigo-900 mb-1">About this test</p>
                  <ul className="text-xs text-indigo-700 space-y-1">
                    <li>• {questions.length} questions covering all subtopics</li>
                    <li>• Score 60% or above to complete this topic</li>
                    <li>• AI will provide personalized feedback if you need to retake</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setCurrentQ(0); setAnswers({}); setTestState('testing'); }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-base rounded-2xl transition-all shadow-md"
            >
              <ClipboardCheck className="w-5 h-5" />
              Begin Final Test
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* ── Testing ─────────────────────────────────────── */}
        {testState === 'testing' && (
          <motion.div key="testing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Top progress bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Final Test — {topicTitle}</span>
                <span className="text-xs font-bold text-slate-700">Question {currentQ + 1} of {questions.length}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div key={currentQ}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    q.difficulty === 'Easy'   ? 'bg-green-100 text-green-700'  :
                    q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{q.difficulty}</span>
                  <AIBadge label="Final Test" size="sm" className="bg-indigo-100 text-indigo-700" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 leading-relaxed">{q.text}</h3>

                <div className="space-y-3">
                  {q.options?.map((opt, i) => (
                    <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        answers[q.id] === opt
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${
                          answers[q.id] === opt ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 text-slate-500'
                        }`}>{String.fromCharCode(65 + i)}</span>
                        <span className="font-medium">{opt}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 rounded-xl">
                    Previous
                  </button>
                  {isLast ? (
                    <button
                      onClick={submitTest}
                      disabled={Object.keys(answers).length < questions.length}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      Submit Final Test
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))}
                      disabled={!answers[q.id]}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Results ──────────────────────────────────────── */}
        {testState === 'results' && (
          <motion.div key="results"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">

            {/* Score card */}
            <div className={`rounded-3xl p-8 text-center ${passed ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white shadow-xl`}>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 280 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                {passed ? <Trophy className="w-10 h-10 text-white" /> : <RotateCcw className="w-10 h-10 text-white" />}
              </motion.div>
              <p className="text-5xl font-extrabold mb-2">{pct}%</p>
              <p className="text-white/90 font-semibold">{score}/{questions.length} correct</p>
              <p className="mt-2 text-white/80 text-sm">{passed ? 'Excellent work — you passed! 🎉' : 'Keep going — you need 60% to pass.'}</p>
            </div>

            {/* AI Analysis */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AIBadge size="md" label="AI Analysis" />
                <span className="text-sm font-bold text-slate-700">Here's what your results show</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {passed
                  ? `Outstanding! You demonstrated strong understanding of "${topicTitle}". You answered ${score} out of ${questions.length} questions correctly.`
                  : `You got ${score}/${questions.length} correct on "${topicTitle}". ${wrongAnswers.length > 0 ? `Let me help you understand where things went wrong.` : ''}`
                }
              </p>

              {/* Per-question review */}
              <div className="space-y-2">
                {questions.map((ques, i) => {
                  const isCorrect = answers[ques.id] === ques.correctAnswer;
                  return (
                    <div key={ques.id} className={`rounded-xl border p-3 text-xs space-y-1 ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                        <p className={`font-semibold ${isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>Q{i + 1}: {ques.text}</p>
                      </div>
                      {!isCorrect && (
                        <>
                          <p className="text-red-600 pl-6">Your answer: {answers[ques.id] ?? 'Not answered'}</p>
                          <p className="text-emerald-700 pl-6">Correct: {ques.correctAnswer}</p>
                          <p className="text-slate-500 pl-6 italic">{ques.explanation}</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            {passed ? (
              <button
                onClick={handleTopicComplete}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl transition-all shadow-md text-base"
              >
                <Star className="w-5 h-5" />
                Complete Topic
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setTestState('ai-teaching')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-colors shadow-md"
              >
                <Brain className="w-5 h-5" />
                Get AI Help & Retake
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}

        {/* ── AI Teaching ──────────────────────────────────── */}
        {testState === 'ai-teaching' && (
          <AITeachingPanel
            topicTitle={topicTitle}
            kind="final-test"
            wrongAnswers={wrongAnswers}
            retakeQuestions={questions}
            onPassed={handleTopicComplete}
            onBack={() => setTestState('results')}
          />
        )}

        {/* ── Topic Complete ───────────────────────────────── */}
        {testState === 'topic-complete' && (
          <motion.div key="complete"
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 py-12 text-center">

            {/* Confetti-like decoration */}
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, type: 'tween', ease: 'easeInOut' }}
                className="w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
              >
                <Trophy className="w-14 h-14 text-white" />
              </motion.div>
              {[...Array(8)].map((_, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], x: Math.cos(i * 45 * Math.PI / 180) * 60, y: Math.sin(i * 45 * Math.PI / 180) * 60 }}
                  transition={{ delay: i * 0.08, duration: 0.8, repeat: Infinity, repeatDelay: 2, type: 'tween', ease: 'easeOut' }}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                  style={{ backgroundColor: ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#3b82f6', '#ec4899', '#f97316', '#22c55e'][i] }}
                />
              ))}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900">Topic Complete! 🏆</h2>
              <p className="text-slate-500 font-medium">You've mastered <span className="font-bold text-slate-800">"{topicTitle}"</span></p>
              <p className="text-sm text-slate-400">You're now ready to move on to the next topic</p>
            </div>

            {/* Unlock badge */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-amber-900">Badge Unlocked</p>
                <p className="text-xs text-amber-700">Topic Master — {topicTitle}</p>
              </div>
            </div>

            <button
              onClick={onCompleted}
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#0084B4] to-[#006A91] hover:from-[#006A91] hover:to-[#005580] text-white font-extrabold rounded-2xl transition-all shadow-md"
            >
              Continue to Next Topic <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
