import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminAuthLayout } from '../../components/AdminAuthLayout';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/admin/dashboard');
  };

  return (
    <AdminAuthLayout>
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Admin Portal</h2>
        <p className="text-slate-500 font-medium">Please sign in to access the dashboard.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 block">Admin Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="email" 
              className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400" 
              placeholder="admin@vidhyapika.edu" 
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 block">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400" 
              placeholder="••••••••" 
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5">
              <input type="checkbox" className="peer sr-only" />
              <div className="w-5 h-5 border-2 border-slate-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Keep me signed in</span>
          </label>

          <div className="text-sm">
            <Link to="/admin/forgot-password" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-4"
        >
          Sign In to Admin Portal
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </AdminAuthLayout>
  );
}
