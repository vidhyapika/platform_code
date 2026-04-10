import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, PlayCircle, HelpCircle, CheckCircle2,
  ChevronDown, ChevronUp, Menu, X, Target, BookOpen,
  Network, ChevronRight, ChevronLeft, Video, Lock,
  ClipboardCheck, ListTree, Layers, Brain, MessageSquare,
  Sparkles, TrendingUp, RotateCcw, AlertTriangle
} from 'lucide-react';
import { MOCK_STUDENT_CURRICULUM } from '../data/mockData';
import { InlineQuiz } from '../components/InlineQuiz';
import type { StudentTopicProgress, StudentSubTopicProgress, Question, Prerequisite, QuizAttempt } from '../types';

// ── Learning Step model ────────────────────────────────────────────────────────
type StepKind = 'prerequisites' | 'pre-eval' | 'video' | 'subtopic-quiz' | 'post-eval';

interface BaseStep { kind: StepKind; topicIdx: number; stepLabel: string; }
interface PrereqStep  extends BaseStep { kind: 'prerequisites'; topic: StudentTopicProgress; }
interface PreEvalStep extends BaseStep { kind: 'pre-eval';       topic: StudentTopicProgress; questions: Question[]; }
interface VideoStep   extends BaseStep { kind: 'video';          topic: StudentTopicProgress; sub: StudentSubTopicProgress; }
interface SubQuizStep extends BaseStep { kind: 'subtopic-quiz';  topic: StudentTopicProgress; sub: StudentSubTopicProgress; questions: Question[]; }
interface PostEvalStep extends BaseStep { kind: 'post-eval';     topic: StudentTopicProgress; questions: Question[]; }

type LearningStep = PrereqStep | PreEvalStep | VideoStep | SubQuizStep | PostEvalStep;

function buildSteps(topics: StudentTopicProgress[]): LearningStep[] {
  const steps: LearningStep[] = [];
  topics.forEach((topic, topicIdx) => {
    const base = { topicIdx };

    // 1. Prerequisites
    if ((topic.prerequisites ?? []).length > 0) {
      steps.push({ ...base, kind: 'prerequisites', stepLabel: 'Prerequisites', topic });
    }
    // 2. Pre-evaluation quiz
    if ((topic.preEvaluationQuiz ?? []).length > 0) {
      steps.push({ ...base, kind: 'pre-eval', stepLabel: 'Pre-Evaluation Quiz', topic, questions: topic.preEvaluationQuiz! });
    }
    // 3. Subtopics (video + quiz per subtopic)
    for (const sub of topic.subTopics) {
      if (sub.videoUrl) {
        steps.push({ ...base, kind: 'video', stepLabel: sub.title, topic, sub });
      }
      if ((sub.quizzes ?? []).length > 0) {
        steps.push({ ...base, kind: 'subtopic-quiz', stepLabel: `Quiz: ${sub.title}`, topic, sub, questions: sub.quizzes! });
      }
    }
    // 4. Post-evaluation quiz
    if ((topic.postEvaluationQuiz ?? []).length > 0) {
      steps.push({ ...base, kind: 'post-eval', stepLabel: 'Post-Evaluation Quiz', topic, questions: topic.postEvaluationQuiz! });
    }
  });
  return steps;
}

const STEP_ICON: Record<StepKind, React.ReactNode> = {
  'prerequisites': <Network className="w-4 h-4" />,
  'pre-eval':      <Target className="w-4 h-4" />,
  'video':         <Video className="w-4 h-4" />,
  'subtopic-quiz': <HelpCircle className="w-4 h-4" />,
  'post-eval':     <ClipboardCheck className="w-4 h-4" />,
};
const STEP_COLOR: Record<StepKind, string> = {
  'prerequisites': 'text-purple-600 bg-purple-50',
  'pre-eval':      'text-orange-600 bg-orange-50',
  'video':         'text-blue-600 bg-blue-50',
  'subtopic-quiz': 'text-indigo-600 bg-indigo-50',
  'post-eval':     'text-red-600 bg-red-50',
};

export function CoursePlayer() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [prereqChecked, setPrereqChecked] = useState<Record<string, boolean>>({});

  // Prerequisite quiz state
  const [activePrereqId, setActivePrereqId] = useState<string | null>(null);
  const [prereqAnswers, setPrereqAnswers] = useState<Record<string, Record<string, string>>>({});
  const [prereqSubmitted, setPrereqSubmitted] = useState<Record<string, boolean>>({});
  const [prereqScores, setPrereqScores] = useState<Record<string, { score: number; total: number; attempts: QuizAttempt[] }>>({});

  // AI Coach panel
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);

  const { topics, standard, className: section, overallProgress } = MOCK_STUDENT_CURRICULUM;
  const steps = useMemo(() => buildSteps(topics), [topics]);
  const activeStep = steps[activeStepIdx];

  // Pre-mark already completed steps from mock progress
  useEffect(() => {
    const done = new Set<number>();
    steps.forEach((s, i) => {
      if (s.kind === 'video' && s.sub.videoWatched) done.add(i);
      if (s.kind === 'subtopic-quiz' && s.sub.quizScore) done.add(i);
      if (s.kind === 'pre-eval' && (s as PreEvalStep).topic.preEvaluationScore) done.add(i);
      if (s.kind === 'post-eval' && (s as PostEvalStep).topic.postEvaluationScore) done.add(i);
      if (s.kind === 'prerequisites' && (s as PrereqStep).topic.prerequisiteScores?.length > 0) done.add(i);
    });
    setCompletedSteps(done);
  }, [steps]);

  const markComplete = (idx: number) => setCompletedSteps(prev => { const n = new Set(prev); n.add(idx); return n; });
  const goNext = () => { markComplete(activeStepIdx); if (activeStepIdx < steps.length - 1) setActiveStepIdx(i => i + 1); };
  const goPrev = () => { if (activeStepIdx > 0) setActiveStepIdx(i => i - 1); };

  // ── AI Coach Panel ────────────────────────────────────────────────────────
  const renderAICoach = () => (
    <AnimatePresence>
      {isAICoachOpen && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20"
        >
          {/* Coach header */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-extrabold text-sm">AI Coach</p>
                <p className="text-white/70 text-xs">Personalised study help</p>
              </div>
            </div>
            <button onClick={() => setIsAICoachOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Coming soon body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Coming Soon banner */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-extrabold text-indigo-900 mb-1">AI Coach Coming Soon</h3>
              <p className="text-indigo-600 text-xs leading-relaxed">
                Your personalised AI tutor will be able to answer questions, explain concepts, and guide you through difficult topics.
              </p>
            </div>

            {/* Planned features */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planned Features</p>
              {[
                { icon: MessageSquare, label: 'Ask any question about this topic' },
                { icon: Brain,         label: 'Get step-by-step explanations' },
                { icon: TrendingUp,    label: 'Track your weak areas' },
                { icon: Target,        label: 'Adaptive practice questions' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl opacity-60">
                  <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <p className="text-sm text-slate-600 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Mock chat preview */}
            <div className="mt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Preview</p>
              <div className="space-y-3">
                {/* Student message */}
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white text-xs font-medium rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] opacity-50">
                    Why do we need to factor polynomials?
                  </div>
                </div>
                {/* AI response */}
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 mt-auto">
                    <Brain className="w-3 h-3 text-indigo-600" />
                  </div>
                  <div className="bg-slate-100 text-slate-600 text-xs font-medium rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%] opacity-50 leading-relaxed">
                    Factoring helps simplify complex expressions and solve equations by breaking them into smaller, manageable parts...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input area (disabled) */}
          <div className="p-3 border-t border-slate-100">
            <div className="flex gap-2">
              <input disabled placeholder="Ask a question... (coming soon)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-400 placeholder-slate-300 cursor-not-allowed" />
              <button disabled className="w-9 h-9 bg-indigo-200 text-indigo-400 rounded-xl flex items-center justify-center cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Main content renderers ─────────────────────────────────────────────────

  const renderPrerequisites = (step: PrereqStep) => {
    const prereqs = step.topic.prerequisites ?? [];

    // Initialize first prereq as active if none set
    const currentPrereqId = activePrereqId ?? prereqs[0]?.id ?? null;
    const currentPrereq = prereqs.find(p => p.id === currentPrereqId);

    // Check if a prereq has been completed (either from mock data or newly submitted)
    const getPrereqScore = (prereqId: string) => {
      const local = prereqScores[prereqId];
      if (local) return local;
      const existing = step.topic.prerequisiteScores.find(s => s.id === prereqId);
      if (existing) return { score: existing.score, total: existing.total, attempts: existing.attempts ?? [] };
      return null;
    };

    const allPrereqsAddressed = prereqs.every(p => {
      if (!p.questions || p.questions.length === 0) return prereqChecked[p.id] ?? !!getPrereqScore(p.id);
      return prereqSubmitted[p.id] ?? !!getPrereqScore(p.id);
    });

    const handlePrereqQuizSubmit = (prereqId: string, questions: Question[], answers: Record<string, string>) => {
      const score = questions.filter(q => answers[q.id] === q.correctAnswer).length;
      const total = questions.length;
      const newAttempt: QuizAttempt = { score, total, date: new Date().toISOString().split('T')[0] };
      setPrereqScores(prev => {
        const existing = prev[prereqId];
        return {
          ...prev,
          [prereqId]: {
            score,
            total,
            attempts: [...(existing?.attempts ?? []), newAttempt],
          },
        };
      });
      setPrereqSubmitted(prev => ({ ...prev, [prereqId]: true }));
    };

    const handleRetakePrereq = (prereqId: string) => {
      setPrereqAnswers(prev => ({ ...prev, [prereqId]: {} }));
      setPrereqSubmitted(prev => ({ ...prev, [prereqId]: false }));
    };

    // Mini sparkline for prereq scores
    const renderSparkline = (attempts: QuizAttempt[]) => {
      if (!attempts.length) return null;
      return (
        <div className="flex items-end gap-0.5 h-5">
          {attempts.map((a, i) => {
            const pct = a.total > 0 ? (a.score / a.total) * 100 : 0;
            const isLast = i === attempts.length - 1;
            return (
              <div key={i} className={`w-2.5 rounded-sm ${isLast ? 'bg-purple-500' : 'bg-slate-300'}`}
                style={{ height: `${Math.max(20, pct)}%` }} title={`${a.score}/${a.total} on ${a.date}`} />
            );
          })}
        </div>
      );
    };

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
              <Network className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Prerequisites</h2>
              <p className="text-slate-500 text-sm font-medium">For: {step.topic.title}</p>
            </div>
          </div>

          {/* Prereq tabs */}
          {prereqs.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {prereqs.map(p => {
                const score = getPrereqScore(p.id);
                const isActive = p.id === currentPrereqId;
                const isDone = prereqSubmitted[p.id] ?? !!score;
                return (
                  <button key={p.id}
                    onClick={() => setActivePrereqId(p.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all
                      ${isActive ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-200'}`}>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {p.title}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold
                      ${isActive ? 'bg-white/20 text-white'
                        : p.category === 'Major' ? 'bg-red-100 text-red-700'
                        : p.category === 'Intermediate' ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-500'}`}>
                      {p.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Single prereq content */}
          {currentPrereq && (() => {
            const score     = getPrereqScore(currentPrereq.id);
            const submitted = prereqSubmitted[currentPrereq.id] ?? !!score;
            const hasQuiz   = (currentPrereq.questions?.length ?? 0) > 0;
            const existingAttempts = score?.attempts ?? [];

            return (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Prereq header */}
                <div className={`p-5 border-b border-slate-100 ${
                  prereqs.length === 1 ? 'bg-purple-50' : 'bg-white'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-extrabold text-slate-900">{currentPrereq.title}</h3>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase
                          ${currentPrereq.category === 'Major' ? 'bg-red-100 text-red-700'
                            : currentPrereq.category === 'Intermediate' ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-500'}`}>
                          {currentPrereq.category}
                        </span>
                        {submitted && score && (
                          <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Tested
                          </span>
                        )}
                      </div>
                      {currentPrereq.description && (
                        <p className="text-slate-600 text-sm leading-relaxed">{currentPrereq.description}</p>
                      )}
                    </div>
                    {/* Score + history */}
                    {score && (
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Best Score</p>
                          <p className="text-2xl font-black text-purple-600">
                            {Math.round((score.score / score.total) * 100)}%
                          </p>
                          <p className="text-xs text-slate-500">{score.score}/{score.total}</p>
                        </div>
                        {existingAttempts.length > 0 && (
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attempts</p>
                            {renderSparkline(existingAttempts)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* No quiz — just a confirm checkbox */}
                {!hasQuiz && (
                  <div className="p-5">
                    <div
                      onClick={() => setPrereqChecked(prev => ({ ...prev, [currentPrereq.id]: !prev[currentPrereq.id] }))}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${prereqChecked[currentPrereq.id] || !!score ? 'border-purple-300 bg-purple-50' : 'border-slate-200 hover:border-purple-200'}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${prereqChecked[currentPrereq.id] || !!score ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                        {(prereqChecked[currentPrereq.id] || !!score) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <p className="text-slate-700 font-medium text-sm">
                        I confirm I understand this prerequisite topic and am ready to proceed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Quiz questions */}
                {hasQuiz && (() => {
                  const questions = currentPrereq.questions!;
                  const answers = prereqAnswers[currentPrereq.id] ?? {};
                  const currentQIdx = Object.keys(answers).length < questions.length
                    ? questions.findIndex(q => !answers[q.id])
                    : questions.length - 1;

                  if (submitted) {
                    // Review / retake screen
                    const lastAttempt = existingAttempts[existingAttempts.length - 1];
                    const pct = lastAttempt ? Math.round((lastAttempt.score / lastAttempt.total) * 100) : 0;
                    const passed = pct >= 60;

                    return (
                      <div className="p-5">
                        {/* Score result banner */}
                        <div className={`flex items-center gap-4 p-4 rounded-2xl mb-5 ${passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${passed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                            {passed
                              ? <CheckCircle2 className={`w-8 h-8 text-emerald-600`} />
                              : <AlertTriangle className="w-8 h-8 text-amber-600" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-xl font-extrabold ${passed ? 'text-emerald-800' : 'text-amber-800'}`}>
                              {passed ? 'Well done! ' : 'Keep going! '}
                              {lastAttempt?.score ?? 0}/{lastAttempt?.total ?? 0} correct
                            </p>
                            <p className={`text-sm font-medium ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {pct}% · {passed ? 'You have the necessary background knowledge.' : 'Review the topic before proceeding.'}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</p>
                          </div>
                        </div>

                        {/* Attempt history */}
                        {existingAttempts.length > 1 && (
                          <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" /> Attempt History
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {existingAttempts.map((a, i) => (
                                <div key={i} className={`flex flex-col items-center px-3 py-2 rounded-xl border
                                  ${i === existingAttempts.length - 1 ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'}`}>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">attempt {i + 1}</span>
                                  <span className={`text-base font-extrabold ${i === existingAttempts.length - 1 ? 'text-purple-700' : 'text-slate-600'}`}>
                                    {a.score}/{a.total}
                                  </span>
                                  <span className="text-[9px] text-slate-400">{a.date}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Q&A review */}
                        <div className="space-y-3 mb-5">
                          {questions.map((q, qi) => {
                            const userAns = (prereqAnswers[currentPrereq.id] ?? {})[q.id];
                            const fromExisting = !userAns;
                            const correct = userAns ? userAns === q.correctAnswer : true; // if from existing just show
                            return (
                              <div key={q.id} className={`p-4 rounded-xl border ${!fromExisting ? (correct ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-start gap-3">
                                  {!fromExisting && (correct
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    : <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />)}
                                  <div className="flex-1">
                                    <p className="font-bold text-slate-800 text-sm mb-2">{qi + 1}. {q.text}</p>
                                    {!fromExisting && !correct && (
                                      <p className="text-xs text-emerald-700 font-semibold mb-1">
                                        Correct: {q.correctAnswer}
                                      </p>
                                    )}
                                    <p className="text-xs text-slate-500 leading-relaxed">{q.explanation}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handleRetakePrereq(currentPrereq.id)}
                          className="w-full py-3 bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded-xl hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 text-sm">
                          <RotateCcw className="w-4 h-4" /> Retake Test to Improve Score
                        </button>
                      </div>
                    );
                  }

                  // Active quiz
                  const currentQ = questions[currentQIdx < 0 ? 0 : currentQIdx];
                  const allAnswered = questions.every(q => answers[q.id]);

                  return (
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-5">
                        <p className="text-sm font-bold text-slate-500">
                          {questions.length} question{questions.length > 1 ? 's' : ''} · Self-assessment
                        </p>
                        <div className="flex gap-1.5">
                          {questions.map((q, qi) => (
                            <div key={q.id} className={`w-2.5 h-2.5 rounded-full transition-colors
                              ${answers[q.id] ? 'bg-purple-500' : 'bg-slate-200'}`} />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {questions.map((q, qi) => (
                          <div key={q.id} className={`p-4 rounded-xl border-2 transition-all ${answers[q.id] ? 'border-purple-100 bg-purple-50/30' : 'border-slate-200 bg-white'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-bold text-slate-800 text-sm">{qi + 1}. {q.text}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0
                                ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700'
                                  : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'}`}>
                                {q.difficulty}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options?.map((opt, oi) => (
                                <button key={oi}
                                  onClick={() => setPrereqAnswers(prev => ({
                                    ...prev,
                                    [currentPrereq.id]: { ...(prev[currentPrereq.id] ?? {}), [q.id]: opt }
                                  }))}
                                  className={`text-left p-3 rounded-xl border-2 text-sm font-medium transition-all
                                    ${answers[q.id] === opt
                                      ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm'
                                      : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50 text-slate-700'}`}>
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border-2 mr-2 text-xs font-bold shrink-0
                                    ${answers[q.id] === opt ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => allAnswered && handlePrereqQuizSubmit(currentPrereq.id, questions, answers)}
                        disabled={!allAnswered}
                        className="w-full mt-5 py-3 bg-purple-600 text-white font-extrabold rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2">
                        <ClipboardCheck className="w-5 h-5" />
                        {allAnswered ? 'Submit Prerequisite Test' : `Answer all ${questions.length - Object.keys(answers).length} remaining questions`}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Proceed button */}
          <div className="mt-6">
            <button
              onClick={goNext}
              className={`w-full py-4 font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm
                ${allPrereqsAddressed
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              disabled={!allPrereqsAddressed}>
              {allPrereqsAddressed
                ? <><CheckCircle2 className="w-5 h-5" /> All prerequisites addressed — Continue to Topic</>
                : <><AlertTriangle className="w-4 h-4" /> Complete or acknowledge all prerequisites first</>}
            </button>
            {!allPrereqsAddressed && (
              <p className="text-center text-xs text-slate-400 mt-2 font-medium">
                {prereqs.filter(p => {
                  if (!p.questions?.length) return !(prereqChecked[p.id] ?? !!step.topic.prerequisiteScores.find(s => s.id === p.id));
                  return !(prereqSubmitted[p.id] ?? !!step.topic.prerequisiteScores.find(s => s.id === p.id));
                }).length} prerequisite{prereqs.filter(p => {
                  if (!p.questions?.length) return !(prereqChecked[p.id] ?? !!step.topic.prerequisiteScores.find(s => s.id === p.id));
                  return !(prereqSubmitted[p.id] ?? !!step.topic.prerequisiteScores.find(s => s.id === p.id));
                }).length !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderVideo = (step: VideoStep) => (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={step.sub.videoUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="bg-slate-900 p-6 flex-1">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">{step.topic.title}</p>
              <h2 className="text-2xl font-extrabold text-white">{step.sub.title}</h2>
              <p className="text-slate-400 mt-2 text-sm">Watch the video, then take the quiz for this subtopic.</p>
            </div>
            {step.sub.videoWatched && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Watched
              </span>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={goPrev} disabled={activeStepIdx === 0}
              className="px-4 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 disabled:opacity-40 flex items-center gap-2 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={goNext}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center gap-2 transition-colors shadow">
              Mark Watched & Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuiz = (step: PreEvalStep | SubQuizStep | PostEvalStep) => {
    const titleMap: Record<StepKind, string> = {
      'pre-eval':      `Pre-Evaluation: ${step.topic.title}`,
      'subtopic-quiz': `Quiz: ${'sub' in step ? step.sub.title : ''}`,
      'post-eval':     `Post-Evaluation: ${step.topic.title}`,
      'prerequisites': '',
      'video':         '',
    };
    const pastAnswers =
      step.kind === 'pre-eval'      ? step.topic.preEvaluationScore?.pastAnswers :
      step.kind === 'post-eval'     ? step.topic.postEvaluationScore?.pastAnswers :
      step.kind === 'subtopic-quiz' ? step.sub.quizScore?.pastAnswers : undefined;
    const isReview =
      step.kind === 'pre-eval'      ? !!step.topic.preEvaluationScore :
      step.kind === 'post-eval'     ? !!step.topic.postEvaluationScore :
      step.kind === 'subtopic-quiz' ? !!step.sub.quizScore : false;
    const attemptHistory =
      step.kind === 'pre-eval'      ? step.topic.preEvaluationScore?.attempts :
      step.kind === 'post-eval'     ? step.topic.postEvaluationScore?.attempts :
      step.kind === 'subtopic-quiz' ? step.sub.quizScore?.attempts : undefined;

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto">
          <InlineQuiz
            title={titleMap[step.kind]}
            questions={step.questions}
            initialAnswers={pastAnswers}
            isReviewMode={isReview}
            attemptHistory={attemptHistory}
            onSubmit={(score, total) => { goNext(); }}
          />
          {/* nav below quiz */}
          <div className="flex gap-3 mt-4">
            <button onClick={goPrev} disabled={activeStepIdx === 0}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 disabled:opacity-40 flex items-center gap-2 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!activeStep) return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-medium">Select a step from the sidebar to begin.</p>
        </div>
      </div>
    );
    if (activeStep.kind === 'prerequisites')  return renderPrerequisites(activeStep as PrereqStep);
    if (activeStep.kind === 'video')          return renderVideo(activeStep as VideoStep);
    if (activeStep.kind === 'pre-eval' || activeStep.kind === 'subtopic-quiz' || activeStep.kind === 'post-eval')
      return renderQuiz(activeStep as PreEvalStep | SubQuizStep | PostEvalStep);
    return null;
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────

  // Group steps by topicIdx
  const stepsByTopic = useMemo(() => {
    const map: Record<number, { steps: { step: LearningStep; globalIdx: number }[] }> = {};
    steps.forEach((s, i) => {
      if (!map[s.topicIdx]) map[s.topicIdx] = { steps: [] };
      map[s.topicIdx].steps.push({ step: s, globalIdx: i });
    });
    return map;
  }, [steps]);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Nav */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/courses')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium text-sm">Back to Curriculum</span>
          </button>
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <span className="font-bold hidden md:block">{standard} — {section}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</div>
              <div className="text-sm font-bold">{overallProgress}% Complete</div>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
          {/* AI Coach toggle */}
          <button
            onClick={() => setIsAICoachOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-bold
              ${isAICoachOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">AI Coach</span>
            <span className="text-[9px] bg-white/20 px-1 rounded uppercase font-black hidden sm:inline">Soon</span>
          </button>
          <button onClick={() => setIsSidebarOpen(v => !v)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:hidden">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {renderContent()}
        {renderAICoach()}

        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="absolute lg:relative right-0 top-0 bottom-0 w-80 lg:w-[340px] bg-white border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none z-10"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <h2 className="font-extrabold text-slate-900">Course Content</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Step {activeStepIdx + 1} of {steps.length} · {completedSteps.size} completed
                </p>
                {/* mini progress */}
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {topics.map((topic, topicIdx) => {
                  const topicSteps = stepsByTopic[topicIdx]?.steps ?? [];
                  const topicDone  = topicSteps.filter(s => completedSteps.has(s.globalIdx)).length;
                  const isExpanded = expandedTopics[topicIdx] !== false;

                  return (
                    <div key={topic.id}>
                      {/* Topic header */}
                      <button
                        onClick={() => setExpandedTopics(prev => ({ ...prev, [topicIdx]: !isExpanded }))}
                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0
                          ${topic.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : topic.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                          {topic.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : topicIdx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{topic.title}</p>
                          <p className="text-xs text-slate-500">{topicDone}/{topicSteps.length} steps done</p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>

                      {/* Steps list */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            {topicSteps.map(({ step, globalIdx }) => {
                              const isActive = globalIdx === activeStepIdx;
                              const isDone   = completedSteps.has(globalIdx);
                              const colors   = STEP_COLOR[step.kind];
                              return (
                                <button key={globalIdx}
                                  onClick={() => setActiveStepIdx(globalIdx)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-l-2 transition-all
                                    ${isActive ? 'border-blue-500 bg-blue-50/60' : 'border-transparent hover:bg-slate-50'}`}>
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-100 text-emerald-600' : colors}`}>
                                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : STEP_ICON[step.kind]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700 font-bold' : isDone ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                                      {step.stepLabel}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-semibold capitalize">{step.kind.replace('-', ' ')}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Bottom nav */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                <button onClick={goPrev} disabled={activeStepIdx === 0}
                  className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center gap-1 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button onClick={goNext} disabled={activeStepIdx === steps.length - 1}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-1 transition-colors shadow-sm">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
