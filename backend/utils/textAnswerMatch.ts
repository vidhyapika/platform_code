/** Question shape needed for text-answer matching (grading only). */
export type TextAnswerQuestion = {
  correctAnswer?: string | null;
  alternativeAnswers?: string[] | null;
};

export function normalizeTextAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[−–]/g, "-");
}

/** Remove balanced outer parentheses repeatedly, e.g. "(-2/9)" → "-2/9". */
export function stripRedundantParens(s: string): string {
  let t = s.trim();
  while (t.startsWith("(") && t.endsWith(")")) {
    const inner = t.slice(1, -1);
    let depth = 0;
    let valid = true;
    for (const ch of inner) {
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth < 0) {
          valid = false;
          break;
        }
      }
    }
    if (!valid || depth !== 0) break;
    t = inner.trim();
  }
  return t;
}

export function tryParseRational(s: string): { num: number; den: number } | null {
  const cleaned = stripRedundantParens(normalizeTextAnswer(s));
  if (!cleaned) return null;

  if (/^-?\d+$/.test(cleaned)) {
    return { num: parseInt(cleaned, 10), den: 1 };
  }

  const patterns = [
    /^(-?\d+)\/(\d+)$/,
    /^\((-?\d+)\)\/(\d+)$/,
    /^(-?\d+)\/\((\d+)\)$/,
    /^\((-?\d+)\)\/\((\d+)\)$/,
  ];

  for (const re of patterns) {
    const m = cleaned.match(re);
    if (m) {
      const num = parseInt(m[1]!, 10);
      const den = parseInt(m[2]!, 10);
      if (den === 0) return null;
      return { num, den };
    }
  }

  return null;
}

function rationalsEqual(a: { num: number; den: number }, b: { num: number; den: number }): boolean {
  return a.num * b.den === b.num * a.den;
}

export function textAnswersEquivalent(a: string, b: string): boolean {
  if (!a?.trim() || !b?.trim()) return false;

  const na = normalizeTextAnswer(a);
  const nb = normalizeTextAnswer(b);
  if (na === nb) return true;

  const sa = stripRedundantParens(na);
  const sb = stripRedundantParens(nb);
  if (sa === sb) return true;

  const ra = tryParseRational(a);
  const rb = tryParseRational(b);
  if (ra && rb) return rationalsEqual(ra, rb);

  return false;
}

export function matchesAcceptedTextAnswer(studentAnswer: string, question: TextAnswerQuestion): boolean {
  const accepted = [question.correctAnswer, ...(question.alternativeAnswers ?? [])].filter(
    (a): a is string => Boolean(a?.trim())
  );
  return accepted.some((a) => textAnswersEquivalent(studentAnswer, a));
}

export function allAcceptedAnswersText(question: TextAnswerQuestion): string {
  return [question.correctAnswer, ...(question.alternativeAnswers ?? [])].filter(Boolean).join(" OR ");
}
