import React from 'react';
import { Clock, RotateCcw, Sparkles } from 'lucide-react';

export type QuizCoachingActionsConfig = {
  coachingAvailable: boolean;
  canStartAiRetake: boolean;
  hasCompletedTutorSession: boolean;
  atCoachingCap?: boolean;
  onStartTutor: () => void;
  onStartAiRetake: () => void;
  onDoLater?: () => void;
};

type Props = QuizCoachingActionsConfig & {
  variant: 'hub' | 'fail-footer';
};

export function QuizCoachingActionGroup({
  coachingAvailable,
  canStartAiRetake,
  hasCompletedTutorSession,
  atCoachingCap,
  onStartTutor,
  onStartAiRetake,
  onDoLater,
  variant,
}: Props) {
  if (!coachingAvailable && !atCoachingCap) return null;

  if (atCoachingCap) {
    return (
      <div
        className={
          variant === 'hub'
            ? 'mx-4 sm:mx-5 mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4'
            : 'w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4'
        }
      >
        <p className="text-sm font-bold text-amber-900">
          You&apos;ve used all AI coaching attempts for this quiz. Please contact your instructor for help.
        </p>
      </div>
    );
  }

  const isHub = variant === 'hub';

  return (
    <div
      className={
        isHub
          ? 'mx-4 sm:mx-5 mb-4 rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 to-violet-50/40 px-4 py-4 sm:px-5 sm:py-5 shadow-sm'
          : 'w-full flex flex-col gap-3'
      }
    >
      {isHub ? (
        <>
          <div className="mb-3">
            <p className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest mb-1">
              Your next steps
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Do these in any order, whenever you&apos;re ready.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
            <ActionButtons
              canStartAiRetake={canStartAiRetake}
              hasCompletedTutorSession={hasCompletedTutorSession}
              onStartTutor={onStartTutor}
              onStartAiRetake={onStartAiRetake}
            />
          </div>
        </>
      ) : (
        <>
          <ActionButtons
            canStartAiRetake={canStartAiRetake}
            hasCompletedTutorSession={hasCompletedTutorSession}
            onStartTutor={onStartTutor}
            onStartAiRetake={onStartAiRetake}
          />
          {onDoLater ? (
            <button
              type="button"
              onClick={onDoLater}
              className="w-full py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-extrabold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" /> Do this later
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function ActionButtons({
  canStartAiRetake,
  hasCompletedTutorSession,
  onStartTutor,
  onStartAiRetake,
}: {
  canStartAiRetake: boolean;
  hasCompletedTutorSession: boolean;
  onStartTutor: () => void;
  onStartAiRetake: () => void;
}) {
  const btnBase =
    'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-extrabold transition-colors flex-1 sm:flex-none min-w-[10rem]';

  return (
    <>
      <button
        type="button"
        onClick={onStartTutor}
        className={`${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm`}
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        Start AI tutor
      </button>
      <button
        type="button"
        disabled={!canStartAiRetake}
        onClick={onStartAiRetake}
        title={
          !hasCompletedTutorSession
            ? 'Complete an AI tutor session first'
            : canStartAiRetake
              ? 'Take the AI retake quiz'
              : undefined
        }
        className={`${btnBase} ${
          canStartAiRetake
            ? 'bg-[#0084B4] text-white hover:bg-[#006A91] shadow-sm'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
        }`}
      >
        <RotateCcw className="w-4 h-4 shrink-0" />
        Take AI retake quiz
      </button>
      {!hasCompletedTutorSession ? (
        <p className="w-full text-xs text-slate-500 mt-1">
          AI retake unlocks after you complete at least one tutor session.
        </p>
      ) : null}
    </>
  );
}

export function QuizCoachingHubCard(props: QuizCoachingActionsConfig) {
  return <QuizCoachingActionGroup {...props} variant="hub" />;
}

export function QuizCoachingFailFooter(props: QuizCoachingActionsConfig & { onDoLater: () => void }) {
  return <QuizCoachingActionGroup {...props} variant="fail-footer" />;
}
