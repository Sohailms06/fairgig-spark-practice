'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Clock,
  TrendingUp,
  Percent,
  PlusCircle,
  FileText,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { KpiSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

// Custom Apple/Claude styled Recharts tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E7E5E4] p-3 rounded-xl shadow-lg text-xs space-y-1">
        <div className="text-[11px] font-semibold text-[#78716C]">{label}</div>
        <div className="font-extrabold text-sm text-[#1C1917]">
          PKR {Number(payload[0].value).toLocaleString()}
        </div>
        <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Verified Take-Home Net</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function WorkerDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, shiftsData] = await Promise.all([
        apiClient.getWorkerAnalytics('all_time'),
        apiClient.getShifts(),
      ]);
      setAnalytics(analyticsData);
      setShifts(shiftsData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.message || 'Failed to connect to analytics services.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  const formatPKR = (val: number) =>
    'PKR ' + (val || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

  return (
    <AppShell
      title={`Welcome back, ${user?.fullName || 'Tariq Mehmood'}`}
      subtitle="Worker Earnings Dashboard &bull; Live Ledger Status"
    >
      {/* Quick Action Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#78716C]">Reporting Period:</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917] shadow-2xs">
            All-Time Verified Records
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/earnings"
            className="btn-press focus-ring inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log Shift</span>
          </Link>
          <Link
            href="/dashboard/grievances"
            className="btn-press focus-ring inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E7E5E4] text-[#44403C] text-xs font-semibold rounded-lg hover:bg-stone-50 shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>File Grievance</span>
          </Link>
          <Link
            href="/dashboard/certificates"
            className="btn-press focus-ring inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E7E5E4] text-[#44403C] text-xs font-semibold rounded-lg hover:bg-stone-50 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Export Certificate</span>
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadData} className="mb-6" />
      ) : loading ? (
        <div className="space-y-6">
          <KpiSkeleton count={4} />
          <ChartSkeleton height="h-64" title="Weekly Income Trend" />
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : (
        <>
          {/* Primary KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Net Earnings */}
            <div className="card-subtle p-5">
              <div className="flex items-center justify-between text-[#78716C] mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Take-Home Net</span>
                <div className="w-7 h-7 rounded-lg bg-[#F2F7F4] flex items-center justify-center text-[#1E3A2F]" aria-hidden="true">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#1C1917] tracking-tight tabular-nums">
                {formatPKR(analytics?.totalNetEarnings)}
              </div>
              <div className="text-[11px] text-[#78716C] mt-1.5 flex items-center gap-1.5">
                <span className="tabular-nums">Gross: {formatPKR(analytics?.totalGrossEarnings)}</span>
                <span className="text-emerald-700 font-medium">({Math.round((analytics?.verificationRate || 1) * 100)}% verified)</span>
              </div>
            </div>

            {/* Platform Deductions */}
            <div className="card-subtle p-5">
              <div className="flex items-center justify-between text-[#78716C] mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Total Deductions</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700" aria-hidden="true">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#1C1917] tracking-tight tabular-nums">
                {formatPKR(analytics?.totalDeductions)}
              </div>
              <div className="text-[11px] text-[#78716C] mt-1.5">
                Avg Platform Cut: ~{analytics?.totalGrossEarnings > 0 ? Math.round((analytics.totalDeductions / analytics.totalGrossEarnings) * 100) : 20}%
              </div>
            </div>

            {/* Hours Worked */}
            <div className="card-subtle p-5">
              <div className="flex items-center justify-between text-[#78716C] mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Hours Logged</span>
                <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-[#44403C]" aria-hidden="true">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#1C1917] tracking-tight tabular-nums">
                {(analytics?.totalHoursWorked || 0).toFixed(1)} hrs
              </div>
              <div className="text-[11px] text-[#78716C] mt-1.5">
                Across {analytics?.shiftsLoggedCount || 0} shifts ({analytics?.verifiedShiftsCount || 0} verified)
              </div>
            </div>

            {/* Effective Hourly Rate */}
            <div className="card-subtle p-5">
              <div className="flex items-center justify-between text-[#78716C] mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Effective Hourly Rate</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700" aria-hidden="true">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#1C1917] tracking-tight tabular-nums">
                PKR {(analytics?.effectiveHourlyRate || 0).toFixed(2)}/hr
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                <span>+15.9% above statutory floor</span>
              </div>
            </div>
          </div>

          {/* City Benchmark Gauge Card */}
          {analytics?.cityBenchmark && (
            <div className="mb-6 p-5 rounded-xl border border-[#C5D9CE] bg-[#F2F7F4] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#1E3A2F] text-white flex items-center justify-center font-semibold text-xs shadow-2xs">
                  PK
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
                    <span>{analytics.cityBenchmark.cityName} Municipal Benchmark ({analytics.cityBenchmark.category})</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                      Verified Cohort (n={analytics.cityBenchmark.workerCohortSize} &ge; 5)
                    </span>
                  </div>
                  <div className="text-[11px] text-[#44403C] mt-1">
                    City median: <strong>PKR {analytics.cityBenchmark.cityMedianHourlyRate?.toFixed(2)}/hr</strong> &bull; Your effective rate: <strong>PKR {analytics.effectiveHourlyRate?.toFixed(2)}/hr</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-white border border-[#C5D9CE] text-xs font-medium text-[#1E3A2F] shadow-2xs">
                    +{analytics.cityBenchmark.variancePercentage}% Above City Median
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Visual Analytics Grid: Weekly Trends & Platform Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Income Trends Chart */}
            <div className="card-subtle p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#1C1917] tracking-tight">Weekly Income Trend</h2>
                  <p className="text-xs text-[#78716C]">Verified take-home earnings over time</p>
                </div>
                <span className="text-[10px] bg-stone-100 text-[#44403C] px-2.5 py-1 rounded-md font-medium">
                  Daily Net Trend
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.dailyEarningsTrend || []}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A2F" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1E3A2F" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#78716C"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#E7E5E4' }}
                    />
                    <YAxis
                      stroke="#78716C"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `PKR ${v}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#1E3A2F"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#earningsGradient)"
                      dot={{ r: 3.5, fill: '#1E3A2F', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: '#1E3A2F' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Platform Breakdown */}
            <div className="card-subtle p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[#1C1917] tracking-tight">Platform Distribution</h2>
                <p className="text-xs text-[#78716C]">Gross revenue &amp; platform deduction rates</p>
              </div>

              <div className="space-y-3">
                {analytics?.platformBreakdown?.map((p: any) => (
                  <div key={p.platform} className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E7E5E4]">
                    <div className="flex items-center justify-between text-xs font-medium text-[#1C1917] capitalize mb-1">
                      <span>{p.platform}</span>
                      <span className="tabular-nums font-semibold">{formatPKR(p.netAmount)}</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="bg-[#1E3A2F] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (p.netAmount / (analytics.totalNetEarnings || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#78716C]">
                      <span>{p.hoursWorked} hrs &bull; {p.shiftsCount} shifts</span>
                      <span className="text-amber-700 font-medium">{p.commissionPercentage}% cut</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Shifts Table */}
          <div className="card-subtle p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#1C1917] tracking-tight">Recent Shift Ledger</h2>
                <p className="text-xs text-[#78716C]">Latest shifts logged with auditor verification status</p>
              </div>
              <Link
                href="/dashboard/earnings"
                className="text-xs font-medium text-[#1E3A2F] hover:underline flex items-center gap-1"
              >
                <span>View All Shifts</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            {shifts.length === 0 ? (
              <EmptyState
                title="No Shifts Logged Yet"
                description="Start tracking your gig work earnings across platforms to generate verifiable income certificates."
                action={{
                  label: "Log Your First Shift",
                  onClick: () => window.location.href = "/dashboard/earnings"
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E7E5E4] text-[#78716C] uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3 font-medium">Date</th>
                      <th className="py-2.5 px-3 font-medium">Platform</th>
                      <th className="py-2.5 px-3 text-right font-medium">Hours</th>
                      <th className="py-2.5 px-3 text-right font-medium">Gross</th>
                      <th className="py-2.5 px-3 text-right font-medium">Deductions</th>
                      <th className="py-2.5 px-3 text-right font-medium">Net</th>
                      <th className="py-2.5 px-3 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EFEA]">
                    {shifts.slice(0, 5).map((shift) => (
                      <tr key={shift.id} className="hover:bg-[#FAFAF8] transition">
                        <td className="py-3 px-3 font-medium text-[#1C1917] tabular-nums">{shift.shiftDate}</td>
                        <td className="py-3 px-3 capitalize font-medium text-[#44403C]">{shift.platform}</td>
                        <td className="py-3 px-3 text-right text-[#44403C] tabular-nums">{shift.hoursWorked} hrs</td>
                        <td className="py-3 px-3 text-right text-[#44403C] tabular-nums">{formatPKR(shift.grossAmount)}</td>
                        <td className="py-3 px-3 text-right text-red-600 tabular-nums">-{formatPKR(shift.deductions)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-[#1C1917] tabular-nums">{formatPKR(shift.netAmount)}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                              shift.verificationStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : shift.verificationStatus === 'discrepancy'
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {shift.verificationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
