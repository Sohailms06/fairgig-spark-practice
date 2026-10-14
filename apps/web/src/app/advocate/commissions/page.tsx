'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Percent,
  Layers,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient.getCommissionTrends();
        setCommissions(data);
      } catch (err) {
        console.error('Failed to load commission trends:', err);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell
      title="Platform Commission Intelligence"
      subtitle="Auditing gig platform take-rates, hidden fees, and historical commission creeps"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {commissions.map((p) => (
          <div key={p.platform} className="card-subtle p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#78716C] capitalize">{p.platform}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  p.trendDirection === 'increasing'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {p.trendDirection}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
              {p.averageDeductionPercentage}%
            </div>
            <div className="text-[11px] text-[#78716C] mt-1">
              Median: <strong>{p.medianDeductionPercentage}%</strong> &bull; {p.shiftCount} shifts sampled
            </div>
            <div className="mt-3 pt-2 border-t border-[#F0EFEA] text-[10px] text-[#78716C]">
              Worker cohort size: {p.workerCount} distinct drivers
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Commission Table */}
      <div className="card-subtle p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#1C1917]">Detailed Commission Audit Breakdown</h3>
          <p className="text-xs text-[#78716C]">Comparative deduction ratios across Pakistani delivery &amp; rideshare apps</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E7E5E4] text-[#78716C] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4 text-center">Sample Shifts</th>
                <th className="py-3 px-4 text-center">Driver Cohort</th>
                <th className="py-3 px-4 text-right">Average Take-Rate</th>
                <th className="py-3 px-4 text-right">Median Cut</th>
                <th className="py-3 px-4 text-center">Trend Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {commissions.map((c) => (
                <tr key={c.platform} className="hover:bg-[#FAFAF8] transition">
                  <td className="py-3 px-4 font-semibold text-[#1C1917] capitalize">{c.platformName || c.platform}</td>
                  <td className="py-3 px-4 text-center font-bold text-[#44403C]">{c.shiftCount} shifts</td>
                  <td className="py-3 px-4 text-center text-[#44403C]">{c.workerCount} drivers</td>
                  <td className="py-3 px-4 text-right font-bold text-[#1C1917]">{c.averageDeductionPercentage}%</td>
                  <td className="py-3 px-4 text-right font-medium text-[#44403C]">{c.medianDeductionPercentage}%</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        c.trendDirection === 'increasing' ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {c.trendDirection === 'increasing' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span className="capitalize">{c.trendDirection}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
