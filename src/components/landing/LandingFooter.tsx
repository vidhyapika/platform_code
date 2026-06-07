import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { scrollToSection } from './shared';

const FOOTER_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'Platform', id: 'platform' },
  { label: 'How It Works', id: 'how-it-works' },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <Logo variant="header" />
          <p className="mt-2 text-sm font-medium text-slate-500">
            Vidhyapika Learning Solutions · Grades 6–10
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <nav className="flex flex-wrap justify-center gap-4">
            {FOOTER_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-semibold text-slate-500 hover:text-[#0084B4] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <Link
            to="/login"
            className="text-sm font-bold text-[#0084B4] hover:text-[#006A91] transition-colors"
          >
            Student Login →
          </Link>
        </div>
      </div>
    </footer>
  );
}
