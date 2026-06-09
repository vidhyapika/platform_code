import type { Question } from '../types';
import { isTrueFalseOptionCorrect } from './questionAnswerMatch';
import { matchesAcceptedTextAnswer } from './textAnswerMatch';

export function isTextQuestionCorrect(q: Question, studentAnswer: string): boolean {
  return matchesAcceptedTextAnswer(studentAnswer, q);
}

export function isQuestionCorrect(q: Question, studentAnswer: string): boolean {
  const answer = studentAnswer ?? '';
  const type = q.type;

  if (type === 'text') {
    return isTextQuestionCorrect(q, answer);
  }

  if (type === 'boolean' || type === 'true_false') {
    return isTrueFalseOptionCorrect(answer, q.correctAnswer);
  }

  if (type === 'mcq') {
    return answer.toLowerCase().trim() === (q.correctAnswer ?? '').toLowerCase().trim();
  }

  return answer.toLowerCase().trim() === (q.correctAnswer ?? '').toLowerCase().trim();
}
