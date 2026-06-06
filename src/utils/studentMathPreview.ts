/**
 * Best-effort conversion of student-typed math to LaTeX for live preview only.
 * Grading uses the raw answer string; this does not affect scoring.
 */
export function studentAnswerToPreviewLatex(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (/\$[^$]+\$/.test(trimmed) || /\\sqrt|\\frac|\\pi/.test(trimmed)) {
    return trimmed.includes('$') ? trimmed : `$${trimmed}$`;
  }

  let s = trimmed;
  s = s.replace(/sqrt\s*\(\s*([^)]+)\s*\)/gi, '\\sqrt{$1}');
  s = s.replace(/√\s*\(\s*([^)]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([^\s+\-*/^()]+)/g, '\\sqrt{$1}');
  s = s.replace(/\bpi\b/gi, '\\pi');
  s = s.replace(/π/g, '\\pi');
  s = s.replace(/×/g, '\\times');
  s = s.replace(/÷/g, '\\div');
  s = s.replace(/(\d+)\s*\/\s*(\d+)/g, '\\frac{$1}{$2}');

  return `$${s}$`;
}
