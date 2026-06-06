# Curriculum bulk import template

Excel workbook for defining an entire class in one sheet: standard, section, topics, prerequisites, sub-topics, and **all four question types**.

## Files

| File | Purpose |
|------|---------|
| `curriculum_import_template.xlsx` | Share with the admin portal manager |
| `../scripts/generate_curriculum_template.ts` | Regenerates the workbook from `FULL_TEMPLATE_HEADERS` / `COLUMN_DOCS` in `src/utils/csvImport.ts` |

## Column count: 28

| Group | Columns |
|-------|---------|
| Standard / class | `standard_name`*, `standard_description`, `section_name`*, `class_passing_threshold` |
| Topic | `topic_title`, `topic_sequence`, `topic_description`, `final_test_threshold` |
| Prerequisite | `prereq_title`, `prereq_category`, `prereq_description`, `prereq_passing_threshold`, `prereq_max_ai_attempts` |
| Sub-topic | `subtopic_title`, `subtopic_video`, `subtopic_order`, `subtopic_passing_threshold` |
| Question | `quiz_type`, `question_text`, `image_url`, `question_type`, `option_a`–`option_d`, `correct_answer`, `explanation`, `difficulty` |

\*Required on every row (or inherited via cascade from a row above).

## For the admin

1. Open **`curriculum_import_template.xlsx`**.
2. Read **Instructions** and review gray **example rows** on **Curriculum Data** (one row per question type).
3. Replace examples or add rows below **“↓ Add your rows below ↓”**.
4. Do **not** change row 1 headers or column order.
5. Use dropdowns for `prereq_category`, `quiz_type`, `question_type`, `difficulty`.
6. **Save As → CSV (UTF-8)** from **Curriculum Data** only.
7. Send the `.csv` to your developer.

### Question types (examples included in template)

| `question_type` | Required fields |
|-----------------|-----------------|
| `mcq` | `option_a`, `option_b` (min 2); `correct_answer` must **exactly** match one option |
| `true_false` | `correct_answer` = `True` or `False` |
| `text` | `correct_answer` = accepted short answer |
| `image_upload` | Optional `image_url` on the question; `correct_answer` optional (rubric note) |

Legacy CSV may use `boolean` instead of `true_false` — the importer accepts both.

### Defaults when blank

| Field | Default |
|-------|---------|
| `class_passing_threshold`, `final_test_threshold`, `prereq_passing_threshold`, `subtopic_passing_threshold` | 60 |
| `prereq_max_ai_attempts` | 3 |
| `subtopic_order` | Auto-increment per topic |
| `difficulty` | Medium |

### `quiz_type`

| Value | Attaches to |
|-------|-------------|
| `subtopic` | Sub-topic lesson quiz |
| `pre` | Topic pre-evaluation |
| `post` | Topic final test |

## For the developer

```bash
npx tsx scripts/import_csv_to_firestore.ts path/to/exported.csv
```

Uses extended `parseCSV` in `src/utils/csvImport.ts`. Creates standards, classes, topics, prerequisites, sub-topics, and questions with descriptions, thresholds, `imageUrl`, and all four question types.

### Regenerate template

```bash
npm run gen:curriculum-template
```

Commit the updated `templates/curriculum_import_template.xlsx`.

## Notes

- `prereq_category` is parsed for reference; it is **not** stored in Firestore today.
- Per-prerequisite quiz questions are still added in the live admin UI (`/admin/curriculum`); CSV `pre` maps to topic-level pre-evaluation in the CLI importer.
- Live admin paste panels (topics-only, subtopics-only, etc.) are unchanged; this template is for whole-class CLI import.
