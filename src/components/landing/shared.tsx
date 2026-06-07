import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function LoginButton({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <Link
      to="/login"
      className={`inline-flex items-center justify-center gap-2 bg-[#0084B4] hover:bg-[#006A91] text-white font-bold rounded-xl transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}
