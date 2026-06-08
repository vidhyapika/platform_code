import { formatStudentAnswerForReview } from './studentMathPreview';

const HAS_MATH_DELIMITERS = /\$[^$]+\$|\$\$[^$]+\$\$/;
const BARE_LATEX = /\\(?:frac|sqrt|pi|times|div|sum|int|alpha|beta|gamma|theta|infty|cdot|pm|leq|geq|neq|left|right)\b/;
const INVALID_FRAC = /\\frac\{\s*\}/;

function hasMathDelimiters(text: string): boolean {
  return HAS_MATH_DELIMITERS.test(text);
}

/**
 * Prepare curriculum content (questions, options, correct answers, explanations)
 * for MathRenderer. Display-only; does not affect grading.
 */
export function prepareContentForMathDisplay(text: string): string {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return '';

  if (hasMathDelimiters(trimmed)) return text;

  if (BARE_LATEX.test(trimmed)) {
    const wrapped = `$${trimmed}$`;
    return INVALID_FRAC.test(wrapped) ? trimmed : wrapped;
  }

  return text;
}

export type PreparedStudentAnswer = {
  display: string;
  useMath: boolean;
};

/** Prepare student-typed answers for safe math display. */
export function prepareStudentAnswerForDisplay(answer: string): PreparedStudentAnswer {
  return formatStudentAnswerForReview(answer);
}

export function prepareMathDisplayText(
  text: string,
  variant: 'content' | 'studentAnswer'
): PreparedStudentAnswer | { display: string; useMath: true } {
  if (variant === 'studentAnswer') {
    return prepareStudentAnswerForDisplay(text);
  }
  const display = prepareContentForMathDisplay(text);
  return { display, useMath: true };
}
