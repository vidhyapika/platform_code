import React, { useRef, useCallback } from 'react';
import { Delete } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { studentAnswerToPreviewLatex } from '../utils/studentMathPreview';

type KeypadKey = {
  label: string;
  insert: string;
  /** Place cursor this many chars before end of inserted text (e.g. 1 = inside sqrt()) */
  cursorFromEnd?: number;
  title?: string;
};

const KEYPAD_ROWS: KeypadKey[][] = [
  [
    { label: '√', insert: 'sqrt()', cursorFromEnd: 1, title: 'Square root' },
    { label: 'x²', insert: '^2', title: 'Power of 2' },
    { label: 'x³', insert: '^3', title: 'Power of 3' },
    { label: 'π', insert: 'pi', title: 'Pi' },
    { label: '(', insert: '(', title: 'Open bracket' },
    { label: ')', insert: ')', title: 'Close bracket' },
  ],
  [
    { label: '+', insert: ' + ', title: 'Plus' },
    { label: '−', insert: ' − ', title: 'Minus' },
    { label: '×', insert: ' × ', title: 'Multiply' },
    { label: '÷', insert: ' ÷ ', title: 'Divide' },
    { label: '/', insert: '/', title: 'Fraction slash' },
    { label: '^', insert: '^', title: 'Power' },
  ],
];

export type MathAnswerInputProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function applyInsert(
  current: string,
  selectionStart: number,
  selectionEnd: number,
  insert: string,
  cursorFromEnd = 0
): { value: string; cursor: number } {
  const before = current.slice(0, selectionStart);
  const after = current.slice(selectionEnd);
  const value = before + insert + after;
  const cursor = selectionStart + insert.length - cursorFromEnd;
  return { value, cursor };
}

export function MathAnswerInput({
  value,
  onChange,
  rows = 5,
  placeholder = 'Type your answer — symbols or words both work (e.g. sqrt(2) or root 2)',
  disabled = false,
  className = '',
}: MathAnswerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertKey = useCallback(
    (key: KeypadKey) => {
      const el = textareaRef.current;
      if (!el || disabled) return;
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const { value: next, cursor } = applyInsert(value, start, end, key.insert, key.cursorFromEnd ?? 0);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(cursor, cursor);
      });
    },
    [value, onChange, disabled]
  );

  const handleBackspace = useCallback(() => {
    const el = textareaRef.current;
    if (!el || disabled) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start !== end) {
      const next = value.slice(0, start) + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start);
      });
      return;
    }
    if (start === 0) return;
    const next = value.slice(0, start - 1) + value.slice(start);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start - 1, start - 1);
    });
  }, [value, onChange, disabled]);

  const previewLatex = studentAnswerToPreviewLatex(value);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 px-0.5">
          Math keyboard
        </p>
        <div className="space-y-1.5">
          {KEYPAD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex flex-wrap gap-1.5">
              {row.map((key) => (
                <button
                  key={key.label}
                  type="button"
                  title={key.title}
                  disabled={disabled}
                  onClick={() => insertKey(key)}
                  className="min-w-[2.25rem] h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:border-[#0084B4]/40 hover:bg-blue-50/60 hover:text-[#0084B4] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {key.label}
                </button>
              ))}
              {rowIdx === KEYPAD_ROWS.length - 1 ? (
                <button
                  type="button"
                  title="Backspace"
                  disabled={disabled || !value}
                  onClick={handleBackspace}
                  className="min-w-[2.25rem] h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center"
                >
                  <Delete className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        rows={rows}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 border-2 border-slate-200 rounded-2xl resize-none focus:border-[#0084B4] focus:ring-4 focus:ring-[#0084B4]/10 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400"
      />

      <p className="text-xs text-slate-500 leading-relaxed px-0.5">
        Type freely or use the keyboard above. Symbols and plain words (e.g. &quot;root 2&quot;) are both fine.
      </p>

      {value.trim() ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Preview</p>
          <div className="text-base font-semibold text-slate-800 overflow-x-auto min-h-[1.5rem]">
            <MathRenderer text={previewLatex} block />
          </div>
        </div>
      ) : null}
    </div>
  );
}
