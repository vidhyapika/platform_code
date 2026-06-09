import assert from 'node:assert/strict';
import {
  textAnswersEquivalent,
  matchesAcceptedTextAnswer,
  tryParseRational,
} from './textAnswerMatch';
import { parseAlternativeAnswersFromCsv } from './csvImport';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`);
    throw e;
  }
}

test('equivalent fraction notations', () => {
  assert.equal(textAnswersEquivalent('-2/9', '(-2/9)'), true);
  assert.equal(textAnswersEquivalent('-2/9', '(-2)/9'), true);
  assert.equal(textAnswersEquivalent('-2/9', '- 2 / 9'), true);
});

test('rejects different values', () => {
  assert.equal(textAnswersEquivalent('-2/9', '2/9'), false);
  assert.equal(textAnswersEquivalent('-2/9', '-3/9'), false);
});

test('matches primary and alternatives', () => {
  const q = { correctAnswer: '-2/9', alternativeAnswers: ['second degree'] };
  assert.equal(matchesAcceptedTextAnswer('(-2/9)', q), true);
  assert.equal(matchesAcceptedTextAnswer('second degree', q), true);
  assert.equal(matchesAcceptedTextAnswer('wrong', q), false);
});

test('parses fraction variants', () => {
  assert.deepEqual(tryParseRational('(-2)/9'), { num: -2, den: 9 });
  assert.deepEqual(tryParseRational('(-2/9)'), { num: -2, den: 9 });
});

test('parseAlternativeAnswersFromCsv splits pipe or comma', () => {
  assert.deepEqual(parseAlternativeAnswersFromCsv('a|b'), ['a', 'b']);
  assert.deepEqual(parseAlternativeAnswersFromCsv('a, b'), ['a', 'b']);
});

console.log('All textAnswerMatch tests passed.');
