import { motion } from 'motion/react';
import { Brain, Calendar, Medal, Star } from 'lucide-react';
import { containerVariants, itemVariants } from './shared';

const TESTIMONIALS = [
  {
    quote: 'The interface is so clean, I actually enjoy doing my assignments now! The AI tutor helps me understand concepts I used to struggle with.',
    name: 'Priya S.',
    grade: 'Grade 9',
    rating: 5,
  },
  {
    quote: 'Voice classroom sessions made algebra click for me. Being able to ask questions live and see problems on the whiteboard is a game changer.',
    name: 'Arjun M.',
    grade: 'Grade 8',
    rating: 5,
  },
  {
    quote: 'I love tracking my streak and badges — it keeps me motivated. The curriculum path shows exactly what to learn next.',
    name: 'Sneha K.',
    grade: 'Grade 10',
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

export function LandingTestimonials() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-[#F8F9FA] to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start mb-12"
        >
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Built for students who want to{' '}
              <span className="text-[#7CB342]">enjoy learning</span>
            </h2>
            <p className="mt-4 text-slate-600 font-medium leading-relaxed">
              Vidhyapika Learning Solutions delivers a premium digital experience for middle and high school students.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Calendar className="w-4 h-4 text-[#0084B4]" />
                Personal schedule
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Medal className="w-4 h-4 text-[#7CB342]" />
                Badges & streaks
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Brain className="w-4 h-4 text-indigo-600" />
                AI coaching
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={itemVariants}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <Stars count={t.rating} />
                <p className="mt-3 text-sm text-slate-600 italic leading-relaxed">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{t.name}</p>
                  <p className="text-xs font-medium text-slate-500">{t.grade}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
