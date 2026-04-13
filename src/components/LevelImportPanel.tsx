import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, Download, Clipboard, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Info, X, FileText, Table2,
  Check, Square, CheckSquare,
} from 'lucide-react';
import {
  parseLevelData, generateLevelTemplateCSV, LEVEL_COLUMN_DOCS,
  type LevelParseTarget,
} from '../utils/csvImport';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LevelImportPanelProps {
  /** Which data type this panel imports */
  target: LevelParseTarget;
  /** Accent colour class suffix — e.g. "blue", "purple", "orange", "emerald" */
  accent?: 'blue' | 'purple' | 'orange' | 'emerald' | 'indigo';
  /** Called when user confirms; receives the selected parsed items */
  onImport: (items: any[]) => void;
  /** Optional extra context label shown in the panel header */
  contextLabel?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT_CLASSES = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    btn: 'bg-blue-600 hover:bg-blue-700',    badge: 'bg-blue-100 text-blue-700'    },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  btn: 'bg-purple-600 hover:bg-purple-700',  badge: 'bg-purple-100 text-purple-700'  },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  btn: 'bg-orange-600 hover:bg-orange-700',  badge: 'bg-orange-100 text-orange-700'  },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  btn: 'bg-indigo-600 hover:bg-indigo-700',  badge: 'bg-indigo-100 text-indigo-700'  },
};

const TARGET_LABELS: Record<LevelParseTarget, string> = {
  topics: 'Topics',
  subtopics: 'Sub-topics',
  prerequisites: 'Prerequisites',
  questions: 'Quiz Questions',
};

const TARGET_PASTE_PLACEHOLDER: Record<LevelParseTarget, string> = {
  topics:
    'Paste Excel data here.\n\nExpected columns (copy header row too, or just data):\ntopic_title  topic_sequence\n\nExample (tab-separated from Excel):\nAlgebraic Expressions\t1\nLinear Equations\t2',
  subtopics:
    'Paste Excel data here.\n\nExpected columns:\nsubtopic_title  subtopic_video\n\nExample:\nIntroduction to Polynomials\thttps://youtube.com/...',
  prerequisites:
    'Paste Excel data here.\n\nExpected columns:\nprereq_title  prereq_category\n\nExample:\nBasic Arithmetic\tMajor',
  questions:
    'Paste Excel data here.\n\nExpected columns:\nquestion_text  question_type  option_a  option_b  option_c  option_d  correct_answer  explanation  difficulty\n\nExample:\nWhat is 2+2?\tmcq\t3\t4\t5\t6\t4\tTwo plus two equals four.\tEasy',
};

// ─── Preview table column defs per target ────────────────────────────────────

const PREVIEW_COLS: Record<LevelParseTarget, { key: string; label: string; width?: string }[]> = {
  topics: [
    { key: 'topic_title', label: 'Title' },
    { key: 'topic_sequence', label: 'Seq', width: 'w-16' },
  ],
  subtopics: [
    { key: 'subtopic_title', label: 'Sub-topic Title' },
    { key: 'subtopic_video', label: 'Video URL' },
  ],
  prerequisites: [
    { key: 'prereq_title', label: 'Prerequisite' },
    { key: 'prereq_category', label: 'Category', width: 'w-32' },
  ],
  questions: [
    { key: 'question_text', label: 'Question' },
    { key: 'question_type', label: 'Type', width: 'w-20' },
    { key: 'correct_answer', label: 'Answer', width: 'w-32' },
    { key: 'difficulty', label: 'Difficulty', width: 'w-24' },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LevelImportPanel({
  target,
  accent = 'blue',
  onImport,
  contextLabel,
}: LevelImportPanelProps) {
  const ac = ACCENT_CLASSES[accent];

  type PanelStep = 'collapsed' | 'input' | 'preview' | 'done';
  const [step, setStep]               = useState<PanelStep>('collapsed');
  const [inputTab, setInputTab]       = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText]     = useState('');
  const [fileName, setFileName]       = useState('');
  const [parseResult, setParseResult] = useState<ReturnType<typeof parseLevelData> | null>(null);
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [dragging, setDragging]       = useState(false);
  const [showCols, setShowCols]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('collapsed');
    setPasteText('');
    setFileName('');
    setParseResult(null);
    setSelected(new Set());
    setShowCols(false);
  };

  // ── Parse helper ────────────────────────────────────────────────────────────
  const runParse = useCallback((text: string) => {
    const result = parseLevelData(text, target);
    setParseResult(result);
    // Pre-select all valid rows
    const validIndices = new Set<number>();
    result.items.forEach((_, i) => validIndices.add(i));
    setSelected(validIndices);
    setStep('preview');
  }, [target]);

  // ── File handling ───────────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? '';
      runParse(text);
    };
    reader.readAsText(file);
  }, [runParse]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  // ── Paste parse ─────────────────────────────────────────────────────────────
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    setFileName('pasted data');
    runParse(pasteText);
  };

  // ── Selection helpers ────────────────────────────────────────────────────────
  const toggleRow = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selectAll = () => {
    if (!parseResult) return;
    setSelected(new Set(parseResult.items.map((_, i) => i)));
  };

  const selectNone = () => setSelected(new Set());

  // ── Confirm import ───────────────────────────────────────────────────────────
  const confirmImport = () => {
    if (!parseResult) return;
    const chosen = parseResult.items.filter((_, i) => selected.has(i));
    onImport(chosen);
    setStep('done');
  };

  // ── Template download ────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const csv = generateLevelTemplateCSV(target);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${target}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Collapsed toggle ─────────────────────────────────────────────────────────
  const header = (
    <button
      onClick={() => step === 'collapsed' ? setStep('input') : reset()}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${ac.border} ${ac.bg} ${ac.text} font-bold text-sm transition-colors hover:brightness-95`}
    >
      <span className="flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Bulk Import {TARGET_LABELS[target]}
        {contextLabel && <span className="font-normal opacity-70 text-xs">— {contextLabel}</span>}
      </span>
      {step === 'collapsed' ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );

  if (step === 'collapsed') return <div>{header}</div>;

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div className={`rounded-xl border ${ac.border} overflow-hidden`}>
      {header}
      <div className={`${ac.bg} px-5 py-6 flex flex-col items-center gap-3 text-center`}>
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <p className={`font-bold ${ac.text}`}>Import complete!</p>
        <button onClick={reset} className={`px-4 py-2 text-xs font-bold rounded-lg text-white ${ac.btn}`}>
          Import More
        </button>
      </div>
    </div>
  );

  // ── Preview ──────────────────────────────────────────────────────────────────
  if (step === 'preview' && parseResult) {
    const { items, errors, rows } = parseResult;
    const hasErrors = errors.length > 0;
    const cols = PREVIEW_COLS[target];

    return (
      <div className={`rounded-xl border ${ac.border} overflow-hidden`}>
        {header}
        <div className="p-4 space-y-4 bg-white">
          {/* File badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-semibold">{fileName}</span>
              <span>— {parseResult.rowCount} row{parseResult.rowCount !== 1 ? 's' : ''} parsed</span>
            </div>
            <button
              onClick={() => { setStep('input'); setParseResult(null); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Change
            </button>
          </div>

          {/* Errors */}
          {hasErrors && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" /> {errors.length} row{errors.length > 1 ? 's' : ''} with errors (skipped)
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-1.5 font-medium">
                    <span className="font-bold">Row {err.row}</span>
                    {err.column && <span className="text-red-500"> [{err.column}]</span>}: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Select helpers */}
          {items.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={selectAll} className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" /> All
                </button>
                <button onClick={selectNone} className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" /> None
                </button>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ac.badge}`}>
                {selected.size} of {items.length} selected
              </span>
            </div>
          )}

          {/* Preview table */}
          {items.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr className="border-b border-slate-200">
                      <th className="py-2.5 px-3 w-8"></th>
                      {cols.map(col => (
                        <th key={col.key} className={`py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider ${col.width ?? ''}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, i) => (
                      <tr
                        key={i}
                        onClick={() => toggleRow(i)}
                        className={`cursor-pointer transition-colors ${selected.has(i) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50 opacity-50'}`}
                      >
                        <td className="py-2 px-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(i) ? `${ac.badge} border-current` : 'border-slate-300'}`}>
                            {selected.has(i) && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </td>
                        {cols.map(col => (
                          <td key={col.key} className="py-2 px-3 text-slate-700 font-medium max-w-xs truncate">
                            {rows[i]?.[col.key] ?? (item as any)[col.key.replace('topic_', '').replace('subtopic_', '').replace('prereq_', '').replace('question_', '')] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !hasErrors && (
              <div className="py-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                No valid rows found.
              </div>
            )
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={reset} className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={confirmImport}
              disabled={selected.size === 0}
              className={`flex-1 py-2.5 px-4 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${ac.btn}`}
            >
              Import {selected.size > 0 ? `${selected.size} ` : ''}{TARGET_LABELS[target]}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Input step ───────────────────────────────────────────────────────────────
  return (
    <div className={`rounded-xl border ${ac.border} overflow-hidden`}>
      {header}
      <div className="bg-white p-4 space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-slate-200">
          <button
            onClick={() => setInputTab('file')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${inputTab === 'file' ? `border-${accent}-500 ${ac.text}` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
          <button
            onClick={() => setInputTab('paste')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${inputTab === 'paste' ? `border-${accent}-500 ${ac.text}` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Clipboard className="w-3.5 h-3.5" /> Paste from Excel
          </button>
        </div>

        {/* File upload tab */}
        {inputTab === 'file' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${dragging ? `${ac.border} ${ac.bg}` : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
            >
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFileChange} />
              <Upload className={`w-8 h-8 mb-2 ${dragging ? ac.text : 'text-slate-400'}`} />
              <p className="text-sm font-bold text-slate-700">Drag & drop or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">.csv, .tsv, .txt — UTF-8</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" /> Download Template CSV
            </button>
          </div>
        )}

        {/* Paste tab */}
        {inputTab === 'paste' && (
          <div className="space-y-3">
            <div className={`flex items-start gap-2 p-3 rounded-xl ${ac.bg} ${ac.border} border text-xs ${ac.text}`}>
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Select cells in Excel (including header row) → Ctrl+C → click in the box below → Ctrl+V.</span>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={(e) => {
                // Let the paste happen then auto-parse after a tick
                setTimeout(() => {
                  const text = e.currentTarget.value;
                  if (text.trim()) {
                    setFileName('pasted data');
                    runParse(text);
                  }
                }, 50);
              }}
              className="w-full min-h-[160px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
              placeholder={TARGET_PASTE_PLACEHOLDER[target]}
              spellCheck={false}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setPasteText(''); }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                onClick={handleParsePaste}
                disabled={!pasteText.trim()}
                className={`flex-1 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${ac.btn}`}
              >
                Parse Data
              </button>
            </div>
          </div>
        )}

        {/* Column reference (collapsible) */}
        <div>
          <button
            onClick={() => setShowCols(v => !v)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            <Table2 className="w-3.5 h-3.5" />
            Column Reference
            {showCols ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          {showCols && (
            <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Column</th>
                    <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-center hidden sm:table-cell">Req</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {LEVEL_COLUMN_DOCS[target].map(doc => (
                    <tr key={doc.name} className="align-top">
                      <td className="py-2 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">{doc.name}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {doc.description}
                        {doc.allowedValues && (
                          <span className="block text-indigo-600 font-semibold mt-0.5">Values: {doc.allowedValues}</span>
                        )}
                        <span className="block text-slate-400 mt-0.5">e.g. {doc.example}</span>
                      </td>
                      <td className="py-2 px-3 text-center hidden sm:table-cell">
                        {doc.required
                          ? <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">Yes</span>
                          : <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded">No</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cancel */}
        <div className="pt-1">
          <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
