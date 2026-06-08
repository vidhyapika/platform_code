/** Canonical True/False answer for storage and display. */
export function normalizeTrueFalseAnswer(value: string | null | undefined): 'True' | 'False' | null {
  if (value == null || value === '') return null;
  const v = String(value).trim().toLowerCase();
  if (v === 'true' || v === 't' || v === '1' || v === 'yes') return 'True';
  if (v === 'false' || v === 'f' || v === '0' || v === 'no') return 'False';
  return null;
}

export function normalizeQuestionFields(body: {
  type?: string;
  correctAnswer?: string | null;
  options?: string[] | null;
}): { correctAnswer?: string | null; options?: string[] | null } {
  if (body.type !== 'true_false') return {};
  const correct = normalizeTrueFalseAnswer(body.correctAnswer);
  if (!correct) {
    throw new Error('True/False questions require correctAnswer "True" or "False".');
  }
  return {
    correctAnswer: correct,
    options: ['True', 'False'],
  };
}

export function normalizeQuestionRow<T extends { type?: string; correctAnswer?: string | null; options?: string[] | null }>(
  q: T
): T {
  if (q.type !== 'true_false') return q;
  const correct = normalizeTrueFalseAnswer(q.correctAnswer);
  return {
    ...q,
    options: q.options?.length ? q.options : ['True', 'False'],
    correctAnswer: correct ?? q.correctAnswer,
  };
}
