import type { QuizAttempt } from '../../types';

interface ScoreSparklineProps {
  attempts: QuizAttempt[];
  barCount?: number;
  height?: number;
  className?: string;
}

export function ScoreSparkline({ attempts, barCount = 5, height = 32, className = '' }: ScoreSparklineProps) {
  if (!attempts || attempts.length === 0) {
    return <span className="text-xs text-slate-400 italic">No attempts</span>;
  }

  // Take last `barCount` attempts
  const shown = attempts.slice(-barCount);

  return (
    <div className={`flex items-end gap-0.5 ${className}`} style={{ height }}>
      {shown.map((attempt, i) => {
        const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
        const isPassing = pct >= 60;
        const isLatest = i === shown.length - 1;

        return (
          <div
            key={i}
            title={`Attempt ${i + 1}: ${pct}% (${attempt.score}/${attempt.total})`}
            className="rounded-sm flex-1 transition-all"
            style={{
              height: `${Math.max((pct / 100) * height, 4)}px`,
              backgroundColor: isPassing
                ? isLatest ? '#22c55e' : '#86efac'
                : isLatest ? '#ef4444' : '#fca5a5',
            }}
          />
        );
      })}
    </div>
  );
}
