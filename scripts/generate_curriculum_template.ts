/**
 * Generates templates/curriculum_import_template.xlsx
 * Run: npm run gen:curriculum-template
 */
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { COLUMN_DOCS, FULL_TEMPLATE_HEADERS, generateTemplateCSV } from '../src/utils/csvImport';

const OUTPUT_PATH = path.join(process.cwd(), 'templates', 'curriculum_import_template.xlsx');

const HEADERS = [...FULL_TEMPLATE_HEADERS];

const REQUIRED_COLS = new Set(['standard_name', 'section_name']);

const ENUMS = {
  prereq_category: ['Major', 'Intermediate', 'Minor'],
  quiz_type: ['subtopic', 'pre', 'post'],
  question_type: ['mcq', 'true_false', 'text', 'image_upload'],
  difficulty: ['Easy', 'Medium', 'Hard'],
} as const;

const COL_INDEX: Record<string, number> = Object.fromEntries(
  HEADERS.map((h, i) => [h, i + 1]),
);

const FILL_REQUIRED = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFECACA' } };
const FILL_OPTIONAL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFD1FAE5' } };
const FILL_EXAMPLE = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF3F4F6' } };
const FILL_MARKER = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE0E7FF' } };

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let inQuote = false;
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function parseTemplateRows(): string[][] {
  const csv = generateTemplateCSV('full');
  const lines = csv.split('\n').filter((l) => l.trim() !== '');
  return lines.slice(1).map(parseCsvLine);
}

function colLetter(n: number): string {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vidhyapika';
  workbook.created = new Date();

  // ── Hidden _Enums sheet ───────────────────────────────────────────────────
  const enumsSheet = workbook.addWorksheet('_Enums', { state: 'veryHidden' });
  enumsSheet.getCell('A1').value = 'prereq_category';
  ENUMS.prereq_category.forEach((v, i) => {
    enumsSheet.getCell(i + 2, 1).value = v;
  });
  enumsSheet.getCell('B1').value = 'quiz_type';
  ENUMS.quiz_type.forEach((v, i) => {
    enumsSheet.getCell(i + 2, 2).value = v;
  });
  enumsSheet.getCell('C1').value = 'question_type';
  ENUMS.question_type.forEach((v, i) => {
    enumsSheet.getCell(i + 2, 3).value = v;
  });
  enumsSheet.getCell('D1').value = 'difficulty';
  ENUMS.difficulty.forEach((v, i) => {
    enumsSheet.getCell(i + 2, 4).value = v;
  });

  const enumRange = (col: number, count: number) =>
    `'_Enums'!$${colLetter(col)}$2:$${colLetter(col)}$${count + 1}`;

  // ── Instructions sheet ────────────────────────────────────────────────────
  const instr = workbook.addWorksheet('Instructions');
  instr.getColumn(1).width = 100;
  const instructions = [
    'CURRICULUM BULK IMPORT TEMPLATE (28 columns)',
    '',
    'Purpose: Define an entire class — standard, section, topics, prerequisites, sub-topics, and all question types — in one sheet.',
    '',
    'HOW TO USE',
    '1. Fill rows on the "Curriculum Data" sheet (replace gray example rows or add below the marker row).',
    '2. Do NOT change the header row (row 1) or column order.',
    '3. Save As → CSV (Comma delimited) (*.csv), UTF-8. Export only the "Curriculum Data" sheet.',
    '4. Send the .csv file to your developer for import.',
    '',
    'COLOR LEGEND',
    '• Red headers = required every row (standard_name, section_name)',
    '• Green headers = optional',
    '',
    'DEFAULTS (when left blank)',
    '• class_passing_threshold, final_test_threshold, prereq_passing_threshold, subtopic_passing_threshold → 60',
    '• prereq_max_ai_attempts → 3',
    '• subtopic_order → auto-increment per topic',
    '• difficulty → Medium',
    '',
    'CASCADING BLANKS',
    'Leave cells blank to inherit from the row above for hierarchy fields (standard, section, topic, subtopic, quiz_type, question_type, difficulty).',
    '',
    'QUESTION TYPES (see gray example rows)',
    '• mcq — option_a + option_b required; correct_answer must EXACTLY match one option',
    '• true_false — correct_answer must be True or False',
    '• text — correct_answer is the accepted short answer',
    '• image_upload — optional image_url on stem; correct_answer optional (rubric note)',
    '',
    'QUIZ TYPE',
    '• subtopic — lesson quiz | pre — pre-evaluation | post — final test',
    '',
    'IMPORT (developer): npx tsx scripts/import_csv_to_firestore.ts path/to/file.csv',
  ];
  instructions.forEach((line, i) => {
    const cell = instr.getCell(i + 1, 1);
    cell.value = line;
    if (i === 0) cell.font = { bold: true, size: 14 };
  });

  // ── Column Reference sheet ─────────────────────────────────────────────────
  const ref = workbook.addWorksheet('Column Reference');
  ref.columns = [
    { header: 'Column', key: 'name', width: 28 },
    { header: 'Required', key: 'required', width: 10 },
    { header: 'Description', key: 'description', width: 55 },
    { header: 'Allowed values', key: 'allowed', width: 32 },
    { header: 'Example', key: 'example', width: 30 },
  ];
  const refHeader = ref.getRow(1);
  refHeader.font = { bold: true };
  refHeader.fill = FILL_OPTIONAL;
  COLUMN_DOCS.forEach((doc) => {
    ref.addRow({
      name: doc.name,
      required: doc.required ? 'Yes' : 'No',
      description: doc.description,
      allowed: doc.allowedValues ?? '',
      example: doc.example,
    });
  });

  // ── Examples sheet ────────────────────────────────────────────────────────
  const ex = workbook.addWorksheet('Examples');
  ex.addRow(HEADERS);
  const exHeader = ex.getRow(1);
  exHeader.font = { bold: true };
  exHeader.fill = FILL_OPTIONAL;
  parseTemplateRows().forEach((cells) => {
    const row = ex.addRow(cells);
    row.fill = FILL_EXAMPLE;
  });

  // ── Curriculum Data sheet ───────────────────────────────────────────────────
  const data = workbook.addWorksheet('Curriculum Data');
  data.views = [{ state: 'frozen', xSplit: 2, ySplit: 1, activeCell: 'A2' }];

  const headerRow = data.addRow(HEADERS);
  headerRow.height = 28;
  headerRow.font = { bold: true, size: 10 };
  HEADERS.forEach((name, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.fill = REQUIRED_COLS.has(name) ? FILL_REQUIRED : FILL_OPTIONAL;
    cell.alignment = { vertical: 'middle', wrapText: true };
    const doc = COLUMN_DOCS.find((d) => d.name === name);
    if (doc) {
      const note = [
        doc.description,
        doc.allowedValues ? `Allowed: ${doc.allowedValues}` : '',
        doc.example ? `Example: ${doc.example}` : '',
        name === 'correct_answer'
          ? 'MCQ: must exactly match one of option_a–option_d (not A/B/C/D letters).'
          : '',
      ]
        .filter(Boolean)
        .join('\n');
      cell.note = note;
    }
  });

  const exampleRows = parseTemplateRows();
  const EXAMPLE_ROW_START = 2;
  exampleRows.forEach((cells) => {
    const row = data.addRow(cells);
    row.fill = FILL_EXAMPLE;
    row.alignment = { wrapText: true, vertical: 'top' };
  });

  const markerRowNum = EXAMPLE_ROW_START + exampleRows.length;
  const markerRow = data.addRow(HEADERS.map((_, i) => (i === 0 ? '↓ Add your rows below ↓' : '')));
  markerRow.fill = FILL_MARKER;
  markerRow.font = { italic: true, bold: true };
  markerRow.getCell(1).alignment = { horizontal: 'center' };

  const BLANK_ROWS = 200;
  for (let r = 0; r < BLANK_ROWS; r++) {
    data.addRow(HEADERS.map(() => ''));
  }

  const lastDataRow = markerRowNum + BLANK_ROWS;

  const widths: Record<string, number> = {
    standard_name: 14,
    standard_description: 28,
    section_name: 14,
    class_passing_threshold: 12,
    topic_title: 22,
    topic_sequence: 10,
    topic_description: 28,
    final_test_threshold: 12,
    prereq_title: 22,
    prereq_category: 14,
    prereq_description: 28,
    prereq_passing_threshold: 12,
    prereq_max_ai_attempts: 12,
    subtopic_title: 24,
    subtopic_video: 36,
    subtopic_order: 10,
    subtopic_passing_threshold: 12,
    quiz_type: 10,
    question_text: 42,
    image_url: 36,
    question_type: 14,
    option_a: 18,
    option_b: 18,
    option_c: 18,
    option_d: 18,
    correct_answer: 18,
    explanation: 36,
    difficulty: 10,
  };
  HEADERS.forEach((h, i) => {
    data.getColumn(i + 1).width = widths[h] ?? 14;
    ex.getColumn(i + 1).width = widths[h] ?? 14;
  });

  const intCols = ['topic_sequence', 'class_passing_threshold', 'final_test_threshold', 'prereq_passing_threshold', 'prereq_max_ai_attempts', 'subtopic_order', 'subtopic_passing_threshold'];
  for (let r = EXAMPLE_ROW_START; r <= lastDataRow; r++) {
    intCols.forEach((name) => {
      if (COL_INDEX[name]) data.getCell(r, COL_INDEX[name]).numFmt = '0';
    });
  }

  const wrapCols = [
    'standard_description', 'topic_description', 'prereq_description',
    'question_text', 'explanation', 'image_url',
    'option_a', 'option_b', 'option_c', 'option_d', 'subtopic_video',
  ];
  for (let r = EXAMPLE_ROW_START; r <= lastDataRow; r++) {
    wrapCols.forEach((name) => {
      if (COL_INDEX[name]) {
        data.getCell(r, COL_INDEX[name]).alignment = { wrapText: true, vertical: 'top' };
      }
    });
  }

  const addListValidation = (colName: string, enumKey: keyof typeof ENUMS, enumCol: number) => {
    const col = COL_INDEX[colName];
    const count = ENUMS[enumKey].length;
    const range = enumRange(enumCol, count);
    for (let r = EXAMPLE_ROW_START; r <= lastDataRow; r++) {
      data.getCell(r, col).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [range],
        showErrorMessage: true,
        errorTitle: 'Invalid value',
        error: `Choose from: ${ENUMS[enumKey].join(', ')}`,
      };
    }
  };

  addListValidation('prereq_category', 'prereq_category', 1);
  addListValidation('quiz_type', 'quiz_type', 2);
  addListValidation('question_type', 'question_type', 3);
  addListValidation('difficulty', 'difficulty', 4);

  headerRow.eachCell((cell) => {
    cell.protection = { locked: true };
  });

  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await workbook.xlsx.writeFile(OUTPUT_PATH);
  console.log(`Wrote ${OUTPUT_PATH} (${HEADERS.length} columns)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
