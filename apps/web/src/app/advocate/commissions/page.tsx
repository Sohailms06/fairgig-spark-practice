'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Percent,
  Layers,
  ShieldCheck,
  Scale,
  BarChart3,
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
import { KpiSkeleton, ChartSkeleton } from '@/components/ui/skeleton';

function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E7E5E4] p-3 rounded-xl shadow-lg text-xs space-y-1.5">
        <div className="font-bold text-[#1C1917] capitalize">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-[#78716C] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-bold text-[#1C1917]">{entry.value}%</span>
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
      title="Platform Commission Intelligence"
      subtitle="Auditing gig platform take-rates, hidden fees, and historical commission creeps"
    >
      {/* Commission Metric Cards */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      )}

      {/* Visual Recharts Bar Comparison: Average vs Median */}
      <div className="card-subtle p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">Platform Take-Rate Comparison</h3>
            <p className="text-xs text-[#78716C]">Comparing Average vs. Median commission percentage across apps</p>
          </div>
          <span className="text-[10px] bg-stone-100 text-[#44403C] px-2.5 py-1 rounded-md font-mono">
            Recharts Bar Series
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commissions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
              <XAxis dataKey="platform" stroke="#78716C" fontSize={11} tickLine={false} />
              <YAxis stroke="#78716C" fontSize={11} tickLine={false} unit="%" />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar
                name="Average Commission %"
                dataKey="averageDeductionPercentage"
                fill="#1E3A2F"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Median Commission %"
                dataKey="medianDeductionPercentage"
                fill="#7F9E8B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
                <th className="py-3 px-4 font-semibold">Platform</th>
                <th className="py-3 px-4 text-center font-semibold">Sample Shifts</th>
                <th className="py-3 px-4 text-center font-semibold">Driver Cohort</th>
                <th className="py-3 px-4 text-right font-semibold">Average Take-Rate</th>
                <th className="py-3 px-4 text-right font-semibold">Median Cut</th>
                <th className="py-3 px-4 text-center font-semibold">Trend Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {commissions.map((c) => (
                <tr key={c.platform} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#1C1917] capitalize">{c.platformName || c.platform}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#44403C]">{c.shiftCount} shifts</td>
                  <td className="py-3.5 px-4 text-center text-[#44403C]">{c.workerCount} drivers</td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#1C1917]">{c.averageDeductionPercentage}%</td>
                  <td className="py-3.5 px-4 text-right font-medium text-[#44403C]">{c.medianDeductionPercentage}%</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        c.trendDirection === 'increasing' ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {c.trendDirection === 'increasing' ? (
                        <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
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
