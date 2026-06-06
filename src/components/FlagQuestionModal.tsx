import React, { useState } from 'react';
import { Flag, Loader2, X } from 'lucide-react';
import { apiFetch } from '../hooks/useApi';
import type { QuestionFlagReasonType } from '../types/questionFlags';

export type FlagQuestionContext = {
  topicId: string;
  contextType: 'prereq' | 'subtopic' | 'finaltest';
  contextId: string;
  subTopicId?: string;
  quizAttemptId?: string;
  questionId: string;
};

const REASONS: { id: QuestionFlagReasonType; label: string }[] = [
  { id: 'question_issue', label: 'Question seems wrong' },
  { id: 'grading_dispute', label: 'My answer should be correct' },
  { id: 'other', label: 'Other' },
];

export function FlagQuestionButton({
  context,
  disabled,
  existingStatus,
  onFlagged,
  compact = false,
}: {
  context: FlagQuestionContext;
  disabled?: boolean;
  existingStatus?: 'open' | 'in_review' | 'resolved' | 'rejected' | null;
  onFlagged?: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reasonType, setReasonType] = useState<QuestionFlagReasonType>('grading_dispute');
  const [reasonText, setReasonText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (existingStatus === 'open' || existingStatus === 'in_review') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
        <Flag className="w-3 h-3" /> Under review
      </span>
    );
  }

  if (existingStatus === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
        Flag resolved
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || done}
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-700 transition-colors'
            : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors'
        }
      >
        <Flag className="w-3.5 h-3.5" />
        {done ? 'Flag sent' : 'Flag question'}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Flag this question</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Tell your instructor if the question has an error or if you think your answer was graded incorrectly.
              </p>
              <div className="flex flex-col gap-2">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      reasonType === r.id ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      checked={reasonType === r.id}
                      onChange={() => setReasonType(r.id)}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                  </label>
                ))}
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Optional details (max 500 characters)"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  setError(null);
                  const res = await apiFetch<{ id: string }>('/api/student/question-flags', {
                    method: 'POST',
                    body: JSON.stringify({
                      topicId: context.topicId,
                      contextType: context.contextType,
                      contextId: context.contextId,
                      subTopicId: context.subTopicId,
                      questionId: context.questionId,
                      quizAttemptId: context.quizAttemptId,
                      reasonType,
                      reasonText: reasonText.trim() || undefined,
                    }),
                  });
                  setSubmitting(false);
                  if (res.error) {
                    setError(res.error);
                    return;
                  }
                  setDone(true);
                  setOpen(false);
                  onFlagged?.();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Send to instructor
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
