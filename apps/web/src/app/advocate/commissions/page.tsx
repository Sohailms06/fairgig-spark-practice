'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Filter,
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
import { Select } from '@/components/ui/select';

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
  const [platformFilter, setPlatformFilter] = useState('all');

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

  const filteredCommissions = commissions.filter((c) => {
    if (platformFilter !== 'all' && c.platform.toLowerCase() !== platformFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <AppShell
      title="Commissions"
      subtitle="Platform take-rates, fee distributions, and historical trends."
    >
      {/* Commission Metric Cards */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {commissions.map((p) => (
            <div key={p.platform} className="card-subtle p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#5B6370] capitalize">{p.platform}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-md uppercase border ${
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
                Median: <strong className="text-[#22252A]">{p.medianDeductionPercentage}%</strong> &bull; {p.shiftCount} shifts
              </div>
              <div className="mt-3 pt-2 border-t border-[#E1E4EA] text-xs text-[#5B6370]">
                {p.workerCount} drivers sampled
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visual Recharts Bar Comparison: Average vs Median */}
      {/* Visual Recharts Bar Comparison: Average vs Median */}
      <div className="card-subtle p-4 sm:p-6 mb-8 min-w-0 overflow-hidden">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Platform take-rate comparison</h3>
          <p className="text-xs text-[#5B6370]">Average vs. median commission percentage across platforms</p>
        </div>

        <div className="h-56 sm:h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commissions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E4EA" vertical={false} />
              <XAxis dataKey="platform" stroke="#5B6370" fontSize={11} tickLine={false} />
              <YAxis stroke="#5B6370" fontSize={11} tickLine={false} unit="%" />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar
                name="Average commission %"
                dataKey="averageDeductionPercentage"
                fill="#1B4332"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Median commission %"
                dataKey="medianDeductionPercentage"
                fill="#40916C"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Commission Table */}
      <div className="card-subtle p-4 sm:p-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Commission ledger</h3>
            <p className="text-xs text-[#5B6370]">Deduction ratios across delivery and rideshare platforms</p>
          </div>

          <Select
            value={platformFilter}
            onValueChange={setPlatformFilter}
            icon={<Filter className="w-4 h-4 text-[#5B6370]" aria-hidden="true" />}
            className="w-full sm:w-44"
            aria-label="Filter commissions by platform"
            options={[
              { value: 'all', label: 'All platforms' },
              { value: 'careem', label: 'Careem' },
              { value: 'indrive', label: 'inDrive' },
              { value: 'foodpanda', label: 'Foodpanda' },
              { value: 'bykea', label: 'Bykea' },
            ]}
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto min-w-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E1E4EA] text-[#5B6370] text-xs font-medium">
                <th className="py-3 px-4 font-medium">Platform</th>
                <th className="py-3 px-4 text-center font-medium">Sample shifts</th>
                <th className="py-3 px-4 text-center font-medium">Drivers</th>
                <th className="py-3 px-4 text-right font-medium">Average take-rate</th>
                <th className="py-3 px-4 text-right font-medium">Median cut</th>
                <th className="py-3 px-4 text-center font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E4EA]">
              {filteredCommissions.map((c) => (
                <tr key={c.platform} className="hover:bg-[#F3F3F0]/60 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-[#22252A] capitalize">{c.platformName || c.platform}</td>
                  <td className="py-3.5 px-4 text-center text-[#5B6370] tabular-nums">{c.shiftCount} shifts</td>
                  <td className="py-3.5 px-4 text-center text-[#5B6370] tabular-nums">{c.workerCount} drivers</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-[#22252A] tabular-nums">{c.averageDeductionPercentage}%</td>
                  <td className="py-3.5 px-4 text-right text-[#5B6370] tabular-nums">{c.medianDeductionPercentage}%</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        c.trendDirection === 'increasing' ? 'text-[#DC2626]' : 'text-[#2D6A4F]'
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

        {/* Mobile Stacked Cards View */}
        <div className="block md:hidden divide-y divide-[#E1E4EA]">
          {filteredCommissions.map((c) => (
            <div key={c.platform} className="p-4 hover:bg-[#FAF9F5] transition-colors space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-[#22252A] capitalize">{c.platformName || c.platform}</span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${
                    c.trendDirection === 'increasing'
                      ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                      : 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                  }`}
                >
                  {c.trendDirection === 'increasing' ? (
                    <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="w-3 h-3" aria-hidden="true" />
                  )}
                  <span className="capitalize">{c.trendDirection}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-xs text-[#5B6370] block">Average take-rate</span>
                  <span className="text-lg font-semibold text-[#22252A] tabular-nums">{c.averageDeductionPercentage}%</span>
                </div>
                <div>
                  <span className="text-xs text-[#5B6370] block">Median cut</span>
                  <span className="text-lg font-semibold text-[#5B6370] tabular-nums">{c.medianDeductionPercentage}%</span>
                </div>
              </div>

              <div className="text-xs text-[#5B6370] pt-1 border-t border-[#E1E4EA] flex items-center justify-between">
                <span>{c.shiftCount} shifts sampled</span>
                <span>{c.workerCount} drivers</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
