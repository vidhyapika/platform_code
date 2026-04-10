import React from 'react';
import { Logo } from './Logo';
import { Medal } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">
        
        {/* Left Side - Branding */}
        <div className="hidden md:flex md:w-5/12 relative p-12 flex-col justify-between overflow-hidden">
          {/* Soft Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#E1F0F5] via-[#EAF5E1] to-white opacity-80"></div>
          
          <div className="relative z-10">
            <Logo />
          </div>

          <div className="relative z-10 mt-20 mb-auto">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#0084B4]">
              Unlock Your <br/>
              <span className="text-[#7CB342]">Academic</span> <br/>
              Potential.
            </h1>
            <p className="mt-6 text-slate-600 text-lg max-w-sm font-medium leading-relaxed">
              Designed for Grades 6-10, Vidhyapika provides a premium digital learning experience that makes discovery effortless.
            </p>
          </div>

          {/* Testimonial Card */}
          <div className="relative z-10 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#EAF5E1] p-2 rounded-lg">
                <Medal className="w-5 h-5 text-[#7CB342]" />
              </div>
              <span className="font-bold text-slate-800">Top Performer</span>
            </div>
            <p className="text-sm text-slate-600 italic mb-4">
              "The interface is so clean, I actually enjoy doing my assignments now!"
            </p>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
              <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white -ml-2"></div>
              <div className="w-6 h-6 rounded-full bg-slate-400 border-2 border-white -ml-2"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-16 relative bg-white">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
