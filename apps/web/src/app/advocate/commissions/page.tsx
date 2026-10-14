'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { KpiSkeleton } from '@/components/ui/skeleton';

function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E1E4EA] p-3 rounded-lg shadow-sm text-xs space-y-1.5">
        <div className="font-semibold text-[#22252A] capitalize">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-[#5B6370] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-semibold text-[#22252A] tabular-nums">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiClient.getCommissionTrends();
        setCommissions(data);
      } catch (err) {
        console.error('Failed to load commission trends:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell
      title="Commission Intelligence"
      subtitle="Auditing gig platform take-rates, hidden fees, and historical commission creeps."
    >
      {/* Commission Metric Cards */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {commissions.map((p) => (
            <div key={p.platform} className="card-subtle p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[#5B6370] capitalize">{p.platform}</span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md uppercase border ${
                    p.trendDirection === 'increasing'
                      ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                      : 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                  }`}
                >
                  {p.trendDirection}
                </span>
              </div>
              <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
                {p.averageDeductionPercentage}%
              </div>
              <div className="text-xs text-[#5B6370] mt-1 tabular-nums">
                Median: <strong className="text-[#22252A]">{p.medianDeductionPercentage}%</strong> &bull; {p.shiftCount} shifts sampled
              </div>
              <div className="mt-3 pt-2 border-t border-[#E1E4EA] text-[11px] text-[#5B6370]">
                Worker cohort size: {p.workerCount} distinct drivers
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visual Recharts Bar Comparison: Average vs Median with Botanical Palette */}
      <div className="card-subtle p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Platform Take-Rate Comparison</h3>
            <p className="text-xs text-[#5B6370]">Comparing Average vs. Median commission percentage across apps</p>
          </div>
          <span className="text-[10px] bg-[#FAF9F5] text-[#5B6370] border border-[#E1E4EA] px-2.5 py-1 rounded-md font-medium">
            Botanical Palette
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commissions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E4EA" vertical={false} />
              <XAxis dataKey="platform" stroke="#5B6370" fontSize={11} tickLine={false} />
              <YAxis stroke="#5B6370" fontSize={11} tickLine={false} unit="%" />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar
                name="Average Commission %"
                dataKey="averageDeductionPercentage"
                fill="#1B4332"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Median Commission %"
                dataKey="medianDeductionPercentage"
                fill="#40916C"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Commission Table */}
      <div className="card-subtle p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Commission Audit Ledger</h3>
          <p className="text-xs text-[#5B6370]">Comparative deduction ratios across Pakistani delivery &amp; rideshare services</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E1E4EA] text-[#5B6370] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-medium">Platform</th>
                <th className="py-2.5 px-4 text-center font-medium">Sample Shifts</th>
                <th className="py-2.5 px-4 text-center font-medium">Driver Cohort</th>
                <th className="py-2.5 px-4 text-right font-medium">Average Take-Rate</th>
                <th className="py-2.5 px-4 text-right font-medium">Median Cut</th>
                <th className="py-2.5 px-4 text-center font-medium">Trend Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E4EA]">
              {commissions.map((c) => (
                <tr key={c.platform} className="hover:bg-[#F3F3F0]/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#22252A] capitalize">{c.platformName || c.platform}</td>
                  <td className="py-3 px-4 text-center font-medium text-[#5B6370] tabular-nums">{c.shiftCount} shifts</td>
                  <td className="py-3 px-4 text-center text-[#5B6370] tabular-nums">{c.workerCount} drivers</td>
                  <td className="py-3 px-4 text-right font-semibold text-[#22252A] tabular-nums">{c.averageDeductionPercentage}%</td>
                  <td className="py-3 px-4 text-right font-medium text-[#5B6370] tabular-nums">{c.medianDeductionPercentage}%</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        c.trendDirection === 'increasing' ? 'text-[#DC2626]' : 'text-[#2D6A4F]'
                      }`}
                    >
                      {c.trendDirection === 'increasing' ? (
                        <TrendingUp className="w-3 h-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="w-3 h-3" aria-hidden="true" />
                      )}
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
