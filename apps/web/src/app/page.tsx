import React from 'react';
import Link from 'next/link';
import { FAIRGIG_SERVICES, USER_ROLES } from '@fairgig/contracts';
import { ArrowRight, BarChart3, ShieldCheck, Layers, Users, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-12 border-b border-[#E7E5E4] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 mb-3 text-xs font-medium tracking-wide text-[#1E3A2F] uppercase bg-[#E2ECE6] rounded-full border border-[#C5D9CE]">
              Phase 4 Application Active
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917]">
              FairGig Platform
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#78716C] max-w-2xl leading-relaxed">
              Gig worker income verification, collective dispute advocacy, and transparent analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="btn-press focus-ring px-4 py-2 border border-[#E7E5E4] bg-white rounded-lg text-xs font-medium text-[#44403C] hover:bg-stone-50 transition shadow-2xs"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="btn-press focus-ring px-4.5 py-2 bg-[#1E3A2F] hover:bg-[#234737] text-white rounded-lg text-xs font-medium transition shadow-2xs flex items-center gap-1.5"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Role Workspace Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link
          href="/dashboard"
          className="p-5 bg-white rounded-xl border border-[#E7E5E4] shadow-2xs hover:border-[#1E3A2F] transition group block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-[#1E3A2F]" />
              <h3 className="font-semibold text-sm text-[#1C1917]">Worker Dashboard</h3>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
              Active
            </span>
          </div>
          <p className="text-xs text-[#78716C] mb-4 leading-relaxed">
            Upload pay slips, log daily shifts, run anomaly detection, compare city medians, and export verifiable income certificates.
          </p>
          <div className="text-[11px] font-medium text-[#1E3A2F] group-hover:underline flex items-center gap-1">
            <span>Enter Worker Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/advocate"
          className="p-5 bg-white rounded-xl border border-[#E7E5E4] shadow-2xs hover:border-[#1E3A2F] transition group block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-purple-700" />
              <h3 className="font-semibold text-sm text-[#1C1917]">Advocate Intelligence</h3>
            </div>
            <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-medium">
              Active
            </span>
          </div>
          <p className="text-xs text-[#78716C] mb-4 leading-relaxed">
            Cluster collective grievances, audit platform deduction percentages, monitor worker vulnerability, and enforce k &ge; 5 privacy.
          </p>
          <div className="text-[11px] font-medium text-purple-700 group-hover:underline flex items-center gap-1">
            <span>Enter Advocate Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/verifier"
          className="p-5 bg-white rounded-xl border border-[#E7E5E4] shadow-2xs hover:border-[#1E3A2F] transition group block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-700" />
              <h3 className="font-semibold text-sm text-[#1C1917]">Verifier Audit Queue</h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-medium">
              Active
            </span>
          </div>
          <p className="text-xs text-[#78716C] mb-4 leading-relaxed">
            Audit pay stub OCR screenshots in private storage, verify shift authenticity, flag discrepancies, and sign ledger reviews.
          </p>
          <div className="text-[11px] font-medium text-blue-700 group-hover:underline flex items-center gap-1">
            <span>Enter Verifier Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </section>

      {/* Service Architecture Table */}
      <section className="bg-white rounded-xl border border-[#E7E5E4] p-5 shadow-2xs">
        <h2 className="text-sm font-semibold text-[#1C1917] mb-3">Live Microservice Registry &bull; 6 Operational Services</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF8] text-[#78716C] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Runtime</th>
                <th className="py-2.5 px-4">Default Port</th>
                <th className="py-2.5 px-4">Health Probe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA] font-mono text-[11px]">
              {FAIRGIG_SERVICES.map((s) => (
                <tr key={s.name} className="hover:bg-[#FAFAF8] transition">
                  <td className="py-2.5 px-4 font-semibold text-[#1C1917]">{s.name}</td>
                  <td className="py-2.5 px-4 text-[#78716C]">{s.runtime}</td>
                  <td className="py-2.5 px-4 text-[#78716C]">:{s.defaultPort}</td>
                  <td className="py-2.5 px-4 text-emerald-700">{s.healthPath}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
