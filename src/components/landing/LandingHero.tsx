import { motion } from 'motion/react';
import { ArrowRight, Bot, ChevronRight, GraduationCap, Mic } from 'lucide-react';
import { LoginButton } from './shared';

const TRUST_ITEMS = [
  { icon: GraduationCap, label: 'Grades 6–10', color: 'text-[#0084B4]' },
  { icon: Bot, label: 'AI Coaching', color: 'text-[#7CB342]' },
  { icon: Mic, label: 'Live Voice Class', color: 'text-[#0084B4]' },
];

function HeadlineSparkles() {
  return (
    <svg
      className="absolute -top-2 right-8 sm:right-12 lg:right-16 w-12 h-10 text-[#7CB342] pointer-events-none"
      viewBox="0 0 48 40"
      fill="none"
      aria-hidden
    >
      <path d="M8 28 L10 20 L14 24 L12 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10 L23 4 L26 8 L24 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 18 L36 12 L39 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PotentialUnderline() {
  return (
    <svg
      className="absolute -bottom-2 left-0 w-[110%] h-4 -translate-x-[5%] text-[#7CB342] pointer-events-none"
      viewBox="0 0 220 16"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 10 Q55 2 110 8 Q165 14 220 6"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeroVisualPanel() {
  return (
    <div className="flex items-center justify-center min-h-0 h-full w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-0">
      <img
        src="/hero-section.png"
        alt="Vidhyapika — premium digital learning for middle and high school"
        className="w-full h-auto max-w-full max-h-[42vh] sm:max-h-[46vh] lg:max-h-[min(calc(100dvh-6rem),680px)] xl:max-h-[min(calc(100dvh-5rem),760px)] object-contain object-center"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-white h-[calc(100dvh-4rem)]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8FCFE] via-white to-white pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative grid grid-cols-1 lg:grid-cols-2 h-full min-h-0 items-center gap-6 lg:gap-10"
      >
        <div className="flex flex-col justify-center min-h-0 px-6 sm:px-10 lg:px-12 xl:px-16 2xl:px-24 py-10 lg:py-0 text-center lg:text-left">
          <div className="relative w-full lg:max-w-[36rem] xl:max-w-[42rem] mx-auto lg:mx-0">
            <div
              className="h-1 w-16 rounded-full bg-gradient-to-r from-[#7CB342] to-[#0084B4] mb-6 mx-auto lg:mx-0"
              aria-hidden
            />
            <HeadlineSparkles />
            <h1 className="text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl 2xl:text-[3.5rem] font-extrabold leading-[1.12] tracking-tight">
              <span className="text-slate-800">Unlock Your </span>
              <span className="text-[#7CB342]">Academic </span>
              <span className="relative inline-block text-[#0084B4]">
                Potential.
                <PotentialUnderline />
              </span>
            </h1>
          </div>

          <p className="mt-6 text-base sm:text-lg xl:text-xl text-slate-500 font-medium leading-relaxed w-full lg:max-w-[34rem] xl:max-w-[38rem] mx-auto lg:mx-0">
            Designed for Grades 6–10, Vidhyapika is your AI-powered math learning platform — structured curriculum,
            interactive lessons, smart tutoring, and live voice classrooms.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <LoginButton className="px-7 py-3.5 text-base lg:text-lg rounded-full">
              Start Learning
              <ArrowRight className="w-5 h-5" />
            </LoginButton>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base lg:text-lg font-bold text-[#0084B4] bg-white border border-[#0084B4]/40 rounded-full hover:bg-[#F8FCFE] transition-colors"
            >
              Explore Features
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start">
            {TRUST_ITEMS.map((item, i) => (
              <div key={item.label} className="flex items-center">
                <div className="flex items-center gap-2 px-4 py-1 text-sm lg:text-base font-semibold text-slate-600">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  {item.label}
                </div>
                {i < TRUST_ITEMS.length - 1 && (
                  <div className="w-px h-4 bg-slate-200 shrink-0" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </div>

        <HeroVisualPanel />
      </motion.div>
    </section>
  );
}
