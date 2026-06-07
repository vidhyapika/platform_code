import { User } from 'lucide-react';
import { Logo } from '../Logo';
import { LoginButton, scrollToSection } from './shared';

const NAV_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'Platform', id: 'platform' },
  { label: 'How It Works', id: 'how-it-works' },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <a href="/" className="shrink-0">
          <Logo variant="header" />
        </a>
        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollToSection(link.id)}
              className="text-sm font-semibold text-slate-700 hover:text-[#0084B4] transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>
        <LoginButton className="px-5 py-2.5 text-sm rounded-full shrink-0">
          <User className="w-4 h-4" />
          Student Login
        </LoginButton>
      </div>
    </header>
  );
}
