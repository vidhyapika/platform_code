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
 *   question_type         "mcq" | "boolean" | "text"  (default: mcq)
 *   option_a … option_d   MCQ options (optional for boolean/text)
 *   correct_answer        must match one of the options exactly (or "True"/"False")
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
  section_name: string;
  topic_title: string;
  topic_sequence: string;
  prereq_title: string;
  prereq_category: string;
  subtopic_title: string;
  subtopic_video: string;
  quiz_type: string;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  difficulty: string;
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

const KNOWN_COLUMNS = [
  'standard_name', 'section_name',
  'topic_title', 'topic_sequence',
  'prereq_title', 'prereq_category',
  'subtopic_title', 'subtopic_video',
  'quiz_type', 'question_text', 'question_type',
  'option_a', 'option_b', 'option_c', 'option_d',
  'correct_answer', 'explanation', 'difficulty',
];

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
  let ctx: RawRow = {
    rowIndex: 0,
    standard_name: '', section_name: '',
    topic_title: '', topic_sequence: '',
    prereq_title: '', prereq_category: '',
    subtopic_title: '', subtopic_video: '',
    quiz_type: '', question_text: '', question_type: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: '', explanation: '', difficulty: '',
  };

  // ── Helper: find-or-create a node in `result` ─────────────────────────────
  const findOrCreateStandard = (name: string): Standard => {
    let std = result.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!std) {
      std = { id: deterministicId('std', name), name, classes: [] };
      result.push(std);
    }
    return std;
  };

  const findOrCreateClass = (std: Standard, name: string): CurriculumClass => {
    let cls = std.classes.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!cls) {
      cls = { id: deterministicId('cls', std.name, name), name, curriculum: [] };
      std.classes.push(cls);
    }
    return cls;
  };

  const findOrCreateTopic = (cls: CurriculumClass, title: string, sequence: number): Topic => {
    let topic = cls.curriculum.find(t => t.title.toLowerCase() === title.toLowerCase());
    if (!topic) {
      topic = {
        id: deterministicId('top', title),
        title,
        sequence,
        subTopics: [],
        prerequisites: [],
        preEvaluationQuiz: [],
        postEvaluationQuiz: [],
      };
      cls.curriculum.push(topic);
    }
    return topic;
  };

  const findOrCreateSubTopic = (topic: Topic, title: string, video: string): SubTopic => {
    let sub = topic.subTopics.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (!sub) {
      sub = { id: deterministicId('sub', title), title, videoUrl: video, quizzes: [] };
      topic.subTopics.push(sub);
    } else if (video && !sub.videoUrl) {
      sub.videoUrl = video;
    }
    return sub;
  };

  const makeQuestion = (r: RawRow, rowNum: number): Question | null => {
    if (!r.question_text) return null;

    const qType = (['mcq', 'boolean', 'text'].includes(r.question_type) ? r.question_type : 'mcq') as 'mcq' | 'boolean' | 'text';
    const difficulty = (['Easy', 'Medium', 'Hard'].includes(r.difficulty) ? r.difficulty : 'Medium') as 'Easy' | 'Medium' | 'Hard';
    let options: string[] | undefined;

    if (qType === 'mcq') {
      options = [r.option_a, r.option_b, r.option_c, r.option_d].filter(Boolean);
      if (options.length < 2) {
        errors.push({ row: rowNum, column: 'option_a', message: 'MCQ questions need at least option_a and option_b.' });
        return null;
      }
      if (!r.correct_answer) {
        errors.push({ row: rowNum, column: 'correct_answer', message: 'MCQ questions require correct_answer.' });
        return null;
      }
      if (!options.includes(r.correct_answer)) {
        errors.push({ row: rowNum, column: 'correct_answer', message: `correct_answer "${r.correct_answer}" does not match any option.` });
        return null;
      }
    } else if (qType === 'boolean') {
      options = ['True', 'False'];
      if (!['True', 'False'].includes(r.correct_answer)) {
        errors.push({ row: rowNum, column: 'correct_answer', message: 'Boolean questions require correct_answer "True" or "False".' });
        return null;
      }
    }

    return {
      id: uid(),
      text: r.question_text,
      type: qType,
      options,
      correctAnswer: r.correct_answer,
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
      section_name:    cascade('section_name'),
      topic_title:     cascade('topic_title'),
      topic_sequence:  cascade('topic_sequence'),
      prereq_title:    get(cells, 'prereq_title'),    // don't cascade – unique per row
      prereq_category: get(cells, 'prereq_category'),
      subtopic_title:  cascade('subtopic_title'),
      subtopic_video:  cascade('subtopic_video'),
      quiz_type:       cascade('quiz_type'),
      question_text:   get(cells, 'question_text'),    // unique per row
      question_type:   cascade('question_type'),
      option_a:        get(cells, 'option_a'),
      option_b:        get(cells, 'option_b'),
      option_c:        get(cells, 'option_c'),
      option_d:        get(cells, 'option_d'),
      correct_answer:  get(cells, 'correct_answer'),
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

    const std = findOrCreateStandard(r.standard_name);
    const cls = findOrCreateClass(std, r.section_name);

    // ── Topic ──────────────────────────────────────────────────────────────
    if (!r.topic_title) {
      if (r.prereq_title || r.subtopic_title || r.question_text) {
        errors.push({ row: rowNum, column: 'topic_title', message: 'topic_title is required to add subtopics/questions/prerequisites.' });
      }
      ctx = r;
      continue;
    }

    const topicSeq = parseInt(r.topic_sequence) || defaultSequence++;
    const topic = findOrCreateTopic(cls, r.topic_title, topicSeq);

    // ── Prerequisite ──────────────────────────────────────────────────────
    if (r.prereq_title) {
      const alreadyExists = topic.prerequisites?.some(p => p.title.toLowerCase() === r.prereq_title.toLowerCase());
      if (!alreadyExists) {
        const category = (['Major', 'Intermediate', 'Minor'].includes(r.prereq_category)
          ? r.prereq_category
          : 'Minor') as 'Major' | 'Intermediate' | 'Minor';
        topic.prerequisites = topic.prerequisites ?? [];
        topic.prerequisites.push({ id: uid(), title: r.prereq_title, category });
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
      const sub = findOrCreateSubTopic(topic, r.subtopic_title, r.subtopic_video);

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
    'question_type', 'type',
    'option_a', 'option_b', 'option_c', 'option_d',
    'a', 'b', 'c', 'd',
    'correct_answer', 'answer', 'correct',
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
      case 'questions':
        headers = ['question_text', 'question_type', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'difficulty'];
        break;
    }
  }

  // Alias map: allow friendly column names
  const ALIAS: Record<string, string> = {
    title: 'topic_title', sequence: 'topic_sequence',
    video: 'subtopic_video', video_url: 'subtopic_video',
    question: 'question_text', text: 'question_text',
    type: 'question_type',
    a: 'option_a', b: 'option_b', c: 'option_c', d: 'option_d',
    answer: 'correct_answer', correct: 'correct_answer',
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
      const rawType = getCell(cells, 'question_type');
      const qType = (['mcq', 'boolean', 'text'].includes(rawType) ? rawType : 'mcq') as 'mcq' | 'boolean' | 'text';
      const rawDiff = getCell(cells, 'difficulty');
      const difficulty = (['Easy', 'Medium', 'Hard'].includes(rawDiff) ? rawDiff : 'Medium') as 'Easy' | 'Medium' | 'Hard';
      const explanation = getCell(cells, 'explanation');
      const correct = getCell(cells, 'correct_answer');

      let options: string[] | undefined;
      if (qType === 'mcq') {
        options = [
          getCell(cells, 'option_a'),
          getCell(cells, 'option_b'),
          getCell(cells, 'option_c'),
          getCell(cells, 'option_d'),
        ].filter(Boolean);
        if (options.length < 2) { errors.push({ row: rowNum, column: 'option_a', message: 'MCQ needs at least option_a and option_b.' }); continue; }
        if (!correct) { errors.push({ row: rowNum, column: 'correct_answer', message: 'correct_answer is required for MCQ.' }); continue; }
        if (!options.includes(correct)) { errors.push({ row: rowNum, column: 'correct_answer', message: `correct_answer "${correct}" must match one of the options.` }); continue; }
      } else if (qType === 'boolean') {
        options = ['True', 'False'];
        if (!['True', 'False'].includes(correct)) { errors.push({ row: rowNum, column: 'correct_answer', message: 'Boolean questions require correct_answer "True" or "False".' }); continue; }
      }

      items.push({ id: uid(), text, type: qType, options, correctAnswer: correct, explanation, difficulty });
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
        'question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty',
        'What is 5 + 3 × 2?,mcq,16,11,10,13,11,"BODMAS: multiply first → 3×2=6 → 5+6=11",Easy',
        'Is 4x a monomial?,boolean,,,,,True,A monomial has exactly one term.,Easy',
        'Simplify 2x + 3x,mcq,5x,6x,x,5x²,5x,Combine like terms: coefficients 2+3=5.,Medium',
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
    { name: 'question_text',   required: true,  description: 'The question body.', example: 'What is 2 + 2?' },
    { name: 'question_type',   required: false, description: 'Type of question.', allowedValues: 'mcq | boolean | text', example: 'mcq' },
    { name: 'option_a',        required: false, description: 'First MCQ choice.', example: '4' },
    { name: 'option_b',        required: false, description: 'Second MCQ choice.', example: '3' },
    { name: 'option_c',        required: false, description: 'Third MCQ choice (optional).', example: '5' },
    { name: 'option_d',        required: false, description: 'Fourth MCQ choice (optional).', example: '6' },
    { name: 'correct_answer',  required: false, description: 'Exact text of the correct answer.', example: '4' },
    { name: 'explanation',     required: false, description: 'Explanation shown after answering.', example: 'Because 2+2 equals 4.' },
    { name: 'difficulty',      required: false, description: 'Difficulty level.', allowedValues: 'Easy | Medium | Hard', example: 'Easy' },
  ],
};

// ─── Template generator ───────────────────────────────────────────────────────

export function generateTemplateCSV(level: ImportLevel = 'full'): string {
  const headers = [
    'standard_name', 'section_name', 'topic_title', 'topic_sequence',
    'prereq_title', 'prereq_category',
    'subtopic_title', 'subtopic_video',
    'quiz_type', 'question_text', 'question_type',
    'option_a', 'option_b', 'option_c', 'option_d',
    'correct_answer', 'explanation', 'difficulty',
  ];

  const quote = (s: string) => (s.includes(',') ? `"${s}"` : s);
  const row = (cells: string[]) => cells.map(quote).join(',');

  const headerRow = row(headers);

  // Sample data rows that illustrate every kind of row
  const sampleRows = [
    // Topic row with sequence
    row(['Grade 9', 'Section A', 'Algebraic Expressions', '1', '', '', '', '', '', '', '', '', '', '', '', '', '', '']),
    // Prerequisite rows (inherit standard/section/topic)
    row(['', '', '', '', 'Basic Arithmetic', 'Major', '', '', '', '', '', '', '', '', '', '', '', '']),
    row(['', '', '', '', 'Understanding Variables', 'Intermediate', '', '', '', '', '', '', '', '', '', '', '', '']),
    // Pre-evaluation question
    row(['', '', '', '', '', '', '', '', 'pre', 'What is 5 + 3 × 2?', 'mcq', '16', '11', '10', '13', '11', 'BODMAS: multiply first → 3×2=6 → 5+6=11', 'Easy']),
    // Subtopic + subtopic quiz
    row(['', '', '', '', '', '', 'Introduction to Polynomials', 'https://youtube.com/watch?v=example', 'subtopic', 'Degree of 3x²+2x-5?', 'mcq', '1', '2', '3', '0', '2', 'Highest power of x is 2.', 'Medium']),
    // Another subtopic question (subtopic_title cascades)
    row(['', '', '', '', '', '', '', '', '', 'Is 4x a monomial?', 'boolean', '', '', '', '', 'True', 'A monomial has exactly one term.', 'Easy']),
    // Post-evaluation question (no subtopic needed)
    row(['', '', '', '', '', '', '', '', 'post', 'Factorize x²-5x+6', 'mcq', '(x-2)(x-3)', '(x+2)(x+3)', '(x-1)(x-6)', '(x+1)(x-6)', '(x-2)(x-3)', 'Numbers mul to 6 and add to -5 are -2,-3.', 'Medium']),
    // New topic, same standard/section
    row(['', '', 'Linear Equations', '2', '', '', '', '', '', '', '', '', '', '', '', '', '', '']),
    row(['', '', '', '', 'Algebraic Expressions', 'Major', '', '', '', '', '', '', '', '', '', '', '', '']),
    row(['', '', '', '', '', '', 'Solving One-Variable Equations', '', 'subtopic', 'Solve 5x=25', 'mcq', '3', '4', '5', '6', '5', 'Divide both sides by 5.', 'Easy']),
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
  { name: 'standard_name',   required: true,  description: 'Name of the educational standard / grade.', example: 'Grade 9' },
  { name: 'section_name',    required: true,  description: 'Name of the class/section within the standard.', example: 'Section A' },
  { name: 'topic_title',     required: false, description: 'Name of the curriculum topic. Required to add anything below this level.', example: 'Algebraic Expressions' },
  { name: 'topic_sequence',  required: false, description: 'Display order of the topic (integer). Defaults to row order.', example: '1' },
  { name: 'prereq_title',    required: false, description: 'Prerequisite topic name to add to the current topic.', example: 'Basic Arithmetic' },
  { name: 'prereq_category', required: false, description: 'Importance level of the prerequisite.', allowedValues: 'Major | Intermediate | Minor', example: 'Major' },
  { name: 'subtopic_title',  required: false, description: 'Name of the sub-topic inside the topic.', example: 'Introduction to Polynomials' },
  { name: 'subtopic_video',  required: false, description: 'Full YouTube URL for the sub-topic video.', example: 'https://youtube.com/watch?v=...' },
  { name: 'quiz_type',       required: false, description: '"subtopic" → attaches question to the subtopic quiz. "pre" → pre-evaluation quiz of the topic. "post" → post-evaluation quiz.', allowedValues: 'subtopic | pre | post', example: 'pre' },
  { name: 'question_text',   required: false, description: 'The question body text.', example: 'What is 2 + 2?' },
  { name: 'question_type',   required: false, description: 'Type of question.', allowedValues: 'mcq | boolean | text', example: 'mcq' },
  { name: 'option_a',        required: false, description: 'First MCQ choice.', example: '4' },
  { name: 'option_b',        required: false, description: 'Second MCQ choice.', example: '3' },
  { name: 'option_c',        required: false, description: 'Third MCQ choice (optional).', example: '5' },
  { name: 'option_d',        required: false, description: 'Fourth MCQ choice (optional).', example: '6' },
  { name: 'correct_answer',  required: false, description: 'Exact text of the correct answer (must match an option for MCQ or "True"/"False" for boolean).', example: '4' },
  { name: 'explanation',     required: false, description: 'Explanation shown to students after answering.', example: 'Because 2+2 equals 4.' },
  { name: 'difficulty',      required: false, description: 'Difficulty level of the question.', allowedValues: 'Easy | Medium | Hard', example: 'Easy' },
];
