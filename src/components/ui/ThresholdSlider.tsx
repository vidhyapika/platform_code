interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

function getThresholdColor(value: number): string {
  if (value < 60) return '#ef4444'; // red
  if (value < 80) return '#f97316'; // orange
  return '#22c55e'; // green
}

function getThresholdLabel(value: number): string {
  if (value < 60) return 'Low threshold';
  if (value < 80) return 'Moderate threshold';
  return 'High threshold';
}

export function ThresholdSlider({ value, onChange, label = 'Passing threshold', className = '', disabled = false }: ThresholdSliderProps) {
  const color = getThresholdColor(value);
  const hint = getThresholdLabel(value);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <span
          className="text-sm font-bold px-2.5 py-0.5 rounded-full"
          style={{ color, backgroundColor: color + '1a' }}
        >
          {value}%
        </span>
      </div>

      {/* Gradient track with thumb */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #f97316 60%, #22c55e 80%, #22c55e 100%)`,
            accentColor: color,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>0%</span>
        <span style={{ color, fontWeight: 600 }}>{hint}</span>
        <span>100%</span>
      </div>
    </div>
  );
}
