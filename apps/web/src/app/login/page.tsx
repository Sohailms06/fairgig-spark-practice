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
        setError('Invalid email or password. You can also use the demo accounts below.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify service connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#1B4332] text-white font-medium text-sm flex items-center justify-center mx-auto mb-3">
            FG
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#22252A]">Welcome back</h1>
          <p className="text-sm text-[#5B6370] mt-1">
            Sign in to your FairGig account.
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mb-6 p-4 bg-white border border-[#E1E4EA] rounded-xl">
          <div className="text-xs font-semibold text-[#22252A] mb-2.5">
            Quick sign-in
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchDemoUser('worker')}
              className="text-left p-2.5 rounded-lg border border-[#E1E4EA] hover:border-[#1B4332] hover:bg-[#FAF9F5] transition-colors text-xs group cursor-pointer focus-ring"
            >
              <div className="font-semibold text-[#22252A] group-hover:text-[#1B4332]">Tariq Mehmood</div>
              <div className="text-xs text-[#5B6370]">Worker &bull; Lahore</div>
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('advocate')}
              className="text-left p-2.5 rounded-lg border border-[#E1E4EA] hover:border-[#1B4332] hover:bg-[#FAF9F5] transition-colors text-xs group cursor-pointer focus-ring"
            >
              <div className="font-semibold text-[#22252A] group-hover:text-[#1B4332]">Ayesha Siddiqui</div>
              <div className="text-xs text-[#5B6370]">Advocate</div>
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('verifier')}
              className="text-left p-2.5 rounded-lg border border-[#E1E4EA] hover:border-[#1B4332] hover:bg-[#FAF9F5] transition-colors text-xs group cursor-pointer focus-ring"
            >
              <div className="font-semibold text-[#22252A] group-hover:text-[#1B4332]">Fatima Noor</div>
              <div className="text-xs text-[#5B6370]">Verifier</div>
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('worker_b')}
              className="text-left p-2.5 rounded-lg border border-[#E1E4EA] hover:border-[#1B4332] hover:bg-[#FAF9F5] transition-colors text-xs group cursor-pointer focus-ring"
            >
              <div className="font-semibold text-[#22252A] group-hover:text-[#1B4332]">Usman Ali</div>
              <div className="text-xs text-[#5B6370]">Worker &bull; Rawalpindi</div>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="bg-white border border-[#E1E4EA] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-xs rounded-lg" role="alert">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5B6370] absolute left-3 top-3" aria-hidden="true" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="worker@fairgig.pk"
                  className="focus-ring w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5B6370] absolute left-3 top-3.5" aria-hidden="true" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="focus-ring w-full py-2.5 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
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

          <div className="mt-5 text-center text-xs text-[#5B6370]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-[#1B4332] hover:underline focus-ring rounded">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
