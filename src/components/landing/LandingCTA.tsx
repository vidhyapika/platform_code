import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0084B4] via-[#007099] to-[#006A91] px-8 py-14 sm:px-16 sm:py-16 text-center"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7CB342]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to begin?
            </h2>
            <p className="mt-4 text-white/80 font-medium max-w-lg mx-auto">
              Sign in to access your curriculum, track progress, and start learning today.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-white text-[#0084B4] hover:bg-slate-50 rounded-xl transition-colors"
            >
              Student Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
