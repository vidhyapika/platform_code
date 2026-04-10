import React from 'react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 bg-[#1E293B] rounded-xl flex items-center justify-center relative overflow-hidden shrink-0">
        {/* Abstract wave/book shape inside logo */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#0084B4] rounded-t-full transform translate-y-1"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[#7CB342] rounded-t-full transform translate-y-1 translate-x-2"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-[#0084B4] leading-none tracking-tight">Vidhyapika</span>
        <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Grades 6-10</span>
      </div>
    </div>
  );
}
