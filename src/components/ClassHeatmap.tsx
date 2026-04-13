import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Info } from 'lucide-react';
import type { Student } from '../data/adminMockData';

interface HeatmapSection {
  id: string;
  name: string;
  standardName: string;
  standardId: string;
}

interface HeatmapTopic {
  id: string;
  title: string;
  topicIdx: number;
}

interface ClassHeatmapProps {
  sections: HeatmapSection[];
  topics: HeatmapTopic[];
  students: Student[];
}

function getCompletionRate(sectionId: string, topicIdx: number, students: Student[]): number {
  const inSection = students.filter(s => s.classId === sectionId);
  if (inSection.length === 0) return 0;
  let score = 0;
  for (const s of inSection) {
    const done = s.topicsCompleted ?? 0;
    if (done > topicIdx) {
      score += 1; // fully completed
    } else if (done === topicIdx) {
      score += 0.45; // in-progress
    }
  }
  return Math.round((score / inSection.length) * 100);
}

function cellColor(pct: number): string {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-emerald-300';
  if (pct >= 25) return 'bg-amber-400';
  if (pct > 0)  return 'bg-red-400';
  return 'bg-slate-100';
}

function cellText(pct: number): string {
  if (pct >= 75) return 'text-white';
  if (pct >= 25) return 'text-slate-900';
  if (pct > 0)  return 'text-white';
  return 'text-slate-300';
}

export function ClassHeatmap({ sections, topics, students }: ClassHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ sectionId: string; topicIdx: number } | null>(null);

  const heatmapData = useMemo(() => {
    return sections.map(sec => ({
      section: sec,
      cells: topics.map(t => ({
        topic: t,
        pct: getCompletionRate(sec.id, t.topicIdx, students),
        studentCount: students.filter(s => s.classId === sec.id).length,
      })),
    }));
  }, [sections, topics, students]);

  if (sections.length === 0 || topics.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <LayoutGrid className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Class Progress Heatmap</h2>
          <p className="text-xs text-slate-400 font-medium">Topic completion rate per section</p>
        </div>
        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-xs font-semibold text-slate-500">
          {[
            { label: '0%',    color: 'bg-slate-200' },
            { label: '1–24%', color: 'bg-red-400' },
            { label: '25–49%',color: 'bg-amber-400' },
            { label: '50–74%',color: 'bg-emerald-300' },
            { label: '75%+',  color: 'bg-emerald-500' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${l.color}`} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[480px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-3 px-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-36">
                Section
              </th>
              {topics.map(t => (
                <th key={t.id} className="py-3 px-2 text-center text-xs font-bold text-slate-500 max-w-[120px]">
                  <span className="block truncate max-w-[110px] mx-auto" title={t.title}>{t.title}</span>
                </th>
              ))}
              <th className="py-3 px-5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                Avg
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {heatmapData.map(({ section, cells }, rowIdx) => {
              const avg = cells.length > 0
                ? Math.round(cells.reduce((a, c) => a + c.pct, 0) / cells.length)
                : 0;
              return (
                <motion.tr
                  key={section.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.07 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-5">
                    <p className="text-sm font-bold text-slate-800">{section.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{section.standardName}</p>
                  </td>
                  {cells.map(cell => {
                    const isHovered = tooltip?.sectionId === section.id && tooltip?.topicIdx === cell.topic.topicIdx;
                    return (
                      <td key={cell.topic.id} className="py-2 px-2 text-center relative">
                        <div
                          className="relative inline-block"
                          onMouseEnter={() => setTooltip({ sectionId: section.id, topicIdx: cell.topic.topicIdx })}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <div
                            className={`w-14 h-10 rounded-lg flex items-center justify-center text-xs font-extrabold cursor-default transition-all
                              ${cellColor(cell.pct)} ${cellText(cell.pct)}
                              ${isHovered ? 'ring-2 ring-slate-700 ring-offset-1 scale-110' : ''}
                            `}
                          >
                            {cell.pct > 0 ? `${cell.pct}%` : '—'}
                          </div>
                          {/* Tooltip */}
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                              <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl">
                                <p className="font-bold mb-0.5">{section.name} · {cell.topic.title}</p>
                                <p className="text-slate-300">{cell.pct}% completion · {cell.studentCount} students</p>
                              </div>
                              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 mx-auto" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {/* Avg column */}
                  <td className="py-2 px-5 text-center">
                    <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-xs font-extrabold
                      ${cellColor(avg)} ${cellText(avg)}`}>
                      {avg}%
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>In-progress topics counted at 45%. Hover a cell for details.</span>
      </div>
    </div>
  );
}
