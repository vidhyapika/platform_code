import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, PlayCircle, HelpCircle, CheckCircle2,
  ChevronDown, ChevronUp, Menu, X, Target, BookOpen,
  Network, ChevronRight, ChevronLeft, Video, Lock,
  ClipboardCheck, ListTree, Layers
} from 'lucide-react';
import { MOCK_STUDENT_CURRICULUM } from '../data/mockData';
import { InlineQuiz } from '../components/InlineQuiz';
import type { StudentTopicProgress, StudentSubTopicProgress, Question } from '../types';

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

  // ── Main content renderers ─────────────────────────────────────────────────

  const renderPrerequisites = (step: PrereqStep) => {
    const prereqs = step.topic.prerequisites ?? [];
    const allChecked = prereqs.every(p => prereqChecked[p.id]);
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Network className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Prerequisites</h2>
              <p className="text-slate-500 text-sm font-medium">For: {step.topic.title}</p>
            </div>
          </div>
          <p className="text-slate-600 mb-6 font-medium">
            Please confirm you have background knowledge in the following topics before starting.
          </p>
          <div className="space-y-4 mb-8">
            {prereqs.map(p => {
              const score = step.topic.prerequisiteScores?.find(s => s.id === p.id);
              const checked = prereqChecked[p.id] || !!score;
              return (
                <div key={p.id}
                  onClick={() => setPrereqChecked(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all
                    ${checked ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-200'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                    ${checked ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                    {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900">{p.title}</h4>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase
                        ${p.category === 'Major' ? 'bg-red-100 text-red-700' : p.category === 'Intermediate' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.category}
                      </span>
                    </div>
                    {score && (
                      <p className="text-sm text-purple-600 font-semibold mt-1">
                        Previous score: {score.score}/{score.total} · {score.date}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={goNext}
            className="w-full py-4 bg-purple-600 text-white font-extrabold rounded-2xl hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> I understand the prerequisites — Continue
          </button>
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

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto">
          <InlineQuiz
            title={titleMap[step.kind]}
            questions={step.questions}
            initialAnswers={pastAnswers}
            isReviewMode={isReview}
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
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</div>
              <div className="text-sm font-bold">{overallProgress}% Complete</div>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(v => !v)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:hidden">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {renderContent()}

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
