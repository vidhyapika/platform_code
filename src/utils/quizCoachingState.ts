import type { Question } from '../types';
import type { FailedQuestionInput } from '../lib/voice/failedQuestionsFromQuiz';
import {
  failedQuestionsFromStoredAttempt,
  type StoredQuizAttempt,
} from '../lib/voice/failedQuestionsFromQuiz';

export const MAX_AI_COACHING_CYCLES = 3;

export type QuizCoachingContextType = 'prereq' | 'subtopic' | 'finaltest';

export type AiSessionSummary = {
  id: string;
  voiceStatus?: 'active' | 'ended' | null;
  contextType?: string;
  contextId?: string | null;
};

export type QuizCoachingState = {
  quizCleared: boolean;
  coachingAvailable: boolean;
  hasCompletedTutorSession: boolean;
  canStartAiRetake: boolean;
  atCoachingCap: boolean;
  priorFailedAiRetakes: number;
  failedQuestions: FailedQuestionInput[];
};

type TopicProgressSlice = {
  prereqStatus?: string;
  finalTestStatus?: string;
};

type TopicStatusInput = {
  progress?: TopicProgressSlice;
  subTopicProgress?: Array<{ subTopicId: string; quizStatus?: string }>;
  prereqQuizAttempts?: Array<{ prerequisiteId: string; attempts?: StoredQuizAttempt[] }>;
  subtopicQuizAttempts?: Array<{ subTopicId: string; attempts?: StoredQuizAttempt[] }>;
  finalTestAttempts?: StoredQuizAttempt[];
};

function isClearedStatus(status?: string): boolean {
  return status === 'passed' || status === 'flagged';
}

function getQuizAttemptsForContext(
  topicStatus: TopicStatusInput | null | undefined,
  contextType: QuizCoachingContextType,
  contextId: string
): StoredQuizAttempt[] {
  if (!topicStatus) return [];
  if (contextType === 'prereq') {
    const block = topicStatus.prereqQuizAttempts?.find((x) => x.prerequisiteId === contextId);
    return block?.attempts ?? [];
  }
  if (contextType === 'subtopic') {
    const block = topicStatus.subtopicQuizAttempts?.find((x) => x.subTopicId === contextId);
    return block?.attempts ?? [];
  }
  return topicStatus.finalTestAttempts ?? [];
}

function countFailedAiRetakes(attempts: StoredQuizAttempt[]): number {
  return attempts.filter((a) => a.aiGenerated === true && a.passed === false).length;
}

function latestNonAiAttempt(attempts: StoredQuizAttempt[]): StoredQuizAttempt | null {
  for (let i = attempts.length - 1; i >= 0; i--) {
    const a = attempts[i];
    if (!a?.aiGenerated) return a ?? null;
  }
  return null;
}

function isQuizClearedForContext(
  topicStatus: TopicProgressSlice | null | undefined,
  subTopicProgress: TopicStatusInput['subTopicProgress'],
  contextType: QuizCoachingContextType,
  contextId: string
): boolean {
  if (!topicStatus && !subTopicProgress) return false;
  if (contextType === 'prereq') return isClearedStatus(topicStatus?.prereqStatus);
  if (contextType === 'finaltest') return isClearedStatus(topicStatus?.finalTestStatus);
  const sub = subTopicProgress?.find((s) => s.subTopicId === contextId);
  return isClearedStatus(sub?.quizStatus);
}

export function deriveQuizCoachingState(params: {
  contextType: QuizCoachingContextType;
  contextId: string;
  questions: Question[];
  topicStatus?: TopicStatusInput | null;
  aiSessions?: AiSessionSummary[];
  /** Fresh failed questions right after submit (optional). */
  apiFailed?: FailedQuestionInput[];
}): QuizCoachingState {
  const { contextType, contextId, questions, topicStatus, aiSessions, apiFailed } = params;
  const progress = topicStatus?.progress;
  const attempts = getQuizAttemptsForContext(topicStatus, contextType, contextId);
  const priorFailedAiRetakes = countFailedAiRetakes(attempts);
  const atCoachingCap = priorFailedAiRetakes >= MAX_AI_COACHING_CYCLES;
  const quizCleared = isQuizClearedForContext(
    progress,
    topicStatus?.subTopicProgress,
    contextType,
    contextId
  );

  const latestOriginal = latestNonAiAttempt(attempts);
  const coachingAvailable =
    !quizCleared && !atCoachingCap && latestOriginal != null && latestOriginal.passed === false;

  const contextSessions = (aiSessions ?? []).filter(
    (s) =>
      s.contextType === contextType &&
      (s.contextId == null || s.contextId === contextId)
  );
  const hasCompletedTutorSession = contextSessions.some((s) => s.voiceStatus === 'ended');

  const canStartAiRetake =
    coachingAvailable && hasCompletedTutorSession && !atCoachingCap;

  let failedQuestions: FailedQuestionInput[] = [];
  if (apiFailed?.length) {
    failedQuestions = apiFailed;
  } else if (latestOriginal) {
    failedQuestions = failedQuestionsFromStoredAttempt(questions, latestOriginal);
  }

  return {
    quizCleared,
    coachingAvailable,
    hasCompletedTutorSession,
    canStartAiRetake,
    atCoachingCap,
    priorFailedAiRetakes,
    failedQuestions,
  };
}
