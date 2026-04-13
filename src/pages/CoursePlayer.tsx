import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, CheckCircle2, ChevronRight,
  Video, Network, BookOpen, PlayCircle, HelpCircle, Sparkles,
} from 'lucide-react';
import { MOCK_STUDENT_CURRICULUM } from '../data/mockData';
import { InlineQuiz } from '../components/InlineQuiz';
import { AITeachingPanel } from '../components/AITeachingPanel';
import { FinalTestScreen } from '../components/FinalTestScreen';
import type { StudentTopicProgress, StudentSubTopicProgress, Question } from '../types';

// ── Sub-step model: one screen per video/quiz ────────────────────────────────
type SubStep =
  | { kind: 'video';     sub: StudentSubTopicProgress }
  | { kind: 'quiz';      sub: StudentSubTopicProgress; questions: Question[] }
  | { kind: 'eval-quiz'; label: string;                questions: Question[] };

function buildSubSteps(topic: StudentTopicProgress): SubStep[] {
  const out: SubStep[] = [];
  if ((topic.preEvaluationQuiz?.length ?? 0) > 0)
    out.push({ kind: 'eval-quiz', label: 'Pre-Evaluation', questions: topic.preEvaluationQuiz! });
  for (const sub of topic.subTopics) {
    if (sub.videoUrl)                    out.push({ kind: 'video', sub });
    if ((sub.quizzes?.length ?? 0) > 0)  out.push({ kind: 'quiz',  sub, questions: sub.quizzes! });
  }
  if ((topic.postEvaluationQuiz?.length ?? 0) > 0)
    out.push({ kind: 'eval-quiz', label: 'Post-Evaluation', questions: topic.postEvaluationQuiz! });
  return out;
}

function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=)([^#&?]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

// ── AI teach config ──────────────────────────────────────────────────────────
interface AiConfig {
  topicTitle:     string;
  subtopicTitle?: string;
  kind:           'prerequisite' | 'subtopic';
  retakeQuestions: Question[];
  onPassed: () => void;
  onBack:   () => void;
}

type Phase = 'complete' | 'prereq' | 'subtopic' | 'final-test';

// ── Shell: top progress bar + animated content swap ──────────────────────────
function LearnShell({ topicTitle, step, total, onBack, children }: {
  topicTitle: string; step: number; total: number;
  onBack: () => void; children: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-14 bg-white border-b border-slate-100 flex items-center gap-3 px-4 shrink-0 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Curriculum</span>
        </button>
        <div className="flex-1 min-w-0 mx-2">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-sm font-bold text-slate-900 truncate">{topicTitle}</p>
            <span className="text-xs font-bold text-slate-400 shrink-0">{step} / {total}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#0084B4] rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            />
          </div>
        </div>
      </header>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function CoursePlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const topicIdx = (location.state as { topicIdx?: number } | null)?.topicIdx ?? 0;

  const { topics } = MOCK_STUDENT_CURRICULUM;
  const topic      = topics[topicIdx] ?? topics[0];
  const prereqs    = topic.prerequisites ?? [];
  const subSteps     = buildSubSteps(topic);
  const hasFinalTest  = (topic.finalTestQuiz?.length ?? 0) > 0;

  // ── Derive starting state from recorded topic progress ──────────────────
  const startPhase: Phase = (() => {
    if (topic.status === 'completed') return 'complete';
    if (topic.status === 'in-progress') {
      const scoreCount = topic.prerequisiteScores?.length ?? 0;
      return (prereqs.length === 0 || scoreCount >= prereqs.length) ? 'subtopic' : 'prereq';
    }
    return prereqs.length > 0 ? 'prereq' : 'subtopic';
  })();

  const startPrereqIdx = (() => {
    if (topic.status === 'in-progress' && prereqs.length > 0) {
      const scoreCount = topic.prerequisiteScores?.length ?? 0;
      return Math.min(scoreCount, Math.max(0, prereqs.length - 1));
    }
    return 0;
  })();

  // Walk subSteps to find the first step not yet completed
  const startSubStepIdx = (() => {
    if (topic.status === 'in-progress' && startPhase === 'subtopic') {
      for (let i = 0; i < subSteps.length; i++) {
        const s = subSteps[i];
        if (s.kind === 'eval-quiz') {
          if (s.label === 'Pre-Evaluation'  && topic.preEvaluationScore)  continue;
          if (s.label === 'Post-Evaluation' && topic.postEvaluationScore) continue;
          return i;
        } else if (s.sub.status !== 'completed') {
          return i;
        }
      }
    }
    return 0;
  })();

  const [phase,      setPhase]      = useState<Phase>(startPhase);
  const [prereqIdx,  setPrereqIdx]  = useState(startPrereqIdx);
  const [subStepIdx, setSubStepIdx] = useState(startSubStepIdx);
  const [quizResult, setQuizResult] = useState<{ passed: boolean } | null>(null);
  const [aiTeach,    setAiTeach]    = useState<AiConfig | null>(null);

  // ── Progress ────────────────────────────────────────────────────────────
  const totalSteps  = prereqs.length + subSteps.length + (hasFinalTest ? 1 : 0);
  const currentStep =
    phase === 'complete'  ? totalSteps :
    phase === 'prereq'    ? prereqIdx + 1 :
    phase === 'subtopic'  ? prereqs.length + subStepIdx + 1 :
    /* final-test */        prereqs.length + subSteps.length + 1;

  // ── Navigation ──────────────────────────────────────────────────────────
  function advancePrereq() {
    setQuizResult(null);
    if (prereqIdx + 1 < prereqs.length) {
      setPrereqIdx(p => p + 1);
    } else {
      setPhase('subtopic');
      setPrereqIdx(0);
    }
  }

  function advanceSubStep() {
    setQuizResult(null);
    if (subStepIdx + 1 < subSteps.length) {
      setSubStepIdx(i => i + 1);
    } else if (hasFinalTest) {
      setPhase('final-test');
    } else {
      navigate('/courses');
    }
  }

  // ── AI Teach overlay ────────────────────────────────────────────────────
  if (aiTeach) {
    return (
      <LearnShell topicTitle={topic.title} step={currentStep} total={totalSteps} onBack={() => navigate('/courses')}>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <AITeachingPanel
              topicTitle={aiTeach.topicTitle}
              subtopicTitle={aiTeach.subtopicTitle}
              kind={aiTeach.kind}
              retakeQuestions={aiTeach.retakeQuestions}
              onPassed={() => { setAiTeach(null); aiTeach.onPassed(); }}
              onBack={() => { setAiTeach(null); aiTeach.onBack(); }}
            />
          </div>
        </div>
      </LearnShell>
    );
  }

  // ── Complete screen ────────────────────────────────────────────────────
  if (phase === 'complete') {
    const ftScore       = topic.finalTestScore;
    const prereqsPassed = topic.prerequisiteScores?.length ?? 0;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0 shadow-sm">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Curriculum
          </button>
          <p className="font-bold text-slate-900 text-sm flex-1 truncate">{topic.title}</p>
          <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-wider">Completed</span>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">

            {/* Trophy */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Topic Completed!</h1>
                <p className="text-slate-500 mt-1 text-sm">You've mastered <span className="font-bold text-slate-700">{topic.title}</span>.</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {prereqsPassed > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <p className="text-2xl font-extrabold text-purple-600">{prereqsPassed}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1 leading-tight">Prereqs<br/>Cleared</p>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-2xl font-extrabold text-blue-600">{topic.subtopicsCompleted}/{topic.totalSubtopics}</p>
                <p className="text-xs font-bold text-slate-400 mt-1 leading-tight">Subtopics<br/>Done</p>
              </div>
              {ftScore && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <p className="text-2xl font-extrabold text-emerald-600">{Math.round((ftScore.score / ftScore.total) * 100)}%</p>
                  <p className="text-xs font-bold text-slate-400 mt-1 leading-tight">Final Test<br/>Score</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/courses')}
                className="w-full py-3.5 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Back to Curriculum
              </button>
              <button
                onClick={() => {
                  setPhase(prereqs.length > 0 ? 'prereq' : 'subtopic');
                  setPrereqIdx(0);
                  setSubStepIdx(0);
                  setQuizResult(null);
                }}
                className="w-full py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Review from Start
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── Final Test ──────────────────────────────────────────────────────────
  if (phase === 'final-test') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0 shadow-sm">
          <button
            onClick={() => { setPhase('subtopic'); setSubStepIdx(subSteps.length > 0 ? subSteps.length - 1 : 0); }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <p className="font-bold text-slate-900 text-sm">{topic.title} — Final Test</p>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <FinalTestScreen
            topicTitle={topic.title}
            questions={topic.finalTestQuiz ?? []}
            videosWatched={topic.subTopics.filter(s => s.videoWatched).length}
            quizzesCompleted={topic.subTopics.filter(s => s.quizScore).length}
            onCompleted={() => navigate('/courses')}
            onBack={() => { setPhase('subtopic'); setSubStepIdx(subSteps.length > 0 ? subSteps.length - 1 : 0); }}
          />
        </div>
      </div>
    );
  }

  // ── Prereq screens ──────────────────────────────────────────────────────
  if (phase === 'prereq') {
    const prereq = prereqs[prereqIdx];
    const hasQuiz = (prereq.questions?.length ?? 0) > 0;

    return (
      <LearnShell topicTitle={topic.title} step={currentStep} total={totalSteps} onBack={() => navigate('/courses')}>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-xl mx-auto">

            <p className="text-xs font-extrabold text-purple-600 uppercase tracking-widest mb-5 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" />
              Prerequisite Check · {prereqIdx + 1} of {prereqs.length}
            </p>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-purple-50 border-b border-purple-100">
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">{prereq.title}</h2>
                {prereq.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">{prereq.description}</p>
                )}
                <span className={`inline-block mt-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase
                  ${prereq.category === 'Major' ? 'bg-red-100 text-red-700'
                    : prereq.category === 'Intermediate' ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-600'}`}>
                  {prereq.category}
                </span>
              </div>
              <div className="p-6">
                {!hasQuiz ? (
                  <button
                    onClick={advancePrereq}
                    className="w-full py-3.5 bg-purple-600 text-white font-extrabold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    I understand this topic <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <div key={prereqIdx}>
                      <InlineQuiz
                        title={`Check: ${prereq.title}`}
                        questions={prereq.questions!}
                        onSubmit={(score, total) => {
                          const pct = total > 0 ? (score / total) * 100 : 100;
                          setQuizResult({ passed: pct >= (prereq.passingThreshold ?? 60) });
                        }}
                      />
                    </div>
                    {quizResult && (
                      <div className="mt-4">
                        {quizResult.passed ? (
                          <button
                            onClick={advancePrereq}
                            className="w-full py-3 bg-purple-600 text-white font-extrabold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            Continue <ChevronRight className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setAiTeach({
                              topicTitle: topic.title,
                              kind: 'prerequisite',
                              retakeQuestions: prereq.questions!,
                              onPassed: advancePrereq,
                              onBack: () => {},
                            })}
                            className="w-full py-3 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Sparkles className="w-4 h-4" /> Get AI Help & Retake
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </LearnShell>
    );
  }

  // ── Subtopic screens ────────────────────────────────────────────────────
  const step = subSteps[subStepIdx];

  if (!step) {
    return (
      <LearnShell topicTitle={topic.title} step={currentStep} total={totalSteps} onBack={() => navigate('/courses')}>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No content available for this topic yet.</p>
            <button onClick={() => navigate('/courses')}
              className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">
              Back to Curriculum
            </button>
          </div>
        </div>
      </LearnShell>
    );
  }

  // Video screen
  if (step.kind === 'video') {
    return (
      <LearnShell topicTitle={topic.title} step={currentStep} total={totalSteps} onBack={() => navigate('/courses')}>
        {/* Desktop: side-by-side. Mobile: stacked. */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* ── Video panel ── */}
          <div className="lg:flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
            <div className="w-full" style={{ aspectRatio: '16 / 9', maxHeight: '100%' }}>
              <iframe
                src={youtubeEmbed(step.sub.videoUrl ?? '')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={step.sub.title}
              />
            </div>
          </div>

          {/* ── Info panel ── */}
          <div className="lg:w-80 xl:w-96 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col overflow-y-auto">
            <div className="flex-1 p-6 flex flex-col gap-5">
              <div>
                <p className="text-[10px] font-extrabold text-[#0084B4] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Video className="w-3 h-3" /> Lesson Video
                </p>
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{step.sub.title}</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Watch the full video. When you're done, click Continue to attempt the quiz.
                </p>
              </div>

              {/* Step context */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step context</p>
                <p className="text-sm font-semibold text-slate-700">
                  {topic.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Step {currentStep} of {totalSteps}</p>
              </div>
            </div>

            {/* CTA always visible at bottom of panel */}
            <div className="p-4 pt-0 shrink-0">
              <button
                onClick={advanceSubStep}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0084B4] hover:bg-[#006A91] text-white font-extrabold rounded-xl transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5" /> I've watched this — Continue
              </button>
            </div>
          </div>

        </div>
      </LearnShell>
    );
  }

  // Quiz screen (subtopic-quiz and eval-quiz)
  const quizTitle = step.kind === 'eval-quiz'
    ? step.label
    : `Quiz: ${step.sub.title}`;
  const phaseLabel = step.kind === 'eval-quiz'
    ? step.label
    : step.sub.title;
  const offerAiHelp = step.kind === 'quiz';

  return (
    <LearnShell topicTitle={topic.title} step={currentStep} total={totalSteps} onBack={() => navigate('/courses')}>
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest mb-5 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> {phaseLabel}
          </p>
          <div key={subStepIdx}>
            <InlineQuiz
              title={quizTitle}
              questions={step.questions}
              onSubmit={(score, total) => {
                const pct = total > 0 ? (score / total) * 100 : 100;
                setQuizResult({ passed: pct >= 60 });
              }}
            />
          </div>
          {quizResult && (
            <div className="mt-4">
              {quizResult.passed || !offerAiHelp ? (
                <button
                  onClick={advanceSubStep}
                  className="w-full py-3 bg-[#0084B4] text-white font-extrabold rounded-xl hover:bg-[#006A91] transition-colors flex items-center justify-center gap-2 shadow"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setAiTeach({
                    topicTitle: topic.title,
                    subtopicTitle: step.kind === 'quiz' ? step.sub.title : undefined,
                    kind: 'subtopic',
                    retakeQuestions: step.questions,
                    onPassed: advanceSubStep,
                    onBack: () => {},
                  })}
                  className="w-full py-3 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <Sparkles className="w-4 h-4" /> Get AI Help & Retake
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </LearnShell>
  );
}
