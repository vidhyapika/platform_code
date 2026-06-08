/**
 * Best-effort conversion of student-typed math to LaTeX for live preview only.
 * Grading uses the raw answer string; this does not affect scoring.
 */

const INVALID_FRAC = /\\frac\{\s*\}|\$\\frac\{\s*\}/;

function hasWellFormedMathDelimiters(s: string): boolean {
  return /^\$[^$]+\$$/.test(s.trim()) || /^\$\$[^$]+\$\$$/.test(s.trim());
}

/** Plain sentences / words should not be forced into math mode. */
export function isMathLikeAnswer(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (hasWellFormedMathDelimiters(trimmed)) return true;
  if (/\\sqrt|\\frac|\\pi|\\times|\\div|\^|\d+\s*\/\s*\d+|sqrt\s*\(|√|π|×|÷/.test(trimmed)) return true;
  if (/^[\d\s+\-*/().,^√π×÷]+$/u.test(trimmed)) return true;
  return false;
}

export function studentAnswerToPreviewLatex(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (!isMathLikeAnswer(trimmed)) return trimmed;

  if (hasWellFormedMathDelimiters(trimmed)) {
    return INVALID_FRAC.test(trimmed) ? trimmed.replace(/\$/g, '') : trimmed;
  }

  if (/\\sqrt|\\frac|\\pi/.test(trimmed)) {
    const wrapped = trimmed.includes('$') ? trimmed : `$${trimmed}$`;
    return INVALID_FRAC.test(wrapped) ? trimmed : wrapped;
  }

  let s = trimmed;
  s = s.replace(/sqrt\s*\(\s*([^)]+)\s*\)/gi, '\\sqrt{$1}');
  s = s.replace(/√\s*\(\s*([^)]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([^\s+\-*/^()]+)/g, '\\sqrt{$1}');
  s = s.replace(/\bpi\b/gi, '\\pi');
  s = s.replace(/π/g, '\\pi');
  s = s.replace(/×/g, '\\times');
  s = s.replace(/÷/g, '\\div');
  s = s.replace(/(\d+)\s*\/\s*(\d+)/g, (_, a, b) => (a && b ? `\\frac{${a}}{${b}}` : _));

  const wrapped = `$${s}$`;
  if (INVALID_FRAC.test(wrapped)) return trimmed;
  return wrapped;
}

export function formatStudentAnswerForReview(answer: string): { display: string; useMath: boolean } {
  const trimmed = answer?.trim() ?? '';
  if (!trimmed) return { display: '', useMath: false };
  if (!isMathLikeAnswer(trimmed)) return { display: trimmed, useMath: false };
  const latex = studentAnswerToPreviewLatex(trimmed);
  const useMath = latex !== trimmed && !INVALID_FRAC.test(latex);
  return { display: useMath ? latex : trimmed, useMath };
}
