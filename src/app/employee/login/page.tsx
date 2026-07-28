'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { employeeLogin } from '@/lib/actions/auth';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await employeeLogin(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/employee/dashboard');
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-accent-400 shadow-lg shadow-emerald-500/30">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GATSI COMMS</h1>
          <p className="mt-1 text-sm text-indigo-300/60">Employee Portal</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white">Sign In</h2>
          <p className="mt-1 text-sm text-indigo-300/60">Enter your credentials to access your dashboard</p>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-indigo-200">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@gatsicomms.com"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-indigo-400/40 outline-none transition-all focus:border-emerald-400/50 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-indigo-200">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-sm text-white placeholder-indigo-400/40 outline-none transition-all focus:border-emerald-400/50 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400/50 hover:text-indigo-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <a href="/" className="text-xs text-indigo-400/50 hover:text-indigo-300">
              Admin Login
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-indigo-400/30">
          Contact your administrator if you need login access
        </p>
      </div>
    </div>
  );
}
