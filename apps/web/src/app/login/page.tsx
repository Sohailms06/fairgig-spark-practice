'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login, switchDemoUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const ok = await login(email, password);
      if (!ok) {
        setError('Invalid email or password. You can also select a quick demo account below.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify service connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col lg:flex-row">
      {/* LEFT PANEL: Enterprise Forest-Green Split Screen (Desktop >= lg) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B4332] text-white p-12 lg:p-16 xl:p-20 flex-col justify-between select-none">
        {/* Top Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white font-semibold text-sm flex items-center justify-center">
            FG
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">FairGig</span>
        </div>

        {/* Center Copy */}
        <div className="max-w-md space-y-4 my-auto">
          <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight text-white">
            Fair work deserves fair pay.
          </h1>
          <p className="text-base text-white/80 leading-relaxed font-normal">
            Track earnings, understand deductions, and protect your rights.
          </p>
        </div>

        {/* Subtle Bottom Line */}
        <div className="pt-8 border-t border-white/10 text-xs text-white/60 font-mono tracking-wider uppercase">
          Income clarity. Worker confidence.
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#FAF9F5] lg:bg-white min-h-screen">
        <div className="w-full max-w-[420px]">
          {/* Mobile-only branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#1B4332] text-white font-medium text-sm flex items-center justify-center mx-auto mb-3 shadow-sm">
              FG
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#22252A]">FairGig</h1>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[#22252A]">Welcome back</h1>
            <p className="text-sm text-[#5B6370] mt-1">
              Sign in to your account.
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="mb-6 p-3.5 bg-white lg:bg-[#FAF9F5] border border-[#E1E4EA] rounded-xl">
            <div className="text-xs font-semibold text-[#22252A] mb-2">
              Quick demo sign-in
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => switchDemoUser('worker')}
                className="text-left p-2.5 rounded-lg border border-[#E1E4EA] bg-white hover:border-[#1B4332] hover:bg-[#FAF9F5] transition-colors text-xs group cursor-pointer focus-ring"
              >
                <div className="font-semibold text-[#22252A] group-hover:text-[#1B4332] truncate">Tariq Mehmood</div>
                <div className="text-xs text-[#5B6370] truncate">Worker &bull; Lahore</div>
              </button>
              <button
                type="button"
                onClick={() => switchDemoUser('advocate')}
                className="text-left p-2.5 rounded-lg border border-[#E1E4EA] bg-white hover:border-[#1B4332] hover:bg-[#FAF9F5] transition-colors text-xs group cursor-pointer focus-ring"
              >
                <div className="font-semibold text-[#22252A] group-hover:text-[#1B4332] truncate">Ayesha Siddiqui</div>
                <div className="text-xs text-[#5B6370] truncate">Advocate</div>
              </button>
              <button
                type="button"
                onClick={() => switchDemoUser('verifier')}
                className="text-left p-2.5 rounded-lg border border-[#E1E4EA] bg-white hover:border-[#1B4332] hover:bg-[#FAF9F5] transition-colors text-xs group cursor-pointer focus-ring"
              >
                <div className="font-semibold text-[#22252A] group-hover:text-[#1B4332] truncate">Fatima Noor</div>
                <div className="text-xs text-[#5B6370] truncate">Verifier</div>
              </button>
              <button
                type="button"
                onClick={() => switchDemoUser('worker_b')}
                className="text-left p-2.5 rounded-lg border border-[#E1E4EA] bg-white hover:border-[#1B4332] hover:bg-[#FAF9F5] transition-colors text-xs group cursor-pointer focus-ring"
              >
                <div className="font-semibold text-[#22252A] group-hover:text-[#1B4332] truncate">Usman Ali</div>
                <div className="text-xs text-[#5B6370] truncate">Worker &bull; Rawalpindi</div>
              </button>
            </div>
          </div>

          {/* Credentials Form */}
          <div className="bg-white lg:bg-transparent lg:border-0 border border-[#E1E4EA] rounded-xl p-6 lg:p-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-xs rounded-lg" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-[#5B6370] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5B6370] absolute left-3.5 top-3.5" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="worker@fairgig.pk"
                    className="focus-ring w-full pl-10 pr-3.5 py-2.5 min-h-[46px] text-base sm:text-sm border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-[#5B6370] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5B6370] absolute left-3.5 top-3.5" aria-hidden="true" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="focus-ring w-full pl-10 pr-3.5 py-2.5 min-h-[46px] text-base sm:text-sm border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="focus-ring w-full min-h-[46px] py-2.5 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#5B6370]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-[#1B4332] hover:underline focus-ring rounded">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
