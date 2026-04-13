import { Check, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export type StepState = 'completed' | 'active' | 'locked' | 'idle';

interface Step {
  label: string;
  state: StepState;
}

interface StepIndicatorProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const DOT_COLOR: Record<StepState, string> = {
  completed: 'bg-emerald-500 border-emerald-500 text-white',
  active:    'bg-blue-500 border-blue-500 text-white',
  locked:    'bg-slate-200 border-slate-300 text-slate-400',
  idle:      'bg-white border-slate-300 text-slate-500',
};

const LINE_COLOR: Record<StepState, string> = {
  completed: 'bg-emerald-400',
  active:    'bg-blue-300',
  locked:    'bg-slate-200',
  idle:      'bg-slate-200',
};

export function StepIndicator({ steps, orientation = 'horizontal', className = '' }: StepIndicatorProps) {
  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col gap-0 ${className}`}>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* Dot + connector */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: step.state === 'active' ? [1, 1.15, 1] : 1 }}
                transition={{ repeat: step.state === 'active' ? Infinity : 0, duration: 1.5 }}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${DOT_COLOR[step.state]}`}
              >
                {step.state === 'completed' ? <Check className="w-3.5 h-3.5" /> :
                 step.state === 'locked'    ? <Lock className="w-3 h-3" /> :
                 i + 1}
              </motion.div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-6 mt-1 rounded ${LINE_COLOR[step.state]}`} />
              )}
            </div>
            {/* Label */}
            <div className="pt-1 pb-6">
              <span className={`text-sm font-medium ${step.state === 'locked' ? 'text-slate-400' : step.state === 'active' ? 'text-blue-700' : step.state === 'completed' ? 'text-emerald-700' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <motion.div
              animate={{ scale: step.state === 'active' ? [1, 1.12, 1] : 1 }}
              transition={{ repeat: step.state === 'active' ? Infinity : 0, duration: 1.5 }}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${DOT_COLOR[step.state]}`}
            >
              {step.state === 'completed' ? <Check className="w-3.5 h-3.5" /> :
               step.state === 'locked'    ? <Lock className="w-3 h-3" /> :
               i + 1}
            </motion.div>
            <span className={`text-xs font-medium whitespace-nowrap ${step.state === 'locked' ? 'text-slate-400' : step.state === 'active' ? 'text-blue-600' : step.state === 'completed' ? 'text-emerald-600' : 'text-slate-500'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 mx-1 rounded ${LINE_COLOR[step.state]} self-start mt-3.5`} />
          )}
        </div>
      ))}
    </div>
  );
}
