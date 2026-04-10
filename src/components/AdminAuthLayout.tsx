import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck } from 'lucide-react';

export function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">
        
        {/* Left Side - Branding */}
        <div className="hidden md:flex md:w-5/12 relative p-12 flex-col justify-between overflow-hidden bg-slate-900 text-white">
          {/* Soft Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black opacity-80"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black text-slate-900">V</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Vidhyapika <span className="text-blue-400 font-medium text-lg">Admin</span></span>
            </div>
          </div>

          <div className="relative z-10 mt-20 mb-auto">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
              Manage <br/>
              <span className="text-blue-400">Education</span> <br/>
              Platform.
            </h1>
            <p className="mt-6 text-slate-400 text-lg max-w-sm font-medium leading-relaxed">
              Access the administrative portal to manage courses, students, and platform settings.
            </p>
          </div>

          {/* Security Badge */}
          <div className="relative z-10 bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-700 max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-bold text-white">Secure Portal</span>
            </div>
            <p className="text-sm text-slate-400 italic">
              "This area is restricted to authorized administrators only. All actions are logged and monitored."
            </p>
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
