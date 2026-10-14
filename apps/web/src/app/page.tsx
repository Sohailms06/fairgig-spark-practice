import React from 'react';
import Link from 'next/link';
import { FAIRGIG_SERVICES } from '@fairgig/contracts';
import { ArrowRight, BarChart3, ShieldCheck, Layers, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <header className="mb-14 pb-10 border-b border-[#E1E4EA]">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 text-[10px] font-medium tracking-wider uppercase text-[#1B4332] bg-[#FAF9F5] rounded-md border border-[#E1E4EA]">
              <Sparkles className="w-3 h-3 text-[#2D6A4F]" aria-hidden="true" />
              <span>Gig Worker Financial Protection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#22252A]">
              FairGig
            </h1>
            <p className="mt-2 text-xl font-medium text-[#1B4332] tracking-tight">
              Fair income. Verified work. Stronger rights.
            </p>
            <p className="mt-3 text-sm text-[#5B6370] leading-relaxed">
              FairGig provides gig economy workers in Pakistan with tamper-proof income verification, statistical deduction anomaly detection, and privacy-preserving collective advocacy.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="focus-ring px-4 py-2 border border-[#E1E4EA] bg-white rounded-lg text-xs font-medium text-[#22252A] hover:bg-[#F3F3F0] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="focus-ring px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Launch Overview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Role Workspaces */}
      <section className="mb-14">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#22252A] tracking-tight">Role-Based Workspaces</h2>
          <p className="text-xs text-[#5B6370]">Direct entry points into FairGig&apos;s verified financial infrastructure</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Worker Portal */}
          <Link
            href="/dashboard"
            className="p-6 bg-white rounded-xl border border-[#E1E4EA] hover:border-[#1B4332] transition-colors group block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-[#E1E4EA] flex items-center justify-center text-[#1B4332]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-[#22252A]">Worker Overview</h3>
              </div>
              <span className="text-[10px] bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20 px-2 py-0.5 rounded-md font-medium">
                Active
              </span>
            </div>
            <p className="text-xs text-[#5B6370] mb-5 leading-relaxed">
              Track multi-platform shifts, detect fee clawbacks with live Z-score tests, and generate official SHA-256 income certificates.
            </p>
            <div className="text-xs font-medium text-[#1B4332] group-hover:text-[#2D6A4F] flex items-center gap-1">
              <span>Enter Worker Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Advocate Intelligence */}
          <Link
            href="/advocate"
            className="p-6 bg-white rounded-xl border border-[#E1E4EA] hover:border-[#1B4332] transition-colors group block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-[#E1E4EA] flex items-center justify-center text-[#2563EB]">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-[#22252A]">Advocate Intelligence</h3>
              </div>
              <span className="text-[10px] bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 px-2 py-0.5 rounded-md font-medium">
                Active
              </span>
            </div>
            <p className="text-xs text-[#5B6370] mb-5 leading-relaxed">
              Cluster collective grievances, audit platform deduction trends, monitor income collapse, and enforce k &ge; 5 privacy.
            </p>
            <div className="text-xs font-medium text-[#2563EB] group-hover:text-[#1D4ED8] flex items-center gap-1">
              <span>Enter Advocate Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Verifier Queue */}
          <Link
            href="/verifier"
            className="p-6 bg-white rounded-xl border border-[#E1E4EA] hover:border-[#1B4332] transition-colors group block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-[#E1E4EA] flex items-center justify-center text-[#2D6A4F]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-[#22252A]">Verifier Queue</h3>
              </div>
              <span className="text-[10px] bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20 px-2 py-0.5 rounded-md font-medium">
                Active
              </span>
            </div>
            <p className="text-xs text-[#5B6370] mb-5 leading-relaxed">
              Review OCR pay stub proof in isolated storage, confirm statement totals, and sign cryptographic verification decisions.
            </p>
            <div className="text-xs font-medium text-[#2D6A4F] group-hover:text-[#1B4332] flex items-center gap-1">
              <span>Enter Verifier Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Operational System Infrastructure Footer Note */}
      <footer className="pt-8 border-t border-[#E1E4EA] text-xs text-[#5B6370]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
            <span className="font-medium text-[#22252A]">Cryptographic Ledger &amp; Microservices Active</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            {FAIRGIG_SERVICES.map((s) => (
              <span key={s.name} className="hover:text-[#22252A]">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
