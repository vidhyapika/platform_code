import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminAuthLayout } from '../../components/AdminAuthLayout';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';

export function AdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send reset email');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminAuthLayout>
      <div className="mb-10">
        <Link to="/admin/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Login
        </Link>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Reset Admin Password</h2>
        <p className="text-slate-500 font-medium">Enter your admin email address and we'll send you a temporary password to sign in.</p>
      </div>

      {!isSubmitted ? (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-sm font-bold text-slate-700 block">Admin Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="admin@vidhyapika.edu"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-4 disabled:opacity-60"
          >
            {isLoading ? 'Sending…' : 'Send Reset Email'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-bold text-green-800 mb-2">Check your email</h3>
          <p className="text-sm text-green-600 font-medium mb-6">
            If an account exists for <span className="font-bold">{email}</span>, we've sent login instructions with a temporary password.
          </p>
          <button
            onClick={() => { setIsSubmitted(false); setEmail(''); }}
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            Try another email
          </button>
        </div>
      )}
    </AdminAuthLayout>
  );
}
