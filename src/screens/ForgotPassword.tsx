import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';

export function ForgotPassword() {
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
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Forgot Password?</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Enter your email address and we'll send you a temporary password to sign in.
          </p>
        </div>

        {!isSubmitted ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0084B4] focus:border-transparent transition-all font-medium sm:text-sm"
                  placeholder="you@school.edu"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#0084B4] hover:bg-[#006A91] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0084B4] transition-all disabled:opacity-60"
            >
              {isLoading ? 'Sending…' : 'Send Reset Email'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
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
              className="text-sm font-bold text-[#0084B4] hover:underline"
            >
              Try another email
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Remember your password?{' '}
            <Link to="/login" className="font-bold text-[#0084B4] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
