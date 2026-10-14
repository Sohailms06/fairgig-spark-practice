'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';

export default function ZonesPage() {
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient.getVulnerabilities();
        setVulnerabilities(data);
      } catch (err) {
        console.error('Failed to load vulnerabilities:', err);
      }
    }
    loadData();
  }, []);

  const zoneCohorts = [
    {
      cityName: 'Lahore',
      zoneName: 'Gulberg / Main Boulevard',
      workerCount: 6,
      shiftCount: 24,
      isSuppressed: false,
      medianRate: 521.38,
      averageRate: 544.12,
      subMinimumWageCount: 0,
    },
    {
      cityName: 'Lahore',
      zoneName: 'DHA Phase 5 & 6',
      workerCount: 5,
      shiftCount: 18,
      isSuppressed: false,
      medianRate: 560.0,
      averageRate: 578.5,
      subMinimumWageCount: 0,
    },
    {
      cityName: 'Rawalpindi',
      zoneName: 'Saddar / Murree Road',
      workerCount: 2,
      shiftCount: 6,
      isSuppressed: true,
      medianRate: null,
      averageRate: null,
      subMinimumWageCount: null,
    },
  ];

  return (
    <AppShell
      title="Zone Analytics"
      subtitle="Geographic earnings breakdown with privacy suppression."
    >
      {/* Zone Distribution Table */}
      <div className="card-subtle p-4 sm:p-6 mb-8 min-w-0">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Zone benchmarks</h3>
          <p className="text-xs text-[#5B6370]">
            Cohorts with fewer than 5 workers are suppressed to protect privacy
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto min-w-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E1E4EA] text-[#5B6370] text-xs font-medium">
                <th className="py-3 px-4 font-medium">City</th>
                <th className="py-3 px-4 font-medium">Zone</th>
                <th className="py-3 px-4 text-center font-medium">Cohort size</th>
                <th className="py-3 px-4 text-center font-medium">Privacy status</th>
                <th className="py-3 px-4 text-right font-medium">Median rate</th>
                <th className="py-3 px-4 text-right font-medium">Average rate</th>
                <th className="py-3 px-4 text-center font-medium">Wage floor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E4EA]">
              {zoneCohorts.map((z, idx) => (
                <tr key={idx} className="hover:bg-[#F3F3F0]/60 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-[#22252A]">{z.cityName}</td>
                  <td className="py-3.5 px-4 text-[#5B6370]">{z.zoneName}</td>
                  <td className="py-3.5 px-4 text-center font-medium text-[#22252A] tabular-nums">{z.workerCount} workers</td>
                  <td className="py-3.5 px-4 text-center">
                    {z.isSuppressed ? (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#F3F3F0] text-[#5B6370] border border-[#E1E4EA]">
                        Suppressed (n &lt; 5)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                        Disclosed
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-[#22252A] tabular-nums">
                    {z.isSuppressed ? (
                      <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                    ) : (
                      `PKR ${z.medianRate?.toFixed(0)}/hr`
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-[#22252A] tabular-nums">
                    {z.isSuppressed ? (
                      <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                    ) : (
                      `PKR ${z.averageRate?.toFixed(0)}/hr`
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {z.isSuppressed ? (
                      <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                    ) : (
                      <span className="text-[#2D6A4F] font-medium text-xs">Standard</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View */}
        <div className="block md:hidden divide-y divide-[#E1E4EA]">
          {zoneCohorts.map((z, idx) => (
            <div key={idx} className="p-4 hover:bg-[#FAF9F5] transition-colors space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-sm text-[#22252A]">{z.cityName}</span>
                  <span className="text-xs text-[#5B6370] ml-2">({z.zoneName})</span>
                </div>
                {z.isSuppressed ? (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#F3F3F0] text-[#5B6370] border border-[#E1E4EA]">
                    Suppressed (n &lt; 5)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                    Disclosed
                  </span>
                )}
              </div>

              {z.isSuppressed ? (
                <div className="text-xs text-[#5B6370] italic py-1">
                  Protected under differential privacy ({z.workerCount} workers &lt; 5 threshold)
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-[#5B6370] block">Median rate</span>
                    <span className="font-semibold text-base text-[#22252A] tabular-nums">PKR {z.medianRate?.toFixed(0)}/hr</span>
                  </div>
                  <div>
                    <span className="text-[#5B6370] block">Average rate</span>
                    <span className="font-semibold text-base text-[#5B6370] tabular-nums">PKR {z.averageRate?.toFixed(0)}/hr</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-[#5B6370] pt-1 flex items-center justify-between border-t border-[#E1E4EA]">
                <span>Cohort: <strong className="text-[#22252A]">{z.workerCount} workers</strong></span>
                {!z.isSuppressed && <span className="text-[#2D6A4F] font-medium">Wage floor met</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Vulnerability List */}
      <div className="card-subtle p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Income drop alerts</h3>
          <p className="text-xs text-[#5B6370]">
            Workers experiencing &gt;20% income reduction
          </p>
        </div>

        <div className="space-y-3">
          {vulnerabilities.map((v) => (
            <div key={v.workerId} className="p-4 rounded-xl border border-[#DC2626]/20 bg-[#DC2626]/5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#22252A]">{v.workerName}</div>
                  <div className="text-xs text-[#5B6370] mt-0.5">
                    Platform: <strong className="capitalize text-[#22252A]">{v.platform}</strong> &bull; Baseline PKR {v.previousPeriodIncome?.toLocaleString()} &rarr; Current PKR {v.currentPeriodIncome?.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#DC2626] tabular-nums">-{v.percentageDrop}%</span>
                  <div className="text-xs text-[#DC2626] capitalize">Severity: {v.severity}</div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#DC2626]/10 text-xs text-[#5B6370] flex items-center justify-between">
                <span className="italic">{v.disclaimer}</span>
                <button
                  onClick={() => alert(`Initiated advocate support contact with ${v.workerName}`)}
                  className="px-3 py-1 bg-[#1B4332] text-white rounded-lg text-xs font-medium hover:bg-[#2D6A4F] transition-colors cursor-pointer"
                >
                  Contact worker
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
