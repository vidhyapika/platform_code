import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Brain,
  ClipboardList,
  Mic,
  Trophy,
  Video,
} from 'lucide-react';

const WATERMARK_SIZES = {
  sm: 'w-24 h-24 -bottom-2 -right-2',
  md: 'w-28 h-28 -bottom-3 -right-3',
  lg: 'w-32 h-32 -bottom-4 -right-4',
} as const;

type PremiumFeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  accentBg: string;
  accentText: string;
  watermarkSize?: keyof typeof WATERMARK_SIZES;
  featured?: boolean;
  wide?: boolean;
  className?: string;
};

function PremiumFeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  accentBg,
  accentText,
  watermarkSize = 'md',
  featured = false,
  wide = false,
  className = '',
}: PremiumFeatureCardProps) {
  const padding = featured ? 'p-8 sm:p-10' : wide ? 'p-7' : 'p-6';
  const iconBox = featured ? 'w-14 h-14 mb-6' : 'w-11 h-11 mb-4';
  const iconSize = featured ? 'w-7 h-7' : 'w-5 h-5';
  const titleClass = featured ? 'text-xl mb-3' : wide ? 'text-lg mb-2' : 'text-base mb-1.5';
  const descClass = featured || wide ? 'text-sm' : 'text-xs';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br ${gradient} ${padding} ${className}`}
    >
      <Icon
        className={`absolute ${WATERMARK_SIZES[watermarkSize]} ${accentText} opacity-[0.06] pointer-events-none`}
      />
      <div className="relative z-10">
        <div className={`${iconBox} rounded-2xl ${accentBg} ${accentText} flex items-center justify-center`}>
          <Icon className={iconSize} />
        </div>
        <h3 className={`font-bold text-slate-900 ${titleClass}`}>{title}</h3>
        <p className={`text-slate-500 font-medium leading-relaxed ${descClass} ${featured ? 'max-w-md' : wide ? 'max-w-lg' : ''}`}>
          {description}
        </p>
      </div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-extrabold uppercase tracking-wider text-[#7CB342] mb-3">
            Everything you need
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            A complete learning experience
          </h2>
          <p className="mt-4 text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            From structured curriculum to live voice classrooms — every tool is built to help students learn math with confidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-3 gap-4"
        >
          <PremiumFeatureCard
            icon={Brain}
            title="AI Tutoring"
            description="When a quiz is missed, an AI coach steps in to explain concepts and guide you until you understand — patient, personal, and always available."
            gradient="from-indigo-50/80 to-white"
            accentBg="bg-indigo-100"
            accentText="text-indigo-600"
            watermarkSize="lg"
            featured
            className="sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:col-start-1 lg:row-start-1"
          />

          <PremiumFeatureCard
            icon={Mic}
            title="Live Voice Classroom"
            description="Interactive voice sessions with a shared whiteboard for real-time, hands-on learning."
            gradient="from-[#E1F0F5] to-white"
            accentBg="bg-[#E1F0F5]"
            accentText="text-[#0084B4]"
            watermarkSize="md"
            className="sm:col-span-2 lg:col-span-2 lg:col-start-3 lg:row-start-1"
          />

          <PremiumFeatureCard
            icon={BookOpen}
            title="Structured Curriculum"
            description="Topic paths with prerequisites, pre-evaluations, and final tests."
            gradient="from-[#E1F0F5]/60 to-white"
            accentBg="bg-[#E1F0F5]"
            accentText="text-[#0084B4]"
            watermarkSize="sm"
            className="lg:col-start-3 lg:row-start-2"
          />

          <PremiumFeatureCard
            icon={Video}
            title="Video Lessons & Quizzes"
            description="Engaging lessons with inline MCQ, text, and image quizzes."
            gradient="from-[#EAF5E1]/70 to-white"
            accentBg="bg-[#EAF5E1]"
            accentText="text-[#7CB342]"
            watermarkSize="sm"
            className="lg:col-start-4 lg:row-start-2"
          />

          <PremiumFeatureCard
            icon={ClipboardList}
            title="Assignments & Schedule"
            description="Stay organized with due dates and your personal schedule."
            gradient="from-emerald-50/70 to-white"
            accentBg="bg-emerald-100"
            accentText="text-emerald-600"
            watermarkSize="md"
            wide
            className="lg:col-span-2 lg:col-start-1 lg:row-start-3"
          />

          <PremiumFeatureCard
            icon={Trophy}
            title="Achievements & Progress"
            description="Earn badges, track streaks, and watch your mastery grow."
            gradient="from-amber-50/70 to-white"
            accentBg="bg-amber-100"
            accentText="text-amber-600"
            watermarkSize="md"
            wide
            className="lg:col-span-2 lg:col-start-3 lg:row-start-3"
          />
        </motion.div>
      </div>
    </section>
  );
}
