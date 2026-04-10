import React, { useState, useCallback, useRef } from 'react';
import { Modal } from './ui/Modal';
import {
  Upload, Download, FileText, AlertTriangle, CheckCircle2,
  Info, ChevronDown, ChevronRight, X, Eye, EyeOff, ClipboardList,
  Table2, Layers, BookOpen, ListTree, HelpCircle
} from 'lucide-react';
import {
  parseCSV, generateTemplateCSV, COLUMN_DOCS,
  type ParseResult, type ImportLevel,
} from '../utils/csvImport';
import type { Standard } from '../data/adminMockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingData: Standard[];
  onImport: (merged: Standard[]) => void;
}

type Step = 'guide' | 'upload' | 'preview' | 'done';

const LEVEL_INFO: { level: ImportLevel; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    level: 'full',
    label: 'Full Section Data',
    desc: 'Upload everything: standards, sections, topics, subtopics, videos, prerequisites, and all quiz types in one file.',
    icon: <Layers className="w-5 h-5 text-blue-600" />,
  },
  {
    level: 'topic',
    label: 'Topics & Below',
    desc: 'Upload topics, subtopics, prerequisites, and quizzes for an existing standard/section.',
    icon: <BookOpen className="w-5 h-5 text-purple-600" />,
  },
  {
    level: 'subtopic',
    label: 'Subtopics & Quizzes',
    desc: 'Bulk-add subtopics and their quiz questions within existing topics.',
    icon: <ListTree className="w-5 h-5 text-emerald-600" />,
  },
  {
    level: 'questions',
    label: 'Quiz Questions Only',
    desc: 'Upload pre-evaluation, post-evaluation, or subtopic quiz questions for existing topics.',
    icon: <ClipboardList className="w-5 h-5 text-orange-600" />,
  },
];

export function CurriculumImportModal({ isOpen, onClose, existingData, onImport }: Props) {
  const [step, setStep] = useState<Step>('guide');
  const [parseResult, setParseResult]   = useState<ParseResult | null>(null);
  const [rawCsv, setRawCsv]             = useState('');
  const [fileName, setFileName]         = useState('');
  const [dragging, setDragging]         = useState(false);
  const [showAllCols, setShowAllCols]   = useState(false);
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('guide');
    setParseResult(null);
    setRawCsv('');
    setFileName('');
    setDragging(false);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Template download ─────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const csv = generateTemplateCSV('full');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'curriculum_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── File processing ───────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string ?? '';
      setRawCsv(text);
      const result = parseCSV(text, existingData);
      setParseResult(result);
      setStep('preview');
    };
    reader.readAsText(file);
  }, [existingData]);

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

  // ── Confirm import ────────────────────────────────────────────────────────
  const confirmImport = () => {
    if (!parseResult) return;
    onImport(parseResult.standards);
    setStep('done');
  };

  // ── Step: Guide ───────────────────────────────────────────────────────────
  const renderGuide = () => (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
        <h3 className="text-lg font-extrabold mb-1">CSV / Spreadsheet Bulk Import</h3>
        <p className="text-sm text-blue-100 leading-relaxed">
          Use a single CSV file to upload your entire curriculum — topics, subtopics, videos, prerequisites, and all quiz types — at once.
          The format is flexible: fill only the columns you need and blank cells cascade from the row above.
        </p>
      </div>

      {/* Import levels */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">What can you import?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LEVEL_INFO.map(info => (
            <div key={info.level} className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="shrink-0 mt-0.5">{info.icon}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{info.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{info.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column reference */}
      <div>
        <button
          onClick={() => setShowAllCols(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2"><Table2 className="w-4 h-4" /> Column Reference</span>
          {showAllCols ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {showAllCols && (
          <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-bold text-slate-600 uppercase tracking-wider w-44">Column Name</th>
                  <th className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Example</th>
                  <th className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider text-center">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COLUMN_DOCS.map(doc => (
                  <tr key={doc.name} className="hover:bg-slate-50 align-top">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">{doc.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      {doc.description}
                      {doc.allowedValues && (
                        <span className="block mt-1 text-indigo-600 font-semibold">Values: {doc.allowedValues}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 hidden sm:table-cell font-mono whitespace-nowrap">{doc.example}</td>
                    <td className="py-2.5 px-3 text-center">
                      {doc.required
                        ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">Yes</span>
                        : <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">No</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cascade tip */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 leading-relaxed">
          <strong>Cascading cells:</strong> If a cell is left blank, the parser inherits the value from the row above.
          This means you can write <code className="bg-amber-100 px-1 rounded text-xs">topic_title</code> once and add many subtopic/question rows below it without repeating the topic name.
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={downloadTemplate}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-blue-200 text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-colors text-sm"
        >
          <Download className="w-4 h-4" /> Download Template CSV
        </button>
        <button
          onClick={() => setStep('upload')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm shadow-sm"
        >
          <Upload className="w-4 h-4" /> Upload My CSV
        </button>
      </div>
    </div>
  );

  // ── Step: Upload ──────────────────────────────────────────────────────────
  const renderUpload = () => (
    <div className="space-y-6">
      <button onClick={() => setStep('guide')} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
        ← Back to Guide
      </button>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
      >
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFileChange} />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
          <Upload className={`w-8 h-8 ${dragging ? 'text-blue-600' : 'text-slate-400'}`} />
        </div>
        <p className="text-base font-bold text-slate-800 mb-1">Drag & drop your CSV here</p>
        <p className="text-sm text-slate-500">or <span className="text-blue-600 font-bold">click to browse</span></p>
        <p className="text-xs text-slate-400 mt-3">Supported: .csv, .tsv, .txt (UTF-8)</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-bold text-slate-400 uppercase">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <button
        onClick={downloadTemplate}
        className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Download className="w-4 h-4 text-blue-500" /> Download the Template First
      </button>
    </div>
  );

  // ── Step: Preview ─────────────────────────────────────────────────────────
  const renderPreview = () => {
    if (!parseResult) return null;
    const { standards, errors, warnings, rowCount } = parseResult;
    const hasErrors = errors.length > 0;

    // Compute summary counts from the new merged set
    let topicCount = 0, subtopicCount = 0, prereqCount = 0;
    let preCount = 0, postCount = 0, subQuizCount = 0;
    for (const std of standards) {
      for (const cls of std.classes) {
        for (const topic of cls.curriculum) {
          topicCount++;
          prereqCount  += topic.prerequisites?.length ?? 0;
          preCount     += topic.preEvaluationQuiz?.length ?? 0;
          postCount    += topic.postEvaluationQuiz?.length ?? 0;
          for (const sub of topic.subTopics) {
            subtopicCount++;
            subQuizCount += sub.quizzes?.length ?? 0;
          }
        }
      }
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setStep('upload'); setParseResult(null); }} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            ← Change File
          </button>
          <span className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
            <FileText className="w-3.5 h-3.5" /> {fileName}
          </span>
        </div>

        {/* Errors */}
        {hasErrors && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
              <AlertTriangle className="w-4 h-4" /> {errors.length} error{errors.length > 1 ? 's' : ''} found — please fix and re-upload
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {errors.map((err, i) => (
                <div key={i} className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2 font-medium">
                  <span className="font-bold">Row {err.row}</span>
                  {err.column && <span className="text-red-500"> [{err.column}]</span>}: {err.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-1">
            {warnings.map((w, i) => (
              <div key={i} className="text-xs text-amber-800 font-medium flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" /> {w}
              </div>
            ))}
          </div>
        )}

        {/* Summary cards */}
        {!hasErrors && (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                { label: 'Standards', value: standards.length, color: 'bg-blue-50 text-blue-700' },
                { label: 'Topics', value: topicCount, color: 'bg-purple-50 text-purple-700' },
                { label: 'Sub-topics', value: subtopicCount, color: 'bg-indigo-50 text-indigo-700' },
                { label: 'Prerequisites', value: prereqCount, color: 'bg-orange-50 text-orange-700' },
                { label: 'Pre/Post Q', value: preCount + postCount, color: 'bg-yellow-50 text-yellow-700' },
                { label: 'Subtopic Q', value: subQuizCount, color: 'bg-emerald-50 text-emerald-700' },
              ].map(card => (
                <div key={card.label} className={`${card.color} rounded-xl p-3 text-center`}>
                  <p className="text-xl font-extrabold">{card.value}</p>
                  <p className="text-xs font-bold mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Tree preview */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-72 overflow-y-auto">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Import Tree Preview</p>
              {standards.map(std => (
                <div key={std.id} className="mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
                    <Layers className="w-4 h-4 text-blue-600" /> {std.name}
                  </div>
                  {std.classes.map(cls => (
                    <div key={cls.id} className="ml-5 mb-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 mb-1">
                        <BookOpen className="w-3.5 h-3.5" /> {cls.name}
                        <span className="text-xs text-slate-400 font-normal">({cls.curriculum.length} topics)</span>
                      </div>
                      {cls.curriculum.map(topic => {
                        const key = `${std.id}-${cls.id}-${topic.id}`;
                        const expanded = expandedCols[key];
                        return (
                          <div key={topic.id} className="ml-5 mb-1.5">
                            <button
                              onClick={() => setExpandedCols(prev => ({ ...prev, [key]: !prev[key] }))}
                              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600"
                            >
                              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <ListTree className="w-3.5 h-3.5 text-emerald-600" />
                              {topic.title}
                              <span className="text-slate-400 font-normal">
                                ({topic.subTopics.length} subs, {(topic.prerequisites?.length ?? 0)} prereqs, {(topic.preEvaluationQuiz?.length ?? 0) + (topic.postEvaluationQuiz?.length ?? 0)} eval Qs)
                              </span>
                            </button>
                            {expanded && (
                              <div className="ml-5 mt-1 space-y-0.5">
                                {topic.subTopics.map(sub => (
                                  <div key={sub.id} className="text-xs text-slate-500 flex items-center gap-1.5 py-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                    {sub.title}
                                    {sub.videoUrl && <span className="text-blue-500 font-semibold">[video]</span>}
                                    {(sub.quizzes?.length ?? 0) > 0 && <span className="text-orange-500 font-semibold">[{sub.quizzes!.length} Qs]</span>}
                                  </div>
                                ))}
                                {(topic.prerequisites?.length ?? 0) > 0 && (
                                  <div className="text-xs text-purple-600 flex items-center gap-1.5 py-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                    {topic.prerequisites!.length} prerequisite(s)
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              This import will <strong className="text-slate-700">merge</strong> with existing data — existing topics/subtopics with same name will be updated, new ones will be added.
            </div>
          </>
        )}

        {/* Row stats */}
        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
          <span>{rowCount} data row{rowCount !== 1 ? 's' : ''} processed</span>
          <span>{hasErrors ? `${errors.length} error${errors.length > 1 ? 's' : ''}` : 'Ready to import'}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleClose} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={confirmImport}
            disabled={hasErrors}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import Data
          </button>
        </div>
      </div>
    );
  };

  // ── Step: Done ────────────────────────────────────────────────────────────
  const renderDone = () => (
    <div className="flex flex-col items-center text-center py-8 space-y-4">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <h3 className="text-xl font-extrabold text-slate-900">Import Successful!</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
        Your curriculum data has been imported and merged. The curriculum tree has been updated.
      </p>
      <button
        onClick={handleClose}
        className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
      >
        Done
      </button>
    </div>
  );

  const titleMap: Record<Step, string> = {
    guide:   'CSV Import Guide',
    upload:  'Upload CSV File',
    preview: 'Review Import',
    done:    'Import Complete',
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={titleMap[step]} size="3xl">
      <div className="py-2">
        {/* Progress indicator */}
        {step !== 'done' && (
          <div className="flex items-center gap-2 mb-6">
            {(['guide', 'upload', 'preview'] as Step[]).map((s, i, arr) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold transition-colors ${
                    step === s ? 'bg-blue-600 text-white' :
                    arr.indexOf(step) > i ? 'bg-emerald-500 text-white' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {arr.indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-bold capitalize hidden sm:inline ${step === s ? 'text-blue-700' : 'text-slate-400'}`}>
                    {s === 'guide' ? 'Guide' : s === 'upload' ? 'Upload' : 'Review'}
                  </span>
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {step === 'guide'   && renderGuide()}
        {step === 'upload'  && renderUpload()}
        {step === 'preview' && renderPreview()}
        {step === 'done'    && renderDone()}
      </div>
    </Modal>
  );
}
