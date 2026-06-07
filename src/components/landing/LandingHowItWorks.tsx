import { motion } from 'motion/react';
import { GraduationCap, Sparkles, Video } from 'lucide-react';
import { containerVariants, itemVariants } from './shared';

const STEPS = [
  {
    step: '01',
    title: 'Enroll & Explore',
    description: 'Sign in and browse your personalized curriculum mapped to your grade and learning path.',
    icon: GraduationCap,
  },
  {
    step: '02',
    title: 'Learn with Videos & Quizzes',
    description: 'Watch lessons, take inline quizzes, and get instant feedback as you move through each subtopic.',
    icon: Video,
  },
  {
    step: '03',
    title: 'Master with AI & Voice',
    description: 'Get AI coaching when you need help, then join live voice classrooms to deepen understanding.',
    icon: Sparkles,
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-14"
        >
          <motion.p variants={itemVariants} className="text-sm font-extrabold uppercase tracking-wider text-[#0084B4] mb-3">
            How it works
          </motion.p>
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Your path to mastery
          </motion.h2>
        </motion.div>

        {/* Desktop timeline */}
        <div className="hidden md:block relative">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute top-7 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#0084B4] via-[#7CB342] to-[#0084B4] origin-left"
          />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-3 gap-8 relative"
          >
            {STEPS.map((step) => (
              <motion.div key={step.step} variants={itemVariants} className="text-center">
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border-2 border-[#0084B4] text-[#0084B4] mb-5 shadow-sm">
                  <step.icon className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#7CB342] text-white text-[10px] font-extrabold flex items-center justify-center">
                    {step.step.slice(-1)}
                  </span>
                </div>
                <span className="block text-xs font-extrabold uppercase tracking-wider text-[#7CB342] mb-2">
                  Step {step.step}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile timeline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="md:hidden space-y-8 pl-6 border-l-2 border-[#0084B4]/30"
        >
          {STEPS.map((step) => (
            <motion.div key={step.step} variants={itemVariants} className="relative">
              <div className="absolute -left-[calc(1.5rem+5px)] top-0 w-3 h-3 rounded-full bg-[#0084B4] ring-4 ring-[#E1F0F5]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#7CB342]">Step {step.step}</span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
