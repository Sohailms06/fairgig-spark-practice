'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth, DEMO_PROFILES } from '@/lib/auth-context';

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
        setError('Invalid email or password. You can also use the 1-click judge demo accounts below.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify service connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#1E3A2F] text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
            FG
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">FairGig Platform</h1>
          <p className="text-sm text-[#78716C] mt-1">
            Sign in to access your worker income ledger & dispute workspace
          </p>
        </div>

        {/* 1-Click Hackathon Judge Demo Switcher */}
        <div className="mb-6 p-4 bg-white border border-[#E7E5E4] rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Hackathon Judge 1-Click Sign-In
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded-full border border-emerald-200">
              Live Seed Profiles
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => switchDemoUser('worker')}
              className="text-left p-2.5 rounded-lg border border-[#E7E5E4] hover:border-emerald-500 hover:bg-[#F2F7F4] transition text-xs group"
            >
              <div className="font-semibold text-[#1C1917] group-hover:text-[#1E3A2F]">Tariq Mehmood</div>
              <div className="text-[10px] text-[#78716C]">Worker &bull; Lahore &bull; inDrive</div>
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('advocate')}
              className="text-left p-2.5 rounded-lg border border-[#E7E5E4] hover:border-emerald-500 hover:bg-[#F2F7F4] transition text-xs group"
            >
              <div className="font-semibold text-[#1C1917] group-hover:text-[#1E3A2F]">Ayesha Siddiqui</div>
              <div className="text-[10px] text-[#78716C]">Advocate &bull; K-Anonymity</div>
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('verifier')}
              className="text-left p-2.5 rounded-lg border border-[#E7E5E4] hover:border-emerald-500 hover:bg-[#F2F7F4] transition text-xs group"
            >
              <div className="font-semibold text-[#1C1917] group-hover:text-[#1E3A2F]">Fatima Noor</div>
              <div className="text-[10px] text-[#78716C]">Verifier &bull; Evidence Audit</div>
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('worker_b')}
              className="text-left p-2.5 rounded-lg border border-[#E7E5E4] hover:border-emerald-500 hover:bg-[#F2F7F4] transition text-xs group"
            >
              <div className="font-semibold text-[#1C1917] group-hover:text-[#1E3A2F]">Usman Ali</div>
              <div className="text-[10px] text-[#78716C]">Worker B &bull; Rawalpindi</div>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="worker@fairgig.pk"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A2F] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A2F] focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#1E3A2F] hover:bg-[#234737] text-white text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#78716C]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-[#1E3A2F] hover:underline">
              Register as Gig Worker
            </Link>
          </div>
        </div>

        {/* Security / Ledger Assurance Note */}
        <div className="mt-6 text-center text-xs text-[#78716C] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured with live Argon2 password hashing &amp; Bearer JWT</span>
        </div>
      </div>
    </div>
  );
}
