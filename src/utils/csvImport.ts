/**
 * csvImport.ts
 *
 * Parses a CSV (or TSV) file into curriculum data structures.
 *
 * ─── Supported Import Levels ────────────────────────────────────────────────
 *
 * A single CSV file can cover any subset of the data hierarchy.  
 * The parser detects what is present from the column headers.
 *
 * ─── Column Reference ───────────────────────────────────────────────────────
 *
 * REQUIRED FOR EVERY ROW
 *   standard_name         e.g. "Grade 9"
 *   section_name          e.g. "Section A"
 *
 * TOPIC LEVEL  (at least topic_title required)
 *   topic_title           e.g. "Algebraic Expressions"
 *   topic_sequence        e.g. "1"   (defaults to row order)
 *
 * PREREQUISITE COLUMNS (all optional; omit columns or leave blank to skip)
 *   prereq_title          e.g. "Basic Arithmetic"
 *   prereq_category       "Major" | "Intermediate" | "Minor"  (default: Minor)
 *
 * SUBTOPIC COLUMNS  (all optional)
 *   subtopic_title        e.g. "Introduction to Polynomials"
 *   subtopic_video        YouTube URL  (optional)
 *
 * QUIZ COLUMNS  (all optional; quiz_type designates which quiz)
 *   quiz_type             "subtopic" | "pre" | "post"
 *   question_text         e.g. "What is 2+2?"
 *   question_type         "mcq" | "true_false" | "text" | "image_upload"  (boolean = alias)
 *   image_url             optional diagram URL for the question stem
 *   option_a … option_d   MCQ options (optional for boolean/text)
 *   correct_answer        must match one of the options exactly (or "True"/"False")
 *   alternative_answers   optional comma- or pipe-separated alternate text answers (Tier 1 extras)
 *   grading_guidance      optional AI rubric notes when auto-matching cannot decide (Tier 2)
 *   explanation           explanation text
 *   difficulty            "Easy" | "Medium" | "Hard"  (default: Medium)
 *
 * ─── Important Rules ────────────────────────────────────────────────────────
 *
 * 1. Each row can contain data for ONE question OR ONE prerequisite (not both).
 *    Use separate rows for each quiz question / prerequisite.
 * 2. To attach a question to a subtopic quiz, fill subtopic_title + quiz_type=subtopic.
 *    For pre / post evaluation, fill topic_title + quiz_type=pre|post (subtopic_title optional).
 * 3. Leave a cell blank to inherit the value from the row above (cascading).
 *    This lets you write topic_title once and add many rows for its questions without repeating it.
 * 4. If the same (standard, section, topic) already exists in the current data
 *    the import MERGES – it appends new subtopics and questions without duplicating.
 */

import type { Question, Prerequisite, SubTopic, Topic, CurriculumClass, Standard } from '../data/adminMockData';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function parseAlternativeAnswersFromCsv(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const sep = raw.includes('|') ? '|' : ',';
  return raw.split(sep).map(s => s.trim()).filter(Boolean);
}

// ─── Public types ────────────────────────────────────────────────────────────

export type ImportLevel =
  | 'full'        // standard + section + topic + subtopic + questions + prerequisites
  | 'topic'       // topic + subtopic + questions + prerequisites  (within a known standard/section)
  | 'subtopic'    // subtopic + questions only
  | 'questions';  // questions only (within a known topic/subtopic)

export interface ParseError {
  row: number;
  column: string;
  message: string;
}

export interface ParseResult {
  standards: Standard[];
  errors: ParseError[];
  warnings: string[];
  rowCount: number;
}

// ─── Row shape after header normalisation ────────────────────────────────────

interface RawRow {
  rowIndex: number;
  standard_name: string;
  standard_description: string;
  section_name: string;
  class_passing_threshold: string;
  topic_title: string;
  topic_sequence: string;
  topic_description: string;
  final_test_threshold: string;
  prereq_title: string;
  prereq_category: string;
  prereq_description: string;
  prereq_passing_threshold: string;
  prereq_max_ai_attempts: string;
  subtopic_title: string;
  subtopic_video: string;
  subtopic_order: string;
  subtopic_passing_threshold: string;
  quiz_type: string;
  question_text: string;
  image_url: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  alternative_answers: string;
  grading_guidance: string;
  explanation: string;
  difficulty: string;
}

/** Canonical column order for full-hierarchy curriculum CSV / Excel template */
export const FULL_TEMPLATE_HEADERS = [
  'standard_name', 'standard_description',
  'section_name', 'class_passing_threshold',
  'topic_title', 'topic_sequence', 'topic_description', 'final_test_threshold',
  'prereq_title', 'prereq_category', 'prereq_description', 'prereq_passing_threshold', 'prereq_max_ai_attempts',
  'subtopic_title', 'subtopic_video', 'subtopic_order', 'subtopic_passing_threshold',
  'quiz_type', 'question_text', 'image_url', 'question_type',
  'option_a', 'option_b', 'option_c', 'option_d',
  'correct_answer', 'alternative_answers', 'grading_guidance', 'explanation', 'difficulty',
] as const;

function parseThreshold(raw: string, fallback = 60): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

function parsePositiveInt(raw: string, fallback: number): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

type FullQuestionType = 'mcq' | 'true_false' | 'text' | 'image_upload';

function normalizeFullQuestionType(raw: string): FullQuestionType {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (!s) return 'mcq';
  if (['true_false', 'boolean', 'bool', 'tf', 't_f', 'truefalse', 't/f'].includes(s)) return 'true_false';
  if (['text', 'short_answer', 'shortanswer', 'subjective'].includes(s)) return 'text';
  if (['image_upload', 'image', 'upload', 'photo', 'handwritten'].includes(s)) return 'image_upload';
  return 'mcq';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function slug(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function deterministicId(prefix: string, ...parts: string[]) {
  return `${prefix}-${slug(parts.join('-'))}`;
}

const KNOWN_COLUMNS: string[] = [...FULL_TEMPLATE_HEADERS];

// ─── CSV tokeniser (handles quoted fields with commas inside) ─────────────────

export function tokeniseCSV(raw: string): string[][] {
  const lines: string[][] = [];
  const rows = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const line of rows) {
    if (line.trim() === '') continue;
    const cells: string[] = [];
    let inQuote = false;
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cells.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    lines.push(cells.map(c => c.trim()));
  }
  return lines;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseCSV(csvText: string, existingStandards: Standard[] = []): ParseResult {
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  const rows = tokeniseCSV(csvText);

  if (rows.length < 2) {
    errors.push({ row: 0, column: '', message: 'File appears empty or has no data rows.' });
    return { standards: [], errors, warnings, rowCount: 0 };
  }

  // Map header names → column indices
  const headers = rows[0].map(normaliseHeader);
  const unknown = headers.filter(h => !KNOWN_COLUMNS.includes(h));
  if (unknown.length) warnings.push(`Unknown columns will be ignored: ${unknown.join(', ')}`);

  const col = (name: string): number => headers.indexOf(name);
  const get = (cells: string[], name: string): string => {
    const i = col(name);
    return i >= 0 ? (cells[i] ?? '').trim() : '';
  };

  // Validate required columns exist
  const requiredCols = ['standard_name', 'section_name'];
  for (const rc of requiredCols) {
    if (col(rc) === -1) {
      errors.push({ row: 1, column: rc, message: `Required column "${rc}" not found in CSV.` });
    }
  }
  if (errors.length) return { standards: [], errors, warnings, rowCount: 0 };

  // ── Deep clone existing data so we can mutate freely ──────────────────────
  const result: Standard[] = JSON.parse(JSON.stringify(existingStandards));

  // ── Cascade context: each field inherits value from previous row if blank ──
  const emptyCtx = (): RawRow => ({
    rowIndex: 0,
    standard_name: '', standard_description: '',
    section_name: '', class_passing_threshold: '',
    topic_title: '', topic_sequence: '', topic_description: '', final_test_threshold: '',
    prereq_title: '', prereq_category: '',
    prereq_description: '', prereq_passing_threshold: '', prereq_max_ai_attempts: '',
    subtopic_title: '', subtopic_video: '', subtopic_order: '', subtopic_passing_threshold: '',
    quiz_type: '', question_text: '', image_url: '', question_type: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: '', alternative_answers: '', grading_guidance: '', explanation: '', difficulty: '',
  });
  let ctx = emptyCtx();

  // ── Helper: find-or-create a node in `result` ─────────────────────────────
  const findOrCreateStandard = (name: string, description: string): Standard => {
    let std = result.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!std) {
      std = { id: deterministicId('std', name), name, classes: [], description: description || undefined };
      result.push(std);
    } else if (description && !std.description) {
      std.description = description;
    }
    return std;
  };

  const findOrCreateClass = (std: Standard, name: string, passingThreshold: number): CurriculumClass => {
    let cls = std.classes.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!cls) {
      cls = { id: deterministicId('cls', std.name, name), name, curriculum: [], passingThreshold };
      std.classes.push(cls);
    } else if (passingThreshold !== 60 || cls.passingThreshold === undefined) {
      cls.passingThreshold = passingThreshold;
    }
    return cls;
  };

  const findOrCreateTopic = (
    cls: CurriculumClass,
    title: string,
    sequence: number,
    description: string,
    finalTestThreshold: number,
  ): Topic => {
    let topic = cls.curriculum.find(t => t.title.toLowerCase() === title.toLowerCase());
    if (!topic) {
      topic = {
        id: deterministicId('top', title),
        title,
        sequence,
        description: description || undefined,
        finalTestThreshold,
        subTopics: [],
        prerequisites: [],
        preEvaluationQuiz: [],
        postEvaluationQuiz: [],
      };
      cls.curriculum.push(topic);
    } else {
      if (description && !topic.description) topic.description = description;
      if (finalTestThreshold !== 60 || topic.finalTestThreshold === undefined) {
        topic.finalTestThreshold = finalTestThreshold;
      }
    }
    return topic;
  };

  const findOrCreateSubTopic = (
    topic: Topic,
    title: string,
    video: string,
    order: number,
    passingThreshold: number,
  ): SubTopic => {
    let sub = topic.subTopics.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (!sub) {
      sub = {
        id: deterministicId('sub', title),
        title,
        videoUrl: video || undefined,
        order,
        sequenceOrder: order,
        passingThreshold,
        quizzes: [],
      };
      topic.subTopics.push(sub);
    } else {
      if (video && !sub.videoUrl) sub.videoUrl = video;
      if (order) {
        sub.order = order;
        sub.sequenceOrder = order;
      }
      if (passingThreshold !== 60 || sub.passingThreshold === undefined) {
        sub.passingThreshold = passingThreshold;
      }
    }
    return sub;
  };

  const makeQuestion = (r: RawRow, rowNum: number): Question | null => {
    if (!r.question_text) return null;

    const qType = normalizeFullQuestionType(r.question_type);
    const difficulty = (['Easy', 'Medium', 'Hard'].includes(r.difficulty) ? r.difficulty : 'Medium') as 'Easy' | 'Medium' | 'Hard';
    let options: string[] | undefined;
    let correctAnswer: string | undefined = r.correct_answer;

    if (r.image_url) {
      try {
        new URL(r.image_url);
      } catch {
        errors.push({ row: rowNum, column: 'image_url', message: 'image_url must be a valid URL.' });
        return null;
      }
    }

    if (qType === 'mcq') {
      options = [r.option_a, r.option_b, r.option_c, r.option_d].filter(Boolean);
      if (options.length < 2) {
        errors.push({ row: rowNum, column: 'option_a', message: 'MCQ questions need at least option_a and option_b.' });
        return null;
      }
      if (!correctAnswer) {
        errors.push({ row: rowNum, column: 'correct_answer', message: 'MCQ questions require correct_answer.' });
        return null;
      }
      if (!options.includes(correctAnswer)) {
        errors.push({ row: rowNum, column: 'correct_answer', message: `correct_answer "${correctAnswer}" does not match any option.` });
        return null;
      }
    } else if (qType === 'true_false') {
      options = ['True', 'False'];
      if (!['True', 'False'].includes(correctAnswer)) {
        errors.push({ row: rowNum, column: 'correct_answer', message: 'True/False questions require correct_answer "True" or "False".' });
        return null;
      }
    } else if (qType === 'text') {
      if (!correctAnswer) {
        errors.push({ row: rowNum, column: 'correct_answer', message: 'Short answer questions require correct_answer.' });
        return null;
      }
    } else if (qType === 'image_upload') {
      options = undefined;
      correctAnswer = correctAnswer || undefined;
    }

    const alternativeAnswers = qType === 'text'
      ? parseAlternativeAnswersFromCsv(r.alternative_answers)
      : [];

    const gradingGuidance =
      qType === 'text' || qType === 'image_upload' ? (r.grading_guidance?.trim() || undefined) : undefined;

    return {
      id: uid(),
      text: r.question_text,
      type: qType,
      imageUrl: r.image_url || undefined,
      options,
      correctAnswer,
      alternativeAnswers,
      gradingGuidance,
      explanation: r.explanation,
      difficulty,
    };
  };

  // ── Process data rows ──────────────────────────────────────────────────────
  let defaultSequence = 1;
  for (let ri = 1; ri < rows.length; ri++) {
    const cells = rows[ri];
    const rowNum = ri + 1; // 1-based for display

    // Cascade: use previous value if cell is blank
    const cascade = (field: keyof RawRow): string => {
      const val = get(cells, field as string);
      return val !== '' ? val : (ctx[field] as string);
    };

    const r: RawRow = {
      rowIndex: ri,
      standard_name:   cascade('standard_name'),
      standard_description: cascade('standard_description'),
      section_name:    cascade('section_name'),
      class_passing_threshold: cascade('class_passing_threshold'),
      topic_title:     cascade('topic_title'),
      topic_sequence:  cascade('topic_sequence'),
      topic_description: cascade('topic_description'),
      final_test_threshold: cascade('final_test_threshold'),
      prereq_title:    get(cells, 'prereq_title'),
      prereq_category: get(cells, 'prereq_category'),
      prereq_description: get(cells, 'prereq_description'),
      prereq_passing_threshold: get(cells, 'prereq_passing_threshold'),
      prereq_max_ai_attempts: get(cells, 'prereq_max_ai_attempts'),
      subtopic_title:  cascade('subtopic_title'),
      subtopic_video:  cascade('subtopic_video'),
      subtopic_order:  cascade('subtopic_order'),
      subtopic_passing_threshold: cascade('subtopic_passing_threshold'),
      quiz_type:       cascade('quiz_type'),
      question_text:   get(cells, 'question_text'),
      image_url:       get(cells, 'image_url'),
      question_type:   cascade('question_type'),
      option_a:        get(cells, 'option_a'),
      option_b:        get(cells, 'option_b'),
      option_c:        get(cells, 'option_c'),
      option_d:        get(cells, 'option_d'),
      correct_answer:  get(cells, 'correct_answer'),
      alternative_answers: get(cells, 'alternative_answers'),
      grading_guidance: get(cells, 'grading_guidance'),
      explanation:     get(cells, 'explanation'),
      difficulty:      cascade('difficulty'),
    };

    // Validate standard + section
    if (!r.standard_name) {
      errors.push({ row: rowNum, column: 'standard_name', message: 'standard_name is required.' });
      continue;
    }
    if (!r.section_name) {
      errors.push({ row: rowNum, column: 'section_name', message: 'section_name is required.' });
      continue;
    }

    const classThreshold = parseThreshold(r.class_passing_threshold, 60);
    const std = findOrCreateStandard(r.standard_name, r.standard_description);
    const cls = findOrCreateClass(std, r.section_name, classThreshold);

    // ── Topic ──────────────────────────────────────────────────────────────
    if (!r.topic_title) {
      if (r.prereq_title || r.subtopic_title || r.question_text) {
        errors.push({ row: rowNum, column: 'topic_title', message: 'topic_title is required to add subtopics/questions/prerequisites.' });
      }
      ctx = r;
      continue;
    }

    const topicSeq = parseInt(r.topic_sequence, 10) || defaultSequence++;
    const finalTestThreshold = parseThreshold(r.final_test_threshold, 60);
    const topic = findOrCreateTopic(
      cls,
      r.topic_title,
      topicSeq,
      r.topic_description,
      finalTestThreshold,
    );

    // ── Prerequisite ──────────────────────────────────────────────────────
    if (r.prereq_title) {
      const alreadyExists = topic.prerequisites?.some(p => p.title.toLowerCase() === r.prereq_title.toLowerCase());
      if (!alreadyExists) {
        const category = (['Major', 'Intermediate', 'Minor'].includes(r.prereq_category)
          ? r.prereq_category
          : 'Minor') as 'Major' | 'Intermediate' | 'Minor';
        topic.prerequisites = topic.prerequisites ?? [];
        topic.prerequisites.push({
          id: uid(),
          title: r.prereq_title,
          category,
          description: r.prereq_description || undefined,
          passingThreshold: parseThreshold(r.prereq_passing_threshold, 60),
          maxAIAttempts: parsePositiveInt(r.prereq_max_ai_attempts, 3),
        });
      }
    }

    // ── Question (pre / post evaluation, no subtopic required) ────────────
    const qt = r.quiz_type.toLowerCase();
    if (!r.subtopic_title && (qt === 'pre' || qt === 'post')) {
      const q = makeQuestion(r, rowNum);
      if (q) {
        if (qt === 'pre') {
          topic.preEvaluationQuiz = topic.preEvaluationQuiz ?? [];
          topic.preEvaluationQuiz.push(q);
        } else {
          topic.postEvaluationQuiz = topic.postEvaluationQuiz ?? [];
          topic.postEvaluationQuiz.push(q);
        }
      }
      ctx = r;
      continue;
    }

    // ── SubTopic ──────────────────────────────────────────────────────────
    if (r.subtopic_title) {
      const subOrder = parseInt(r.subtopic_order, 10) || topic.subTopics.length + 1;
      const subThreshold = parseThreshold(r.subtopic_passing_threshold, 60);
      const sub = findOrCreateSubTopic(
        topic,
        r.subtopic_title,
        r.subtopic_video,
        subOrder,
        subThreshold,
      );

      if (qt === 'pre' || qt === 'post') {
        // pre/post quiz attached at topic level even if subtopic is set
        const q = makeQuestion(r, rowNum);
        if (q) {
          if (qt === 'pre') {
            topic.preEvaluationQuiz = topic.preEvaluationQuiz ?? [];
            topic.preEvaluationQuiz.push(q);
          } else {
            topic.postEvaluationQuiz = topic.postEvaluationQuiz ?? [];
            topic.postEvaluationQuiz.push(q);
          }
        }
      } else if (qt === 'subtopic' || qt === 'quiz' || qt === '') {
        if (r.question_text) {
          const q = makeQuestion(r, rowNum);
          if (q) {
            sub.quizzes = sub.quizzes ?? [];
            sub.quizzes.push(q);
          }
        }
      }
    }

    ctx = r;
  }

  // Remove topics / standards with no content (only if they were created fresh)
  for (const std of result) {
    for (const cls of std.classes) {
      cls.curriculum.sort((a, b) => a.sequence - b.sequence);
    }
  }

  return { standards: result, errors, warnings, rowCount: rows.length - 1 };
}

// ─── Level-specific parsers ───────────────────────────────────────────────────

/** Context required when importing at a scope below "full". */
export interface LevelContext {
  standardId?: string;
  standardName?: string;
  classId?: string;
  className?: string;
  topicId?: string;
  topicTitle?: string;
  subtopicId?: string;
  subtopicTitle?: string;
}

export type LevelParseTarget =
  | 'topics'        // columns: topic_title, topic_sequence
  | 'subtopics'     // columns: subtopic_title, subtopic_video
  | 'prerequisites' // columns: prereq_title, prereq_category
  | 'questions';    // columns: question_text, question_type, option_a-d, correct_answer, explanation, difficulty

export interface LevelParseResult {
  items: any[];
  errors: ParseError[];
  warnings: string[];
  rowCount: number;
  /** Parsed rows in raw form — used for the row-selection preview table. */
  rows: Record<string, string>[];
}

// ─── Editable-row helpers (Admin staged import) ───────────────────────────────

export type LevelRowError = { index: number; column: string; message: string };

/** Matches admin QuizForm / bulk question API */
export type ApiQuestionType = "mcq" | "true_false" | "text" | "image_upload";

export function normalizeQuestionType(raw: string): ApiQuestionType | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (!s) return null;
  if (["mcq", "multiple_choice", "choice"].includes(s)) return "mcq";
  if (["true_false", "boolean", "bool", "tf", "t_f", "truefalse", "t/f"].includes(s)) return "true_false";
  if (["text", "short_answer", "shortanswer", "subjective"].includes(s)) return "text";
  if (["image_upload", "image", "upload", "photo", "handwritten"].includes(s)) return "image_upload";
  return null;
}

export function normalizeDifficulty(raw: string): "Easy" | "Medium" | "Hard" | null {
  const s = raw.trim();
  if (!s) return null;
  if (["Easy", "Medium", "Hard"].includes(s)) return s as "Easy" | "Medium" | "Hard";
  const l = s.toLowerCase();
  if (l === "easy") return "Easy";
  if (l === "medium") return "Medium";
  if (l === "hard") return "Hard";
  return null;
}

export function normalizePrereqCategory(raw: string): "Major" | "Intermediate" | "Minor" | null {
  const s = raw.trim();
  if (!s) return null;
  if (["Major", "Intermediate", "Minor"].includes(s)) return s as "Major" | "Intermediate" | "Minor";
  const l = s.toLowerCase();
  if (l === "major") return "Major";
  if (l === "intermediate") return "Intermediate";
  if (l === "minor") return "Minor";
  return null;
}

/** Dropdown options for the import grid (value = stored cell value). */
export const QUESTION_TYPE_SELECT_OPTIONS: { value: ApiQuestionType; label: string }[] = [
  { value: "mcq", label: "Multiple choice (MCQ)" },
  { value: "true_false", label: "True / False" },
  { value: "text", label: "Short answer" },
  { value: "image_upload", label: "Image upload (student photo)" },
];

export const DIFFICULTY_SELECT_OPTIONS: { value: "Easy" | "Medium" | "Hard"; label: string }[] = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

export const PREREQ_CATEGORY_SELECT_OPTIONS: { value: "Major" | "Intermediate" | "Minor"; label: string }[] = [
  { value: "Major", label: "Major" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Minor", label: "Minor" },
];

/** Normalize pasted values so the grid shows canonical enums. */
export function normalizeEditableRowCells(target: LevelParseTarget, cells: Record<string, string>): Record<string, string> {
  const out = { ...cells };
  if (target === "questions") {
    const qt = out.question_type?.trim();
    if (qt) {
      const n = normalizeQuestionType(qt);
      if (n) out.question_type = n;
    }
    const diff = out.difficulty?.trim();
    if (diff) {
      const n = normalizeDifficulty(diff);
      if (n) out.difficulty = n;
    }
  } else if (target === "prerequisites") {
    const cat = out.prereq_category?.trim();
    if (cat) {
      const n = normalizePrereqCategory(cat);
      if (n) out.prereq_category = n;
    }
  }
  return out;
}

export function getLevelEditorColumns(target: LevelParseTarget): string[] {
  switch (target) {
    case "topics":
      return ["topic_title", "topic_sequence"];
    case "subtopics":
      return ["subtopic_title", "subtopic_video"];
    case "prerequisites":
      return ["prereq_title", "prereq_category"];
    case "questions":
      return [
        "question_text",
        "image_url",
        "question_type",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_answer",
        "alternative_answers",
        "grading_guidance",
        "explanation",
        "difficulty",
      ];
  }
}

/** How to edit a cell in the import grid */
export type LevelCellEditor =
  | { kind: "text" }
  | { kind: "select"; options: { value: string; label: string }[]; placeholder?: string };

export function getLevelCellEditor(target: LevelParseTarget, column: string, cells: Record<string, string>): LevelCellEditor {
  if (target === "prerequisites" && column === "prereq_category") {
    return {
      kind: "select",
      placeholder: "Category…",
      options: [{ value: "", label: "— Default: Minor —" }, ...PREREQ_CATEGORY_SELECT_OPTIONS],
    };
  }
  if (target === "questions" && column === "question_type") {
    return {
      kind: "select",
      placeholder: "Type…",
      options: [{ value: "", label: "— Default: MCQ —" }, ...QUESTION_TYPE_SELECT_OPTIONS],
    };
  }
  if (target === "questions" && column === "difficulty") {
    return {
      kind: "select",
      placeholder: "Difficulty…",
      options: [{ value: "", label: "— Default: Medium —" }, ...DIFFICULTY_SELECT_OPTIONS],
    };
  }
  if (target === "questions" && column === "correct_answer") {
    const t = normalizeQuestionType(cells.question_type ?? "") ?? "mcq";
    if (t === "true_false") {
      return {
        kind: "select",
        placeholder: "Correct…",
        options: [
          { value: "", label: "— Select —" },
          { value: "True", label: "True" },
          { value: "False", label: "False" },
        ],
      };
    }
    if (t === "mcq") {
      const opts = ["option_a", "option_b", "option_c", "option_d"].map((k) => (cells[k] ?? "").trim()).filter(Boolean);
      if (opts.length >= 2) {
        return {
          kind: "select",
          placeholder: "Correct option…",
          options: [{ value: "", label: "— Select —" }, ...opts.map((v) => ({ value: v, label: v.length > 48 ? `${v.slice(0, 45)}…` : v }))],
        };
      }
    }
  }
  return { kind: "text" };
}

export function validateLevelRows(rows: Record<string, string>[], target: LevelParseTarget): {
  rowErrors: LevelRowError[];
  validIndices: number[];
} {
  const rowErrors: LevelRowError[] = [];
  const validIndices: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? {};
    const errs: LevelRowError[] = [];

    const get = (k: string) => (r[k] ?? "").trim();

    if (target === "topics") {
      const title = get("topic_title");
      if (!title) errs.push({ index: i, column: "topic_title", message: "topic_title is required." });
      const seqRaw = get("topic_sequence");
      if (seqRaw && !Number.isFinite(Number(seqRaw))) errs.push({ index: i, column: "topic_sequence", message: "topic_sequence must be a number." });

    } else if (target === "subtopics") {
      const title = get("subtopic_title");
      if (!title) errs.push({ index: i, column: "subtopic_title", message: "subtopic_title is required." });
      const video = get("subtopic_video");
      if (video) {
        try { new URL(video); } catch { errs.push({ index: i, column: "subtopic_video", message: "subtopic_video must be a valid URL." }); }
      }

    } else if (target === "prerequisites") {
      const title = get("prereq_title");
      if (!title) errs.push({ index: i, column: "prereq_title", message: "prereq_title is required." });
      const cat = get("prereq_category");
      if (cat && !normalizePrereqCategory(cat)) {
        errs.push({ index: i, column: "prereq_category", message: "prereq_category must be Major, Intermediate, or Minor." });
      }

    } else if (target === "questions") {
      const text = get("question_text");
      if (!text) errs.push({ index: i, column: "question_text", message: "question_text is required." });

      const typeRaw = get("question_type");
      if (typeRaw && !normalizeQuestionType(typeRaw)) {
        errs.push({ index: i, column: "question_type", message: "Unknown question_type (use mcq, true_false, text, or image_upload)." });
      }
      const qType: ApiQuestionType = normalizeQuestionType(typeRaw) ?? "mcq";

      const diffRaw = get("difficulty");
      if (diffRaw && !normalizeDifficulty(diffRaw)) {
        errs.push({ index: i, column: "difficulty", message: "difficulty must be Easy, Medium, or Hard." });
      }

      const imageUrl = get("image_url");
      if (imageUrl) {
        try {
          new URL(imageUrl);
        } catch {
          errs.push({ index: i, column: "image_url", message: "image_url must be a valid URL." });
        }
      }

      const correct = get("correct_answer");
      if (qType === "mcq") {
        const options = [get("option_a"), get("option_b"), get("option_c"), get("option_d")].filter(Boolean);
        if (options.length < 2) errs.push({ index: i, column: "option_a", message: "MCQ needs at least option_a and option_b." });
        if (!correct) errs.push({ index: i, column: "correct_answer", message: "correct_answer is required for MCQ." });
        if (correct && options.length >= 2 && !options.includes(correct)) {
          errs.push({ index: i, column: "correct_answer", message: `correct_answer must exactly match one of the options.` });
        }
      } else if (qType === "true_false") {
        if (!correct) errs.push({ index: i, column: "correct_answer", message: 'True/False requires correct_answer "True" or "False".' });
        else if (!["True", "False"].includes(correct)) {
          errs.push({ index: i, column: "correct_answer", message: 'correct_answer must be exactly "True" or "False".' });
        }
      } else if (qType === "text") {
        if (!correct) errs.push({ index: i, column: "correct_answer", message: "Accepted answer is required for short answer questions." });
      } else if (qType === "image_upload") {
        // Optional model answer / rubric hint; image on stem is optional
      }
    }

    rowErrors.push(...errs);
    if (errs.length === 0) validIndices.push(i);
  }

  return { rowErrors, validIndices };
}

export function rowsToItems(rows: Record<string, string>[], target: LevelParseTarget): any[] {
  const get = (r: Record<string, string>, k: string) => (r[k] ?? "").trim();

  if (target === "topics") {
    return rows.map((r, i) => ({
      title: get(r, "topic_title"),
      sequence: parseInt(get(r, "topic_sequence")) || (i + 1),
    }));
  }

  if (target === "subtopics") {
    return rows.map((r) => ({
      title: get(r, "subtopic_title"),
      videoUrl: get(r, "subtopic_video") || undefined,
    }));
  }

  if (target === "prerequisites") {
    return rows.map((r) => ({
      title: get(r, "prereq_title"),
      category: normalizePrereqCategory(get(r, "prereq_category")) ?? "Minor",
    }));
  }

  // questions — aligned with QuizForm + POST /api/admin/questions/bulk
  return rows.map((r) => {
    const qType: ApiQuestionType = normalizeQuestionType(get(r, "question_type")) ?? "mcq";
    const difficulty = normalizeDifficulty(get(r, "difficulty")) ?? "Medium";
    const explanation = get(r, "explanation");
    const correct = get(r, "correct_answer");
    const imageUrl = get(r, "image_url") || null;

    let options: string[] | null | undefined;
    if (qType === "mcq") {
      options = [get(r, "option_a"), get(r, "option_b"), get(r, "option_c"), get(r, "option_d")].filter(Boolean);
    } else if (qType === "true_false") {
      options = ["True", "False"];
    } else {
      options = null;
    }

    const alternativeAnswers = qType === "text"
      ? parseAlternativeAnswersFromCsv(get(r, "alternative_answers"))
      : [];

    const gradingGuidance =
      qType === "text" || qType === "image_upload"
        ? get(r, "grading_guidance") || undefined
        : undefined;

    return {
      id: uid(),
      text: get(r, "question_text"),
      type: qType,
      imageUrl: imageUrl || null,
      options,
      correctAnswer: qType === "image_upload" ? (correct || null) : correct || null,
      alternativeAnswers,
      gradingGuidance,
      explanation,
      difficulty,
    };
  });
}

/** Parse a TSV or CSV pasted from Excel for the given target level. */
export function parseLevelData(
  rawText: string,
  target: LevelParseTarget,
): LevelParseResult {
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  // Detect separator: if row contains tabs, treat as TSV; else CSV
  const firstLine = rawText.split('\n')[0] ?? '';
  const sep = firstLine.includes('\t') ? '\t' : ',';

  // Tokenise using separator
  const tokenise = (raw: string): string[][] => {
    const lines: string[][] = [];
    const rows = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    for (const line of rows) {
      if (line.trim() === '') continue;
      if (sep === '\t') {
        lines.push(line.split('\t').map(c => c.trim()));
      } else {
        // reuse full CSV tokeniser for comma-sep
        const cells: string[] = [];
        let inQuote = false, cur = '';
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuote = !inQuote;
          } else if (ch === ',' && !inQuote) { cells.push(cur); cur = ''; }
          else cur += ch;
        }
        cells.push(cur);
        lines.push(cells.map(c => c.trim()));
      }
    }
    return lines;
  };

  const allRows = tokenise(rawText);
  if (allRows.length === 0) {
    errors.push({ row: 0, column: '', message: 'No data found.' });
    return { items: [], errors, warnings, rowCount: 0, rows: [] };
  }

  // Auto-detect headers: if first cell of first row resembles a column name, treat as header
  const KNOWN = new Set<string>([
    'topic_title', 'topic_sequence', 'title', 'sequence',
    'subtopic_title', 'subtopic_video', 'video', 'video_url',
    'prereq_title', 'prereq_category', 'category',
    'question_text', 'question', 'text',
    'image_url', 'imageurl', 'diagram_url', 'question_image',
    'question_type', 'type',
    'option_a', 'option_b', 'option_c', 'option_d',
    'a', 'b', 'c', 'd',
    'correct_answer', 'answer', 'correct',
    'alternative_answers', 'alternate_answers',
    'grading_guidance', 'ai_grading_guidance', 'grading_notes', 'ai_instruction', 'ai_evaluation_guidance',
    'explanation',
    'difficulty',
  ]);

  const firstCellLower = allRows[0][0].toLowerCase().replace(/\s+/g, '_');
  const hasHeaders = KNOWN.has(firstCellLower);

  let headers: string[];
  let dataRows: string[][];
  if (hasHeaders) {
    headers = allRows[0].map(h => normaliseHeader(h));
    dataRows = allRows.slice(1);
  } else {
    // No header row — assign positional defaults per target
    dataRows = allRows;
    switch (target) {
      case 'topics':
        headers = ['topic_title', 'topic_sequence'];
        break;
      case 'subtopics':
        headers = ['subtopic_title', 'subtopic_video'];
        break;
      case 'prerequisites':
        headers = ['prereq_title', 'prereq_category'];
        break;
      case 'questions': {
        const firstRowLen = dataRows[0]?.length ?? 0;
        // Legacy headerless paste (9 cols): no image_url column
        if (firstRowLen === 9) {
          headers = [
            'question_text', 'question_type', 'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'explanation', 'difficulty',
          ];
        } else {
          headers = [
            'question_text', 'image_url', 'question_type',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'explanation', 'difficulty',
          ];
        }
        break;
      }
    }
  }

  // Alias map: allow friendly column names
  const ALIAS: Record<string, string> = {
    title: 'topic_title', sequence: 'topic_sequence',
    video: 'subtopic_video', video_url: 'subtopic_video',
    question: 'question_text', text: 'question_text',
    imageurl: 'image_url', diagram_url: 'image_url', question_image: 'image_url',
    type: 'question_type',
    a: 'option_a', b: 'option_b', c: 'option_c', d: 'option_d',
    answer: 'correct_answer', correct: 'correct_answer',
    alternate_answers: 'alternative_answers',
    ai_grading_guidance: 'grading_guidance',
    grading_notes: 'grading_guidance',
    ai_instruction: 'grading_guidance',
    ai_evaluation_guidance: 'grading_guidance',
  };
  headers = headers.map(h => ALIAS[h] ?? h);

  const getCell = (cells: string[], name: string): string => {
    const i = headers.indexOf(name);
    return i >= 0 ? (cells[i] ?? '').trim() : '';
  };

  const parsedRows: Record<string, string>[] = [];
  const items: any[] = [];

  for (let ri = 0; ri < dataRows.length; ri++) {
    const cells = dataRows[ri];
    const rowNum = (hasHeaders ? ri + 2 : ri + 1);
    const rowRecord: Record<string, string> = {};
    headers.forEach((h, i) => { rowRecord[h] = (cells[i] ?? '').trim(); });
    parsedRows.push(rowRecord);

    if (target === 'topics') {
      const title = getCell(cells, 'topic_title');
      if (!title) { errors.push({ row: rowNum, column: 'topic_title', message: 'topic_title is required.' }); continue; }
      const seq = parseInt(getCell(cells, 'topic_sequence')) || (ri + 1);
      items.push({ title, sequence: seq });

    } else if (target === 'subtopics') {
      const title = getCell(cells, 'subtopic_title');
      if (!title) { errors.push({ row: rowNum, column: 'subtopic_title', message: 'subtopic_title is required.' }); continue; }
      const video = getCell(cells, 'subtopic_video');
      items.push({ title, videoUrl: video || undefined });

    } else if (target === 'prerequisites') {
      const title = getCell(cells, 'prereq_title');
      if (!title) { errors.push({ row: rowNum, column: 'prereq_title', message: 'prereq_title is required.' }); continue; }
      const cat = getCell(cells, 'prereq_category');
      const category = (['Major', 'Intermediate', 'Minor'].includes(cat) ? cat : 'Minor') as 'Major' | 'Intermediate' | 'Minor';
      items.push({ title, category });

    } else if (target === 'questions') {
      const text = getCell(cells, 'question_text');
      if (!text) { errors.push({ row: rowNum, column: 'question_text', message: 'question_text is required.' }); continue; }

      const typeCell = getCell(cells, 'question_type');
      if (typeCell && !normalizeQuestionType(typeCell)) {
        errors.push({ row: rowNum, column: 'question_type', message: 'Unknown question_type (mcq, true_false, text, image_upload).' });
        continue;
      }
      const qType: ApiQuestionType = normalizeQuestionType(typeCell) ?? 'mcq';

      const diffCell = getCell(cells, 'difficulty');
      if (diffCell && !normalizeDifficulty(diffCell)) {
        errors.push({ row: rowNum, column: 'difficulty', message: 'difficulty must be Easy, Medium, or Hard.' });
        continue;
      }
      const difficulty = normalizeDifficulty(diffCell) ?? 'Medium';

      const explanation = getCell(cells, 'explanation');
      const correct = getCell(cells, 'correct_answer');
      const imageUrl = getCell(cells, 'image_url');
      if (imageUrl) {
        try {
          new URL(imageUrl);
        } catch {
          errors.push({ row: rowNum, column: 'image_url', message: 'image_url must be a valid URL.' });
          continue;
        }
      }

      let options: string[] | null | undefined;
      if (qType === 'mcq') {
        options = [
          getCell(cells, 'option_a'),
          getCell(cells, 'option_b'),
          getCell(cells, 'option_c'),
          getCell(cells, 'option_d'),
        ].filter(Boolean);
        if (options.length < 2) { errors.push({ row: rowNum, column: 'option_a', message: 'MCQ needs at least option_a and option_b.' }); continue; }
        if (!correct) { errors.push({ row: rowNum, column: 'correct_answer', message: 'correct_answer is required for MCQ.' }); continue; }
        if (!options.includes(correct)) { errors.push({ row: rowNum, column: 'correct_answer', message: 'correct_answer must exactly match one of the options.' }); continue; }
      } else if (qType === 'true_false') {
        options = ['True', 'False'];
        if (!['True', 'False'].includes(correct)) { errors.push({ row: rowNum, column: 'correct_answer', message: 'True/False requires correct_answer "True" or "False".' }); continue; }
      } else if (qType === 'text') {
        options = null;
        if (!correct) { errors.push({ row: rowNum, column: 'correct_answer', message: 'Accepted answer is required for short answer.' }); continue; }
      } else {
        options = null;
      }

      const alternativeAnswers = qType === 'text'
        ? parseAlternativeAnswersFromCsv(getCell(cells, 'alternative_answers'))
        : [];

      const gradingGuidance =
        qType === 'text' || qType === 'image_upload'
          ? getCell(cells, 'grading_guidance') || undefined
          : undefined;

      items.push({
        id: uid(),
        text,
        type: qType,
        imageUrl: imageUrl || null,
        options: options ?? null,
        correctAnswer: qType === 'image_upload' ? (correct || null) : correct,
        alternativeAnswers,
        gradingGuidance,
        explanation,
        difficulty,
      });
    }
  }

  return { items, errors, warnings, rowCount: dataRows.length, rows: parsedRows };
}

/** Generate a minimal template CSV/TSV for the given target level. */
export function generateLevelTemplateCSV(target: LevelParseTarget): string {
  switch (target) {
    case 'topics':
      return [
        'topic_title,topic_sequence',
        'Algebraic Expressions,1',
        'Linear Equations,2',
        'Quadratic Equations,3',
      ].join('\n');
    case 'subtopics':
      return [
        'subtopic_title,subtopic_video',
        'Introduction to Polynomials,https://youtube.com/watch?v=example1',
        'Adding Polynomials,https://youtube.com/watch?v=example2',
        'Multiplying Polynomials,',
      ].join('\n');
    case 'prerequisites':
      return [
        'prereq_title,prereq_category',
        'Basic Arithmetic,Major',
        'Understanding Variables,Intermediate',
        'Number Systems,Minor',
      ].join('\n');
    case 'questions':
      return [
        'question_text,image_url,question_type,option_a,option_b,option_c,option_d,correct_answer,alternative_answers,grading_guidance,explanation,difficulty',
        'What is 5 + 3 × 2?,,mcq,16,11,10,13,11,,,"BODMAS: multiply first → 3×2=6 → 5+6=11",Easy',
        'Is 4x a monomial?,,true_false,,,,,True,,,"A monomial has exactly one term.",Easy',
        'Simplify 2x + 3x,,mcq,5x,6x,x,5x²,5x,,,"Combine like terms: coefficients 2+3=5.",Medium',
        'What is -2/9 as a fraction?,,text,,,,,-2/9,,,"Equivalent fraction forms are auto-accepted.",Easy',
        'Name the degree of a quadratic.,,text,,,,,2,"second degree|degree 2","Accept phrases mentioning second degree.",Easy',
        'Show your work for ∫ x dx,,image_upload,,,,,,,"Student must show integration steps clearly.",Medium',
      ].join('\n');
  }
}

/** Column documentation per target level — shown in the panel's guide tab. */
export interface LevelColumnDoc {
  name: string;
  required: boolean;
  description: string;
  example: string;
  allowedValues?: string;
}

export const LEVEL_COLUMN_DOCS: Record<LevelParseTarget, LevelColumnDoc[]> = {
  topics: [
    { name: 'topic_title', required: true,  description: 'Name of the topic.', example: 'Algebraic Expressions' },
    { name: 'topic_sequence', required: false, description: 'Display order (integer). Defaults to row order.', example: '1' },
  ],
  subtopics: [
    { name: 'subtopic_title', required: true,  description: 'Name of the sub-topic.', example: 'Introduction to Polynomials' },
    { name: 'subtopic_video', required: false, description: 'Full YouTube URL for the lesson video.', example: 'https://youtube.com/watch?v=...' },
  ],
  prerequisites: [
    { name: 'prereq_title',    required: true,  description: 'Name of the prerequisite topic.', example: 'Basic Arithmetic' },
    { name: 'prereq_category', required: false, description: 'Importance level.', allowedValues: 'Major | Intermediate | Minor', example: 'Major' },
  ],
  questions: [
    { name: 'question_text',   required: true,  description: 'The question body (supports $math$).', example: 'What is 2 + 2?' },
    { name: 'image_url',       required: false, description: 'Optional image URL shown with the question (diagram / formula).', example: 'https://...' },
    { name: 'question_type',   required: false, description: 'Same types as Add Question in admin.', allowedValues: 'mcq | true_false | text | image_upload', example: 'mcq' },
    { name: 'option_a',        required: false, description: 'First MCQ choice.', example: '4' },
    { name: 'option_b',        required: false, description: 'Second MCQ choice.', example: '3' },
    { name: 'option_c',        required: false, description: 'Third MCQ choice (optional).', example: '5' },
    { name: 'option_d',        required: false, description: 'Fourth MCQ choice (optional).', example: '6' },
    { name: 'correct_answer',  required: false, description: 'For MCQ: must match an option exactly. For True/False: True or False. For text: primary accepted answer. For image_upload: optional rubric note.', example: '4' },
    { name: 'alternative_answers', required: false, description: 'Text questions only: comma- or pipe-separated extras for auto-matching (optional for equivalent fractions — Tier 1 handles those).', example: 'second degree|degree 2' },
    { name: 'grading_guidance', required: false, description: 'Text/image_upload: optional AI rubric when auto-matching cannot decide.', example: "Accept '2' or phrases mentioning second degree." },
    { name: 'explanation',     required: false, description: 'Explanation shown after answering.', example: 'Because 2+2 equals 4.' },
    { name: 'difficulty',      required: false, description: 'Difficulty level.', allowedValues: 'Easy | Medium | Hard', example: 'Easy' },
  ],
};

// ─── Template generator ───────────────────────────────────────────────────────

export function generateTemplateCSV(level: ImportLevel = 'full'): string {
  const headers = [...FULL_TEMPLATE_HEADERS];

  const quote = (s: string) => (s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s);
  const row = (cells: string[]) => {
    while (cells.length < headers.length) cells.push('');
    return cells.slice(0, headers.length).map(quote).join(',');
  };

  const headerRow = row([...headers]);
  const blank = (n: number) => Array(n).fill('');

  // One row per question type + hierarchy setup row
  const sampleRows = [
    // Topic + full hierarchy metadata (no question)
    row([
      'Grade 9', 'Grade 9 mathematics curriculum',
      'Section A', '60',
      'Algebraic Expressions', '1', 'Intro to algebra and polynomials', '60',
      ...blank(5),
      'Introduction to Polynomials', 'https://youtube.com/watch?v=example', '1', '60',
      ...blank(12),
    ]),
    // Prerequisite
    row([
      ...blank(8),
      'Basic Arithmetic', 'Major', 'Students must know addition and multiplication', '60', '3',
      ...blank(16),
    ]),
    // MCQ — subtopic quiz
    row([
      ...blank(17),
      'subtopic', 'What is 5 + 3 × 2?', '', 'mcq', '16', '11', '10', '13', '11', '', '', 'BODMAS: multiply first', 'Easy',
    ]),
    // true_false — pre-evaluation
    row([
      ...blank(17),
      'pre', 'Is 4x a monomial?', '', 'true_false', '', '', '', '', 'True', '', '', 'A monomial has exactly one term.', 'Easy',
    ]),
    // text — final test
    row([
      ...blank(17),
      'post', 'Simplify 2x + 3x', '', 'text', '', '', '', '', '5x', '5*x', '', 'Combine like terms: 2+3=5.', 'Medium',
    ]),
    // image_upload — subtopic quiz with stem diagram
    row([
      ...blank(17),
      'subtopic', 'Label the parts of the polynomial diagram', 'https://example.com/diagram.png', 'image_upload',
      '', '', '', '', '', '', 'Student must label all parts clearly in the photo.', 'Upload a clear photo of your labelled diagram.', 'Medium',
    ]),
    // Second subtopic (inherits topic context)
    row([
      ...blank(13),
      'Multiplying Polynomials', 'https://youtube.com/watch?v=example2', '2', '65',
      ...blank(12),
    ]),
  ];

  return [headerRow, ...sampleRows].join('\n');
}

// ─── column reference for the UI ─────────────────────────────────────────────

export interface ColumnDoc {
  name: string;
  required: boolean;
  description: string;
  allowedValues?: string;
  example: string;
}

export const COLUMN_DOCS: ColumnDoc[] = [
  { name: 'standard_name', required: true, description: 'Name of the educational standard / grade.', example: 'Grade 9' },
  { name: 'standard_description', required: false, description: 'Optional description for the standard.', example: 'Grade 9 mathematics curriculum' },
  { name: 'section_name', required: true, description: 'Name of the class/section within the standard.', example: 'Section A' },
  { name: 'class_passing_threshold', required: false, description: 'Passing percentage for the class (0–100). Default: 60.', example: '60' },
  { name: 'topic_title', required: false, description: 'Name of the curriculum topic. Required to add subtopics/questions/prerequisites.', example: 'Algebraic Expressions' },
  { name: 'topic_sequence', required: false, description: 'Display order of the topic (integer). Defaults to row order.', example: '1' },
  { name: 'topic_description', required: false, description: 'Optional description for the topic.', example: 'Intro to algebra and polynomials' },
  { name: 'final_test_threshold', required: false, description: 'Passing percentage for the topic final test (0–100). Default: 60.', example: '60' },
  { name: 'prereq_title', required: false, description: 'Prerequisite name to add to the current topic.', example: 'Basic Arithmetic' },
  { name: 'prereq_category', required: false, description: 'Importance level (stored for reference; not in Firestore).', allowedValues: 'Major | Intermediate | Minor', example: 'Major' },
  { name: 'prereq_description', required: false, description: 'Description for the prerequisite.', example: 'Students must know basic operations' },
  { name: 'prereq_passing_threshold', required: false, description: 'Passing percentage for the prerequisite quiz (0–100). Default: 60.', example: '60' },
  { name: 'prereq_max_ai_attempts', required: false, description: 'Max AI tutor attempts allowed (1–10). Default: 3.', example: '3' },
  { name: 'subtopic_title', required: false, description: 'Name of the sub-topic inside the topic.', example: 'Introduction to Polynomials' },
  { name: 'subtopic_video', required: false, description: 'Full YouTube URL for the sub-topic lesson video.', example: 'https://youtube.com/watch?v=...' },
  { name: 'subtopic_order', required: false, description: 'Display order of the sub-topic. Default: auto-increment.', example: '1' },
  { name: 'subtopic_passing_threshold', required: false, description: 'Passing percentage for the sub-topic quiz (0–100). Default: 60.', example: '60' },
  { name: 'quiz_type', required: false, description: 'Where to attach the question.', allowedValues: 'subtopic | pre | post', example: 'subtopic' },
  { name: 'question_text', required: false, description: 'The question body (supports $math$).', example: 'What is 2 + 2?' },
  { name: 'image_url', required: false, description: 'Optional image URL shown with the question (diagram / formula).', example: 'https://example.com/diagram.png' },
  { name: 'question_type', required: false, description: 'Question format. "boolean" in CSV is accepted as alias for true_false.', allowedValues: 'mcq | true_false | text | image_upload', example: 'mcq' },
  { name: 'option_a', required: false, description: 'First MCQ choice.', example: '4' },
  { name: 'option_b', required: false, description: 'Second MCQ choice.', example: '3' },
  { name: 'option_c', required: false, description: 'Third MCQ choice (optional).', example: '5' },
  { name: 'option_d', required: false, description: 'Fourth MCQ choice (optional).', example: '6' },
  { name: 'correct_answer', required: false, description: 'MCQ: must exactly match an option. true_false: True or False. text: primary accepted answer. image_upload: optional rubric note.', example: '4' },
  { name: 'alternative_answers', required: false, description: 'Text questions only: comma- or pipe-separated extras for auto-matching (optional for equivalent fractions).', example: 'second degree|degree 2' },
  { name: 'grading_guidance', required: false, description: 'Text/image_upload: optional AI rubric when auto-matching cannot decide.', example: "Accept '2' or phrases mentioning second degree." },
  { name: 'explanation', required: false, description: 'Explanation shown after answering.', example: 'Because 2+2 equals 4.' },
  { name: 'difficulty', required: false, description: 'Difficulty level.', allowedValues: 'Easy | Medium | Hard', example: 'Easy' },
];
