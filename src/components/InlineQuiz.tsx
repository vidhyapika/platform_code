import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, TrendingUp, RotateCcw } from 'lucide-react';

interface QuizAttemptRecord { score: number; total: number; date: string; }

interface InlineQuizProps {
  title: string;
  questions: Question[];
  onSubmit: (score: number, total: number) => void;
  initialAnswers?: Record<string, string>;
  isReviewMode?: boolean;
  attemptHistory?: QuizAttemptRecord[];
}

export function InlineQuiz({ title, questions, onSubmit, initialAnswers, isReviewMode, attemptHistory }: InlineQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode || false);

  // Reset state when questions change (e.g., switching from one quiz to another)
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setAnswers(initialAnswers || {});
    setIsSubmitted(isReviewMode || false);
  }, [questions, initialAnswers, isReviewMode]);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p>No questions available for this quiz yet.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleOptionSelect = (option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });
    onSubmit(score, questions.length);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) score++;
    });
    return score;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="text-slate-500 font-medium">{questions.length} Questions</p>
          </div>
        </div>

        {!isSubmitted ? (
          <>
            <div className="flex justify-between items-center mb-8">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.difficulty}
              </span>
            </div>

            <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">{currentQuestion.text}</h3>
              
              <div className="space-y-4">
                {currentQuestion.options?.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      answers[currentQuestion.id] === option 
                        ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm' 
                        : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 mr-4 text-sm font-bold shrink-0 ${
                        answers[currentQuestion.id] === option
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-300 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-base font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Previous
              </button>
              
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < questions.length}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-slate-900"
                >
                  Next
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="py-6">
            {/* Score banner */}
            {(() => {
              const score = calculateScore();
              const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
              const passed = pct >= 60;
              // Merge mock attempt history with the fresh submission
              const allAttempts: QuizAttemptRecord[] = [
                ...(attemptHistory ?? []),
                { score, total: questions.length, date: new Date().toISOString().split('T')[0] },
              ];
              return (
                <>
                  <div className={`flex items-center gap-4 p-5 rounded-2xl mb-6 ${passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${passed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      {passed
                        ? <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                        : <AlertCircle className="w-9 h-9 text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-extrabold text-slate-900">
                        {passed ? 'Great work!' : 'Quiz Done'}
                      </h2>
                      <p className={`text-sm font-medium mt-0.5 ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {score}/{questions.length} correct · {pct}%
                        {passed ? ' · Passed' : ' · Review explanations below'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-4xl font-black ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</span>
                    </div>
                  </div>

                  {/* Attempt history chart */}
                  {allAttempts.length > 1 && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" /> Your Progress Over Time
                      </p>
                      <div className="flex items-end gap-3">
                        {allAttempts.map((a, i) => {
                          const aPct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                          const isLatest = i === allAttempts.length - 1;
                          return (
                            <div key={i} className="flex flex-col items-center gap-1 flex-1">
                              <span className={`text-xs font-extrabold ${isLatest ? 'text-blue-600' : 'text-slate-500'}`}>{aPct}%</span>
                              <div className="w-full rounded-t-lg transition-all" style={{
                                height: `${Math.max(8, aPct * 0.6)}px`,
                                backgroundColor: isLatest ? '#3b82f6' : '#cbd5e1',
                              }} />
                              <span className="text-[9px] text-slate-400 font-bold">#{i + 1}</span>
                              <span className="text-[8px] text-slate-300 hidden sm:block truncate w-full text-center">{a.date}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>{allAttempts.length} attempt{allAttempts.length !== 1 ? 's' : ''}</span>
                        {allAttempts.length > 1 && (() => {
                          const first = allAttempts[0];
                          const last  = allAttempts[allAttempts.length - 1];
                          const diff  = Math.round(((last.score / last.total) - (first.score / first.total)) * 100);
                          return (
                            <span className={`font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {diff >= 0 ? '+' : ''}{diff}% from first attempt
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Q&A review */}
            <div className="space-y-5 text-left">
              {questions.map((q, idx) => {
                const isCorrect = answers[q.id] === q.correctAnswer;
                return (
                  <div key={q.id} className={`p-5 rounded-2xl border ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                    <div className="flex items-start gap-4">
                      {isCorrect
                        ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-1" />
                        : <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-1" />}
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 mb-3">{idx + 1}. {q.text}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Answer</p>
                            <p className={`font-semibold text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{answers[q.id] || 'No answer'}</p>
                          </div>
                          {!isCorrect && (
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Correct Answer</p>
                              <p className="font-semibold text-green-700 text-sm">{q.correctAnswer}</p>
                            </div>
                          )}
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Explanation</p>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
