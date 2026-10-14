'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  TrendingDown,
  Layers,
  AlertTriangle,
  ArrowRight,
  Flame,
  Scale,
  FileCheck2,
  Info,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { KpiSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function AdvocateDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ovData, commData, vulnData] = await Promise.all([
          apiClient.getAdvocateOverview(),
          apiClient.getCommissionTrends(),
          apiClient.getVulnerabilities(),
        ]);
        setOverview(ovData);
        setCommissions(commData);
        setVulnerabilities(vulnData);
      } catch (err) {
        console.error('Failed to load advocate overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatPKR = (v: number) =>
    'PKR ' + (v || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

  return (
    <AppShell
      title="Advocate Intelligence Portal"
      subtitle="Privacy-preserving aggregate metrics &bull; K-Anonymity (k &ge; 5) collective analytics"
    >
      {/* High-Level Collective KPI Cards */}
      {loading ? (
        <div className="mb-6">
          <KpiSkeleton count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#78716C] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Workers Monitored</span>
              <div className="w-7 h-7 rounded-lg bg-[#F2F7F4] flex items-center justify-center text-[#1E3A2F]" aria-hidden="true">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
              {overview?.totalWorkersMonitored || 8}
            </div>
            <div className="text-[11px] text-[#78716C] mt-1.5">
              Across {overview?.totalShiftsAnalyzed || 38} verified shifts
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#78716C] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Claimed Underpayments</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700" aria-hidden="true">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
              {formatPKR(overview?.totalEstimatedLossClaimed || 18450)}
            </div>
            <div className="text-[11px] text-[#78716C] mt-1.5">
              {overview?.totalDiscrepanciesIdentified || 5} active grievance cases
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#78716C] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Collective Clusters</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700" aria-hidden="true">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
              {overview?.topGrievanceClusters?.length || 1}
            </div>
            <div className="text-[11px] text-[#78716C] mt-1.5">
              Affecting 47+ joint workers in Lahore
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#78716C] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Vulnerable Workers</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-700" aria-hidden="true">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-red-700 tracking-tight">
              {vulnerabilities.length}
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1.5">
              Monthly income collapsed &gt; 20%
            </div>
          </div>
        </div>
      )}

      {/* K-Anonymity Platform Comparison (With Suppression Safeguards) */}
      <div className="card-subtle p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">Platform Cohort Intelligence (k &ge; 5 Anonymity)</h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Cohorts with fewer than 5 workers are automatically suppressed to safeguard worker privacy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-[#E2ECE6] text-[#1E3A2F] px-2.5 py-1 rounded-full font-bold">
              Privacy Floor: k &ge; 5 Workers
            </span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#E7E5E4] text-[#78716C] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Platform</th>
                  <th className="py-3 px-4 font-semibold">City / Zone</th>
                  <th className="py-3 px-4 text-center font-semibold">Sample Size</th>
                  <th className="py-3 px-4 text-center font-semibold">Privacy Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Avg Hourly Rate</th>
                  <th className="py-3 px-4 text-right font-semibold">Avg Fee Cut</th>
                  <th className="py-3 px-4 text-right font-semibold">Discrepancy Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {overview?.platformComparison?.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#1C1917] capitalize">{c.platform}</td>
                    <td className="py-3.5 px-4 text-[#44403C]">{c.cityName || 'Lahore'}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#1C1917]">{c.workerSampleCount} workers</td>
                    <td className="py-3.5 px-4 text-center">
                      {c.isSuppressedForPrivacy ? (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-[#78716C] border border-stone-200"
                          title="Suppressed because sample size n < 5"
                        >
                          Suppressed (n &lt; 5)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Disclosed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {c.isSuppressedForPrivacy ? (
                        <span className="text-[#78716C] italic font-mono">&mdash;</span>
                      ) : (
                        `PKR ${c.averageHourlyRate?.toFixed(2)}/hr`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {c.isSuppressedForPrivacy ? (
                        <span className="text-[#78716C] italic font-mono">&mdash;</span>
                      ) : (
                        `${c.averageDeductionPercentage?.toFixed(1)}%`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {c.isSuppressedForPrivacy ? (
                        <span className="text-[#78716C] italic font-mono">&mdash;</span>
                      ) : (
                        `${(c.discrepancyRate * 100).toFixed(1)}%`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collective Clusters & Vulnerability Quick Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collective Clusters Card */}
        <div className="card-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Collective Grievance Clusters</h3>
              <p className="text-xs text-[#78716C]">Grouped systematic platform issues</p>
            </div>
            <Link
              href="/advocate/grievances"
              className="text-xs font-semibold text-[#1E3A2F] hover:underline flex items-center gap-1 focus-ring rounded"
            >
              <span>Manage Clusters</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {overview?.topGrievanceClusters?.map((cluster: any) => (
              <div key={cluster.clusterId} className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Platform: {cluster.platform}
                    </span>
                    <h4 className="text-xs font-bold text-[#1C1917] mt-1.5">{cluster.title}</h4>
                  </div>
                  <span className="font-bold text-xs text-blue-900">
                    {formatPKR(cluster.estimatedLoss)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-[#44403C] flex items-center justify-between pt-2 border-t border-blue-200/60">
                  <span className="flex items-center gap-1 font-semibold text-blue-800">
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{cluster.affectedCount} Joint Workers Affected</span>
                  </span>
                  <span className="text-[11px] text-[#78716C]">Ready for Labor Bureau Petition</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Vulnerability Radar */}
        <div className="card-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Worker Vulnerability Radar</h3>
              <p className="text-xs text-[#78716C]">Workers experiencing &gt;20% income collapse</p>
            </div>
            <Link
              href="/advocate/zones"
              className="text-xs font-semibold text-[#1E3A2F] hover:underline flex items-center gap-1 focus-ring rounded"
            >
              <span>Zone Radar</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {vulnerabilities.map((v) => (
              <div key={v.workerId} className="p-4 rounded-xl border border-red-200 bg-red-50/40">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs text-[#1C1917]">{v.workerName}</div>
                  <span className="text-xs font-bold text-red-700">-{v.percentageDrop}% Collapse</span>
                </div>
                <div className="text-[11px] text-[#78716C]">
                  Platform: <strong className="capitalize">{v.platform}</strong> &bull; Baseline PKR {v.previousPeriodIncome?.toLocaleString()} &rarr; Current PKR {v.currentPeriodIncome?.toLocaleString()}
                </div>
                <div className="mt-2 text-[10px] text-stone-500 italic border-t border-red-200/60 pt-1.5">
                  {v.disclaimer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
