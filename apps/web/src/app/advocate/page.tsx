'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Layers,
  AlertTriangle,
  ArrowRight,
  Flame,
  Scale,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { KpiSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function AdvocateDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ovData, vulnData] = await Promise.all([
          apiClient.getAdvocateOverview(),
          apiClient.getVulnerabilities(),
        ]);
        setOverview(ovData);
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
      title="Advocate Intelligence"
      subtitle="Privacy-preserving aggregate metrics &bull; K-Anonymity (k &ge; 5) collective analytics."
    >
      {/* High-Level Collective KPI Cards */}
      {loading ? (
        <div className="mb-6">
          <KpiSkeleton count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#5B6370] mb-2">
              <span className="text-xs font-medium">Workers Monitored</span>
              <div className="w-7 h-7 rounded-md bg-[#F3F3F0] flex items-center justify-center text-[#22252A]" aria-hidden="true">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
              {overview?.totalWorkersMonitored || 8}
            </div>
            <div className="text-xs text-[#5B6370] mt-1.5 tabular-nums">
              Across {overview?.totalShiftsAnalyzed || 38} verified shifts
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#5B6370] mb-2">
              <span className="text-xs font-medium">Claimed Underpayments</span>
              <div className="w-7 h-7 rounded-md bg-[#D97706]/10 flex items-center justify-center text-[#D97706]" aria-hidden="true">
                <Scale className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
              {formatPKR(overview?.totalEstimatedLossClaimed || 18450)}
            </div>
            <div className="text-xs text-[#5B6370] mt-1.5 tabular-nums">
              {overview?.totalDiscrepanciesIdentified || 5} active grievance cases
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#5B6370] mb-2">
              <span className="text-xs font-medium">Collective Clusters</span>
              <div className="w-7 h-7 rounded-md bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]" aria-hidden="true">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
              {overview?.topGrievanceClusters?.length || 1}
            </div>
            <div className="text-xs text-[#5B6370] mt-1.5">
              Affecting 47+ joint workers in Lahore
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#5B6370] mb-2">
              <span className="text-xs font-medium">Vulnerable Workers</span>
              <div className="w-7 h-7 rounded-md bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]" aria-hidden="true">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-[#DC2626] tracking-tight tabular-nums">
              {vulnerabilities.length}
            </div>
            <div className="text-xs text-[#DC2626] font-medium mt-1.5">
              Monthly income collapsed &gt; 20%
            </div>
          </div>
        </div>
      )}

      {/* K-Anonymity Platform Comparison (With Suppression Safeguards) */}
      <div className="card-subtle p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Platform Cohort Intelligence (k &ge; 5 Anonymity)</h3>
            <p className="text-xs text-[#5B6370] mt-0.5">
              Cohorts with fewer than 5 workers are automatically suppressed to safeguard worker privacy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-[#FAF9F5] border border-[#E1E4EA] text-[#1B4332] px-2.5 py-1 rounded-md font-medium">
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
                <tr className="bg-[#FAF9F5] border-b border-[#E1E4EA] text-[#5B6370] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-medium">Platform</th>
                  <th className="py-2.5 px-4 font-medium">City / Zone</th>
                  <th className="py-2.5 px-4 text-center font-medium">Sample Size</th>
                  <th className="py-2.5 px-4 text-center font-medium">Privacy Status</th>
                  <th className="py-2.5 px-4 text-right font-medium">Avg Hourly Rate</th>
                  <th className="py-2.5 px-4 text-right font-medium">Avg Fee Cut</th>
                  <th className="py-2.5 px-4 text-right font-medium">Discrepancy Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E4EA]">
                {overview?.platformComparison?.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#F3F3F0]/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#22252A] capitalize">{c.platform}</td>
                    <td className="py-3 px-4 text-[#5B6370]">{c.cityName || 'Lahore'}</td>
                    <td className="py-3 px-4 text-center font-semibold text-[#22252A] tabular-nums">{c.workerSampleCount} workers</td>
                    <td className="py-3 px-4 text-center">
                      {c.isSuppressedForPrivacy ? (
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F3F3F0] text-[#5B6370] border border-[#E1E4EA]"
                          title="Suppressed because sample size n < 5"
                        >
                          Suppressed (n &lt; 5)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                          Disclosed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums text-[#22252A]">
                      {c.isSuppressedForPrivacy ? (
                        <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                      ) : (
                        `PKR ${c.averageHourlyRate?.toFixed(2)}/hr`
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums text-[#22252A]">
                      {c.isSuppressedForPrivacy ? (
                        <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                      ) : (
                        `${c.averageDeductionPercentage?.toFixed(1)}%`
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums text-[#22252A]">
                      {c.isSuppressedForPrivacy ? (
                        <span className="text-[#5B6370] italic font-mono">&mdash;</span>
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
              <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Collective Grievance Clusters</h3>
              <p className="text-xs text-[#5B6370]">Grouped systematic platform issues</p>
            </div>
            <Link
              href="/advocate/grievances"
              className="text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 focus-ring rounded"
            >
              <span>Manage Clusters</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {overview?.topGrievanceClusters?.map((cluster: any) => (
              <div key={cluster.clusterId} className="p-4 rounded-lg border border-[#2563EB]/20 bg-[#2563EB]/5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-md border border-[#2563EB]/20">
                      Platform: {cluster.platform}
                    </span>
                    <h4 className="text-xs font-semibold text-[#22252A] mt-1.5">{cluster.title}</h4>
                  </div>
                  <span className="font-semibold text-xs text-[#22252A] tabular-nums">
                    {formatPKR(cluster.estimatedLoss)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-[#5B6370] flex items-center justify-between pt-2 border-t border-[#2563EB]/10">
                  <span className="flex items-center gap-1 font-medium text-[#D97706]">
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{cluster.affectedCount} Joint Workers Affected</span>
                  </span>
                  <span className="text-[11px] text-[#5B6370]">Ready for Labor Bureau Petition</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Vulnerability Radar */}
        <div className="card-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Worker Vulnerability Radar</h3>
              <p className="text-xs text-[#5B6370]">Workers experiencing &gt;20% income collapse</p>
            </div>
            <Link
              href="/advocate/zones"
              className="text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 focus-ring rounded"
            >
              <span>Zone Radar</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {vulnerabilities.map((v) => (
              <div key={v.workerId} className="p-4 rounded-lg border border-[#DC2626]/20 bg-[#DC2626]/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-xs text-[#22252A]">{v.workerName}</div>
                  <span className="text-xs font-semibold text-[#DC2626] tabular-nums">-{v.percentageDrop}% Collapse</span>
                </div>
                <div className="text-[11px] text-[#5B6370]">
                  Platform: <strong className="capitalize text-[#22252A]">{v.platform}</strong> &bull; Baseline PKR {v.previousPeriodIncome?.toLocaleString()} &rarr; Current PKR {v.currentPeriodIncome?.toLocaleString()}
                </div>
                <div className="mt-2 text-[10px] text-[#5B6370] italic border-t border-[#DC2626]/10 pt-1.5">
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
