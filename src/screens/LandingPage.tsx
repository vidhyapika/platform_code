import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingShowcase } from '../components/landing/LandingShowcase';
import { LandingHowItWorks } from '../components/landing/LandingHowItWorks';
import { LandingTestimonials } from '../components/landing/LandingTestimonials';
import { LandingCTA } from '../components/landing/LandingCTA';
import { LandingFooter } from '../components/landing/LandingFooter';

export function LandingPage() {
  const { token, user, ready } = useAuth();

  if (!ready) {
    return <div className="min-h-screen bg-[#F8F9FA]" />;
  }

  if (token && user?.role === 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-slate-800">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingShowcase />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingCTA />
      <LandingFooter />
    </main>
  );
}
