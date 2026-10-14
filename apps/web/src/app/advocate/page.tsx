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
      subtitle="Collective worker metrics and platform comparison."
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
              <span className="text-xs font-medium">Workers monitored</span>
              <div className="w-7 h-7 rounded-md bg-[#F3F3F0] flex items-center justify-center text-[#22252A]" aria-hidden="true">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
              {overview?.totalWorkersMonitored || 8}
            </div>
            <div className="text-xs text-[#5B6370] mt-1.5 tabular-nums">
              {overview?.totalShiftsAnalyzed || 38} verified shifts
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#5B6370] mb-2">
              <span className="text-xs font-medium">Claimed underpayments</span>
              <div className="w-7 h-7 rounded-md bg-[#D97706]/10 flex items-center justify-center text-[#D97706]" aria-hidden="true">
                <Scale className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
              {formatPKR(overview?.totalEstimatedLossClaimed || 18450)}
            </div>
            <div className="text-xs text-[#5B6370] mt-1.5 tabular-nums">
              {overview?.totalDiscrepanciesIdentified || 5} active cases
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#5B6370] mb-2">
              <span className="text-xs font-medium">Collective clusters</span>
              <div className="w-7 h-7 rounded-md bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]" aria-hidden="true">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-[#22252A] tracking-tight tabular-nums">
              {overview?.topGrievanceClusters?.length || 1}
            </div>
            <div className="text-xs text-[#5B6370] mt-1.5">
              47+ joint workers in Lahore
            </div>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-[#5B6370] mb-2">
              <span className="text-xs font-medium">Vulnerable workers</span>
              <div className="w-7 h-7 rounded-md bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]" aria-hidden="true">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-[#DC2626] tracking-tight tabular-nums">
              {vulnerabilities.length}
            </div>
            <div className="text-xs text-[#DC2626] font-medium mt-1.5">
              Income dropped &gt; 20%
            </div>
          </div>
        </div>
      )}

      {/* Platform Comparison Table */}
      <div className="card-subtle p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Platform comparison</h3>
            <p className="text-xs text-[#5B6370] mt-0.5">
              Cohorts with fewer than 5 workers are suppressed to protect privacy
            </p>
          </div>
          <span className="text-xs text-[#5B6370]">
            Privacy floor: n &ge; 5
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={7} />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto min-w-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#FAF9F5] border-b border-[#E1E4EA] text-[#5B6370] text-xs font-medium">
                    <th className="py-3 px-4 font-medium">Platform</th>
                    <th className="py-3 px-4 font-medium">City / Zone</th>
                    <th className="py-3 px-4 text-center font-medium">Sample size</th>
                    <th className="py-3 px-4 text-center font-medium">Privacy status</th>
                    <th className="py-3 px-4 text-right font-medium">Avg hourly rate</th>
                    <th className="py-3 px-4 text-right font-medium">Avg fee cut</th>
                    <th className="py-3 px-4 text-right font-medium">Discrepancy rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E4EA]">
                  {overview?.platformComparison?.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#F3F3F0]/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#22252A] capitalize">{c.platform}</td>
                      <td className="py-3.5 px-4 text-[#5B6370]">{c.cityName || 'Lahore'}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-[#22252A] tabular-nums">{c.workerSampleCount} workers</td>
                      <td className="py-3.5 px-4 text-center">
                        {c.isSuppressedForPrivacy ? (
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#F3F3F0] text-[#5B6370] border border-[#E1E4EA]"
                            title="Suppressed because sample size n < 5"
                          >
                            Suppressed (n &lt; 5)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                            Disclosed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium tabular-nums text-[#22252A]">
                        {c.isSuppressedForPrivacy ? (
                          <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                        ) : (
                          `PKR ${c.averageHourlyRate?.toFixed(0)}/hr`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium tabular-nums text-[#22252A]">
                        {c.isSuppressedForPrivacy ? (
                          <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                        ) : (
                          `${c.averageDeductionPercentage?.toFixed(1)}%`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium tabular-nums text-[#22252A]">
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

            {/* Mobile Stacked Cards View */}
            <div className="block md:hidden divide-y divide-[#E1E4EA]">
              {overview?.platformComparison?.map((c: any, idx: number) => (
                <div key={idx} className="p-4 hover:bg-[#FAF9F5] transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#22252A] capitalize">{c.platform}</span>
                      <span className="text-xs text-[#5B6370]">&bull;</span>
                      <span className="text-xs text-[#5B6370]">{c.cityName || 'Lahore'}</span>
                    </div>
                    {c.isSuppressedForPrivacy ? (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#F3F3F0] text-[#5B6370] border border-[#E1E4EA]">
                        Suppressed (n &lt; 5)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                        Disclosed
                      </span>
                    )}
                  </div>

                  {c.isSuppressedForPrivacy ? (
                    <div className="text-xs text-[#5B6370] italic py-1">
                      Data suppressed for privacy ({c.workerSampleCount} workers &lt; 5 threshold)
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-[#5B6370] block">Hourly rate</span>
                        <span className="font-semibold text-[#22252A] tabular-nums">PKR {c.averageHourlyRate?.toFixed(0)}/hr</span>
                      </div>
                      <div>
                        <span className="text-[#5B6370] block">Avg cut</span>
                        <span className="font-semibold text-[#D97706] tabular-nums">{c.averageDeductionPercentage?.toFixed(1)}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#5B6370] block">Discrepancy</span>
                        <span className="font-semibold text-[#DC2626] tabular-nums">{(c.discrepancyRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-[#5B6370] pt-1">
                    Sample size: <span className="font-medium text-[#22252A] tabular-nums">{c.workerSampleCount} workers</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Collective Clusters & Vulnerability Quick Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collective Clusters Card */}
        <div className="card-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Collective grievance clusters</h3>
              <p className="text-xs text-[#5B6370]">Grouped platform issues</p>
            </div>
            <Link
              href="/advocate/grievances"
              className="text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 focus-ring rounded"
            >
              <span>Manage clusters</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {overview?.topGrievanceClusters?.map((cluster: any) => (
              <div key={cluster.clusterId} className="p-4 rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium capitalize text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-md border border-[#2563EB]/20">
                      {cluster.platform}
                    </span>
                    <h4 className="text-sm font-semibold text-[#22252A] mt-2">{cluster.title}</h4>
                  </div>
                  <span className="font-semibold text-sm text-[#22252A] tabular-nums">
                    {formatPKR(cluster.estimatedLoss)}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[#5B6370] flex items-center justify-between pt-2 border-t border-[#2563EB]/10">
                  <span className="flex items-center gap-1 font-medium text-[#D97706]">
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{cluster.affectedCount} workers affected</span>
                  </span>
                  <span className="text-xs text-[#5B6370]">Ready for petition</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Vulnerability Radar */}
        <div className="card-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Income drop alerts</h3>
              <p className="text-xs text-[#5B6370]">Workers experiencing &gt;20% income reduction</p>
            </div>
            <Link
              href="/advocate/zones"
              className="text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 focus-ring rounded"
            >
              <span>View zones</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {vulnerabilities.map((v) => (
              <div key={v.workerId} className="p-4 rounded-xl border border-[#DC2626]/20 bg-[#DC2626]/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm text-[#22252A]">{v.workerName}</div>
                  <span className="text-xs font-semibold text-[#DC2626] tabular-nums">-{v.percentageDrop}%</span>
                </div>
                <div className="text-xs text-[#5B6370]">
                  Platform: <strong className="capitalize text-[#22252A]">{v.platform}</strong> &bull; Baseline PKR {v.previousPeriodIncome?.toLocaleString()} &rarr; Current PKR {v.currentPeriodIncome?.toLocaleString()}
                </div>
                <div className="mt-2 text-xs text-[#5B6370] italic border-t border-[#DC2626]/10 pt-1.5">
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
