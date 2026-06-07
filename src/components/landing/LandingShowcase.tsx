import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, PlayCircle } from 'lucide-react';
import { ProgressRing } from '../ui/ProgressRing';

type TabId = 'dashboard' | 'learning' | 'voice';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'learning', label: 'Learning' },
  { id: 'voice', label: 'Voice Class' },
];

function DashboardPanel() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProgress(72), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Your learning at a glance
        </h3>
        <p className="mt-4 text-slate-500 font-medium leading-relaxed">
          Track progress across topics, maintain streaks, and always know what to study next — all from a clean, focused dashboard.
        </p>
      </div>
      <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#E1F0F5]/80 to-[#EAF5E1]/60 p-10 min-h-[280px]">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <ProgressRing
            percent={progress}
            size={120}
            strokeWidth={8}
            label={<span className="text-2xl font-extrabold text-[#0084B4]">{progress}%</span>}
          />
          <div className="space-y-4 text-center sm:text-left">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">7</p>
              <p className="text-sm font-medium text-slate-500">Day streak</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#7CB342]">12/18</p>
              <p className="text-sm font-medium text-slate-500">Topics completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LearningPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Learn by doing
        </h3>
        <p className="mt-4 text-slate-500 font-medium leading-relaxed">
          Watch video lessons, then prove understanding with inline quizzes — instant feedback keeps you moving forward without losing momentum.
        </p>
      </div>
      <div className="relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-10 min-h-[280px]">
        <div className="w-full max-w-xs">
          <div className="aspect-video rounded-xl bg-slate-900 flex items-center justify-center mb-4">
            <PlayCircle className="w-14 h-14 text-white/90" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-bold text-slate-800 mb-3">What is (x+2)(x−3)?</p>
          <div className="space-y-2">
            <div className="px-4 py-3 rounded-xl border-2 border-[#7CB342] bg-[#EAF5E1]/50 text-sm font-semibold text-slate-800">
              x² − x − 6
            </div>
            <div className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-400">
              x² + x − 6
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoicePanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Learn out loud
        </h3>
        <p className="mt-4 text-slate-500 font-medium leading-relaxed">
          Join live voice classrooms with a shared whiteboard — ask questions, work through problems together, and learn in real time.
        </p>
      </div>
      <div className="relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#E1F0F5]/60 to-white p-10 min-h-[280px]">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full border border-[#0084B4]/10" />
          <div className="absolute w-24 h-24 rounded-full border border-[#0084B4]/20" />
          <div className="relative w-16 h-16 rounded-full bg-[#0084B4] flex items-center justify-center">
            <Mic className="w-7 h-7 text-white" />
          </div>
        </div>
        <p className="mt-8 text-xl font-serif italic text-slate-700 tracking-wide">
          y = ax² + bx + c
        </p>
      </div>
    </div>
  );
}

const PANELS: Record<TabId, React.ReactNode> = {
  dashboard: <DashboardPanel />,
  learning: <LearningPanel />,
  voice: <VoicePanel />,
};

export function LandingShowcase() {
  const [active, setActive] = useState<TabId>('dashboard');

  return (
    <section id="platform" className="py-24 sm:py-32 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-extrabold uppercase tracking-wider text-[#0084B4] mb-3">
            Platform preview
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            See Vidhyapika in action
          </h2>
          <p className="mt-4 text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            A premium learning experience built for students — from dashboard to live voice classrooms.
          </p>
        </motion.div>

        <div className="flex justify-center border-b border-slate-200 mb-10">
          <nav className="flex gap-1 sm:gap-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  active === tab.id
                    ? 'text-[#0084B4] border-[#0084B4]'
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#F8F9FA] to-white border border-slate-100 p-10 sm:p-14 min-h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {PANELS[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
