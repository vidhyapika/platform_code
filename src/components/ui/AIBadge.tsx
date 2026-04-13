import { Sparkles } from 'lucide-react';

interface AIBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function AIBadge({ label = 'AI Generated', size = 'sm', className = '' }: AIBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 font-semibold ${sizeClasses} ${className}`}
    >
      <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  );
}
