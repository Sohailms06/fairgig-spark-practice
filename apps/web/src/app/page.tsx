import React from 'react';
import { FAIRGIG_SERVICES, USER_ROLES } from '@fairgig/contracts';

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-12 border-b border-slate-200 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wider text-indigo-700 uppercase bg-indigo-50 rounded-full border border-indigo-200">
              Phase 0 Foundation Active
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              FairGig Platform
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Gig Worker Income Verification, Rights Advocacy & Transparent Analytics.
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs text-slate-500 font-mono">Dev A: Services & Contracts</span>
            <br />
            <span className="text-xs text-indigo-600 font-mono font-bold">Dev B: Frontend UI Ready</span>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Worker Dashboard</h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">Ready</span>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Upload pay slips, log daily shifts, run anomaly detection, and export verified income certificates.
          </p>
          <div className="text-xs font-mono text-slate-400">Target Role: {USER_ROLES.WORKER}</div>
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Verifier Portal</h3>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">Ready</span>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Audit OCR screenshot uploads, verify shift authenticity, and resolve payout discrepancies.
          </p>
          <div className="text-xs font-mono text-slate-400">Target Role: {USER_ROLES.VERIFIER}</div>
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Advocate Intelligence</h3>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">Ready</span>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Cluster collective grievances, track platform deductions, and view k-anonymity aggregate earnings.
          </p>
          <div className="text-xs font-mono text-slate-400">Target Role: {USER_ROLES.ADVOCATE}</div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Architecture & Service Registry</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Runtime</th>
                <th className="py-3 px-4">Default Port</th>
                <th className="py-3 px-4">Health Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {FAIRGIG_SERVICES.map((s) => (
                <tr key={s.name} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.runtime}</td>
                  <td className="py-3 px-4 text-slate-600">:{s.defaultPort}</td>
                  <td className="py-3 px-4 text-indigo-600">{s.healthPath}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
