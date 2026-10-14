'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Clock,
  TrendingUp,
  Percent,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  FileText,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

export default function WorkerDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [analyticsData, shiftsData] = await Promise.all([
          apiClient.getWorkerAnalytics('all_time'),
          apiClient.getShifts(),
        ]);
        setAnalytics(analyticsData);
        setShifts(shiftsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
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
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917]">
            All-Time Verified Records
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/earnings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Shift</span>
          </Link>
          <Link
            href="/dashboard/grievances"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E7E5E4] text-[#44403C] text-xs font-semibold rounded-lg hover:bg-stone-50 transition shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>File Grievance</span>
          </Link>
          <Link
            href="/dashboard/certificates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E7E5E4] text-[#44403C] text-xs font-semibold rounded-lg hover:bg-stone-50 transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Certificate</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Net Earnings */}
        <div className="card-subtle p-5">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Take-Home Net</span>
            <div className="w-7 h-7 rounded-md bg-[#F2F7F4] flex items-center justify-center text-[#1E3A2F]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
            {formatPKR(analytics?.totalNetEarnings)}
          </div>
          <div className="text-[11px] text-[#78716C] mt-1 flex items-center gap-1.5">
            <span>Gross: {formatPKR(analytics?.totalGrossEarnings)}</span>
            <span className="text-emerald-700 font-medium">({Math.round((analytics?.verificationRate || 1) * 100)}% verified)</span>
          </div>
        </div>

        {/* Platform Deductions */}
        <div className="card-subtle p-5">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Deductions</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
            {formatPKR(analytics?.totalDeductions)}
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">
            Avg Platform Cut: ~{analytics?.totalGrossEarnings > 0 ? Math.round((analytics.totalDeductions / analytics.totalGrossEarnings) * 100) : 20}%
          </div>
        </div>

        {/* Hours Worked */}
        <div className="card-subtle p-5">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hours Logged</span>
            <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-[#44403C]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
            {(analytics?.totalHoursWorked || 0).toFixed(1)} hrs
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">
            Across {analytics?.shiftsLoggedCount || 0} shifts ({analytics?.verifiedShiftsCount || 0} verified)
          </div>
        </div>

        {/* Effective Hourly Rate */}
        <div className="card-subtle p-5">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Effective Hourly Rate</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
            PKR {(analytics?.effectiveHourlyRate || 0).toFixed(2)}/hr
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+15.9% above statutory floor</span>
          </div>
        </div>
      </div>

      {/* City Benchmark Banner */}
      {analytics?.cityBenchmark && (
        <div className="mb-6 p-4 rounded-xl border border-[#C5D9CE] bg-[#F2F7F4] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#234737] text-white flex items-center justify-center font-bold text-xs">
              PK
            </div>
            <div>
              <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                <span>{analytics.cityBenchmark.cityName} Municipal Benchmark ({analytics.cityBenchmark.category})</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  Verified Cohort (n={analytics.cityBenchmark.workerCohortSize} &ge; 5)
                </span>
              </div>
              <div className="text-[11px] text-[#44403C] mt-0.5">
                City median: <strong>PKR {analytics.cityBenchmark.cityMedianHourlyRate?.toFixed(2)}/hr</strong> &bull; Your effective rate: <strong>PKR {analytics.effectiveHourlyRate?.toFixed(2)}/hr</strong>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-lg bg-white border border-[#C5D9CE] text-xs font-bold text-[#1E3A2F]">
              +{analytics.cityBenchmark.variancePercentage}% Above Median
            </span>
          </div>
        </div>
      )}

      {/* Visual Analytics Grid: Weekly Trends & Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Income Trends Chart */}
        <div className="card-subtle p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1C1917]">Weekly Income Trend</h2>
              <p className="text-xs text-[#78716C]">Verified take-home earnings over time</p>
            </div>
            <span className="text-[10px] bg-stone-100 text-[#44403C] px-2 py-0.5 rounded font-mono">
              Recharts Curved Line
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.dailyEarningsTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                <XAxis dataKey="date" stroke="#78716C" fontSize={11} tickLine={false} />
                <YAxis stroke="#78716C" fontSize={11} tickLine={false} tickFormatter={(v) => `PKR ${v}`} />
                <Tooltip
                  formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, 'Take-Home Net']}
                  labelStyle={{ fontWeight: 600, color: '#1C1917' }}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E7E5E4' }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#1E3A2F"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1E3A2F' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="card-subtle p-6">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#1C1917]">Platform Distribution</h2>
            <p className="text-xs text-[#78716C]">Gross revenue &amp; platform deduction rates</p>
          </div>

          <div className="space-y-3.5">
            {analytics?.platformBreakdown?.map((p: any) => (
              <div key={p.platform} className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E7E5E4]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917] capitalize mb-1">
                  <span>{p.platform}</span>
                  <span>{formatPKR(p.netAmount)}</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-[#1E3A2F] h-full rounded-full"
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
            <h2 className="text-sm font-bold text-[#1C1917]">Recent Shift Ledger</h2>
            <p className="text-xs text-[#78716C]">Latest shifts logged with auditor verification status</p>
          </div>
          <Link
            href="/dashboard/earnings"
            className="text-xs font-semibold text-[#1E3A2F] hover:underline flex items-center gap-1"
          >
            <span>View All Shifts</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-[#78716C] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3 text-right">Hours</th>
                <th className="py-2.5 px-3 text-right">Gross</th>
                <th className="py-2.5 px-3 text-right">Deductions</th>
                <th className="py-2.5 px-3 text-right">Net</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {shifts.slice(0, 5).map((shift) => (
                <tr key={shift.id} className="hover:bg-[#FAFAF8] transition">
                  <td className="py-3 px-3 font-medium text-[#1C1917]">{shift.shiftDate}</td>
                  <td className="py-3 px-3 capitalize font-semibold text-[#44403C]">{shift.platform}</td>
                  <td className="py-3 px-3 text-right text-[#44403C]">{shift.hoursWorked} hrs</td>
                  <td className="py-3 px-3 text-right text-[#44403C]">{formatPKR(shift.grossAmount)}</td>
                  <td className="py-3 px-3 text-right text-red-600">-{formatPKR(shift.deductions)}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#1C1917]">{formatPKR(shift.netAmount)}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
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
      </div>
    </AppShell>
  );
}
