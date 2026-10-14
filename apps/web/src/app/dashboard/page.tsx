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

// Custom Minimalist Swiss / Apple styled Recharts tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E1E4EA] p-2.5 rounded-lg shadow-sm text-xs space-y-1">
        <div className="text-xs text-[#5B6370]">{label}</div>
        <div className="font-semibold text-sm text-[#22252A] tabular-nums">
          PKR {Number(payload[0].value).toLocaleString()}
        </div>
        <div className="text-xs text-[#2D6A4F] font-medium flex items-center gap-1.5 pt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
          <span>Verified net</span>
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
      title="Overview"
      subtitle="Your earnings, deductions and financial activity."
    >
      {/* Quick Action Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5B6370]">Reporting period:</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-[#E1E4EA] text-[#22252A]">
            All time
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/earnings"
            className="focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4332] text-white text-xs font-medium rounded-lg hover:bg-[#2D6A4F] transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log shift</span>
          </Link>
          <Link
            href="/dashboard/grievances"
            className="focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E1E4EA] text-[#22252A] text-xs font-medium rounded-lg hover:bg-[#F3F3F0] transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>File grievance</span>
          </Link>
          <Link
            href="/dashboard/certificates"
            className="focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E1E4EA] text-[#22252A] text-xs font-medium rounded-lg hover:bg-[#F3F3F0] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
            <span>Export certificate</span>
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
            {/* 1. Gross Earnings */}
            <div className="card-subtle p-5">
              <div className="flex items-center justify-between text-[#5B6370] mb-2">
                <span className="text-xs font-medium">Gross earnings</span>
                <div className="w-7 h-7 rounded-md bg-[#F3F3F0] flex items-center justify-center text-[#22252A]" aria-hidden="true">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
                {formatPKR(analytics?.totalGrossEarnings)}
              </div>
              <div className="text-xs text-[#5B6370] mt-1.5">
                <span className="tabular-nums">{analytics?.shiftsLoggedCount || 0} shifts logged</span>
              </div>
            </div>

            {/* 2. Net Earnings */}
            <div className="card-subtle p-5">
              <div className="flex items-center justify-between text-[#5B6370] mb-2">
                <span className="text-xs font-medium">Net earnings</span>
                <div className="w-7 h-7 rounded-md bg-[#2D6A4F]/10 flex items-center justify-center text-[#2D6A4F]" aria-hidden="true">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
                {formatPKR(analytics?.totalNetEarnings)}
              </div>
              <div className="text-xs text-[#2D6A4F] mt-1.5 font-medium">
                <span>{Math.round((analytics?.verificationRate || 1) * 100)}% verified</span>
              </div>
            </div>

            {/* 3. Deductions */}
            <div className="card-subtle p-5">
              <div className="flex items-center justify-between text-[#5B6370] mb-2">
                <span className="text-xs font-medium">Deductions</span>
                <div className="w-7 h-7 rounded-md bg-[#D97706]/10 flex items-center justify-center text-[#D97706]" aria-hidden="true">
                  <Percent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
                {formatPKR(analytics?.totalDeductions)}
              </div>
              <div className="text-xs text-[#5B6370] mt-1.5 tabular-nums">
                Average: ~{analytics?.totalGrossEarnings > 0 ? Math.round((analytics.totalDeductions / analytics.totalGrossEarnings) * 100) : 20}%
              </div>
            </div>

            {/* 4. Hourly Rate */}
            <div className="card-subtle p-5">
              <div className="flex items-center justify-between text-[#5B6370] mb-2">
                <span className="text-xs font-medium">Hourly rate</span>
                <div className="w-7 h-7 rounded-md bg-[#F3F3F0] flex items-center justify-center text-[#22252A]" aria-hidden="true">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
                PKR {(analytics?.effectiveHourlyRate || 0).toFixed(0)}/hr
              </div>
              <div className="text-xs text-[#2D6A4F] font-medium mt-1.5 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                <span>{(analytics?.totalHoursWorked || 0).toFixed(1)} hrs logged</span>
              </div>
            </div>
          </div>

          {/* City Benchmark */}
          {analytics?.cityBenchmark && (
            <div className="mb-6 p-4 rounded-xl border border-[#E1E4EA] bg-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-medium text-xs">
                  PK
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#22252A] flex items-center gap-2">
                    <span>{analytics.cityBenchmark.cityName} benchmark</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-medium">
                      Cohort (n={analytics.cityBenchmark.workerCohortSize} &ge; 5)
                    </span>
                  </div>
                  <div className="text-xs text-[#5B6370] mt-0.5">
                    Your rate: <strong className="text-[#22252A]">PKR {analytics.effectiveHourlyRate?.toFixed(0)}/hr</strong> &bull; City median: <strong className="text-[#22252A]">PKR {analytics.cityBenchmark.cityMedianHourlyRate?.toFixed(0)}/hr</strong>
                  </div>
                </div>
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-md bg-[#F3F3F0] border border-[#E1E4EA] text-xs font-medium text-[#1B4332]">
                  +{analytics.cityBenchmark.variancePercentage}% above median
                </span>
              </div>
            </div>
          )}

          {/* Visual Analytics Grid: Weekly Trends & Platform Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Income Trends Chart */}
            <div className="card-subtle p-4 sm:p-6 lg:col-span-2 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#22252A] tracking-tight">Earnings trend</h2>
                  <p className="text-xs text-[#5B6370]">Daily net earnings over time</p>
                </div>
              </div>

              <div className="h-56 sm:h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.dailyEarningsTrend || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B4332" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#1B4332" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E1E4EA" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#5B6370"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#E1E4EA' }}
                    />
                    <YAxis
                      stroke="#5B6370"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#1B4332"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#earningsGradient)"
                      dot={{ r: 3, fill: '#1B4332', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: '#1B4332' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Platform Breakdown */}
            <div className="card-subtle p-4 sm:p-6 min-w-0">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-[#22252A] tracking-tight">Platform distribution</h2>
                <p className="text-xs text-[#5B6370]">Net earnings and deduction rates</p>
              </div>

              <div className="space-y-3">
                {analytics?.platformBreakdown?.map((p: any) => (
                  <div key={p.platform} className="p-3 bg-white rounded-lg border border-[#E1E4EA]">
                    <div className="flex items-center justify-between text-sm font-medium text-[#22252A] capitalize mb-1">
                      <span>{p.platform}</span>
                      <span className="tabular-nums font-semibold">{formatPKR(p.netAmount)}</span>
                    </div>
                    <div className="w-full bg-[#F3F3F0] h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="bg-[#1B4332] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (p.netAmount / (analytics.totalNetEarnings || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#5B6370]">
                      <span>{p.hoursWorked} hrs &bull; {p.shiftsCount} shifts</span>
                      <span className="text-[#D97706] font-medium">{p.commissionPercentage}% cut</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Shifts Section */}
          <div className="card-subtle p-4 sm:p-6 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#22252A] tracking-tight">Recent shifts</h2>
                <p className="text-xs text-[#5B6370]">Latest recorded shifts and verification status</p>
              </div>
              <Link
                href="/dashboard/earnings"
                className="text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1"
              >
                <span>View all</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            {shifts.length === 0 ? (
              <EmptyState
                title="No shifts logged yet"
                description="Start tracking your gig work earnings across platforms to generate verifiable income certificates."
                action={{
                  label: "Log your first shift",
                  onClick: () => window.location.href = "/dashboard/earnings"
                }}
              />
            ) : (
              <>
                {/* Desktop Data Table */}
                <div className="hidden md:block overflow-x-auto min-w-0">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E1E4EA] text-[#5B6370] text-xs font-medium">
                        <th className="py-3 px-3.5 font-medium">Date</th>
                        <th className="py-3 px-3.5 font-medium">Platform</th>
                        <th className="py-3 px-3.5 text-right font-medium">Hours</th>
                        <th className="py-3 px-3.5 text-right font-medium">Gross</th>
                        <th className="py-3 px-3.5 text-right font-medium">Deductions</th>
                        <th className="py-3 px-3.5 text-right font-medium">Net</th>
                        <th className="py-3 px-3.5 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1E4EA]">
                      {shifts.slice(0, 5).map((shift) => (
                        <tr key={shift.id} className="hover:bg-[#F3F3F0]/60 transition-colors">
                          <td className="py-3.5 px-3.5 font-medium text-[#22252A] tabular-nums">{shift.shiftDate}</td>
                          <td className="py-3.5 px-3.5 capitalize text-[#5B6370]">{shift.platform}</td>
                          <td className="py-3.5 px-3.5 text-right text-[#5B6370] tabular-nums">{shift.hoursWorked} hrs</td>
                          <td className="py-3.5 px-3.5 text-right text-[#5B6370] tabular-nums">{formatPKR(shift.grossAmount)}</td>
                          <td className="py-3.5 px-3.5 text-right text-[#DC2626] tabular-nums">-{formatPKR(shift.deductions)}</td>
                          <td className="py-3.5 px-3.5 text-right font-semibold text-[#22252A] tabular-nums">{formatPKR(shift.netAmount)}</td>
                          <td className="py-3.5 px-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium capitalize border ${
                                shift.verificationStatus === 'verified'
                                  ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                                  : shift.verificationStatus === 'discrepancy'
                                  ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                                  : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
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

                {/* Mobile Stacked Record Cards (Clean, readable, no horizontal overflow) */}
                <div className="block md:hidden divide-y divide-[#E1E4EA] -mx-4 sm:mx-0">
                  {shifts.slice(0, 5).map((shift) => (
                    <div key={shift.id} className="p-4 hover:bg-[#FAF9F5] transition-colors space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#22252A] capitalize">{shift.platform}</span>
                          <span className="text-xs text-[#5B6370]">&bull;</span>
                          <span className="text-xs text-[#5B6370] tabular-nums">{shift.shiftDate}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize border ${
                            shift.verificationStatus === 'verified'
                              ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                              : shift.verificationStatus === 'discrepancy'
                              ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                              : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
                          }`}
                        >
                          {shift.verificationStatus}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-xs text-[#5B6370]">Net earnings</div>
                          <div className="text-lg font-semibold text-[#22252A] tabular-nums">
                            {formatPKR(shift.netAmount)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#5B6370]">{shift.hoursWorked} hrs</div>
                          <div className="text-xs text-[#DC2626] tabular-nums">-{formatPKR(shift.deductions)} cut</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
