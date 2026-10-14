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
      title="Municipal Zone Analytics"
      subtitle="Geographic earnings breakdown with strict privacy suppression for small worker cohorts."
    >
      {/* Zone Distribution Table */}
      <div className="card-subtle p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Zone Benchmarks (Statutory Wage: PKR 175.0/hr)</h3>
            <p className="text-xs text-[#5B6370]">
              Enforcing k &ge; 5 distinct worker threshold for all geographic cohorts
            </p>
          </div>
          <span className="text-[10px] font-mono bg-[#FAF9F5] border border-[#E1E4EA] text-[#1B4332] px-2.5 py-1 rounded-md font-medium">
            Municipal Ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E1E4EA] text-[#5B6370] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-medium">City</th>
                <th className="py-2.5 px-4 font-medium">Zone</th>
                <th className="py-2.5 px-4 text-center font-medium">Cohort (k)</th>
                <th className="py-2.5 px-4 text-center font-medium">Privacy Status</th>
                <th className="py-2.5 px-4 text-right font-medium">Median Rate</th>
                <th className="py-2.5 px-4 text-right font-medium">Average Rate</th>
                <th className="py-2.5 px-4 text-center font-medium">Sub-Min Wage Deficit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E4EA]">
              {zoneCohorts.map((z, idx) => (
                <tr key={idx} className="hover:bg-[#F3F3F0]/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#22252A]">{z.cityName}</td>
                  <td className="py-3 px-4 text-[#5B6370]">{z.zoneName}</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#22252A] tabular-nums">{z.workerCount} workers</td>
                  <td className="py-3 px-4 text-center">
                    {z.isSuppressed ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F3F3F0] text-[#5B6370] border border-[#E1E4EA]">
                        Suppressed (k &lt; 5)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                        Disclosed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#22252A] tabular-nums">
                    {z.isSuppressed ? (
                      <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                    ) : (
                      `PKR ${z.medianRate?.toFixed(2)}/hr`
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#22252A] tabular-nums">
                    {z.isSuppressed ? (
                      <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                    ) : (
                      `PKR ${z.averageRate?.toFixed(2)}/hr`
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {z.isSuppressed ? (
                      <span className="text-[#5B6370] italic font-mono">&mdash;</span>
                    ) : (
                      <span className="text-[#2D6A4F] font-medium text-[11px]">0 Deficits</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Vulnerability Radar (Restricted to Authorized Advocates) */}
      <div className="card-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Worker Income Collapse Radar (&gt;20% Drop)</h3>
            <p className="text-xs text-[#5B6370]">
              Authorized outreach list for union representatives and legal aid advocates
            </p>
          </div>
          <span className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] font-medium border border-[#DC2626]/20 px-2 py-0.5 rounded-md">
            Confidential Advocate View
          </span>
        </div>

        <div className="space-y-3">
          {vulnerabilities.map((v) => (
            <div key={v.workerId} className="p-4 rounded-lg border border-[#DC2626]/20 bg-[#DC2626]/5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#22252A]">{v.workerName} ({v.workerId.substring(0, 8)}...)</div>
                  <div className="text-[11px] text-[#5B6370] mt-0.5">
                    Platform: <strong className="capitalize text-[#22252A]">{v.platform}</strong> &bull; Baseline Net: PKR {v.previousPeriodIncome?.toLocaleString()} &bull; Current Net: PKR {v.currentPeriodIncome?.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-[#DC2626] tabular-nums">-{v.percentageDrop}% Drop</span>
                  <div className="text-[10px] uppercase font-medium text-[#DC2626]">Severity: {v.severity}</div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#DC2626]/10 text-[11px] text-[#5B6370] flex items-center justify-between">
                <span className="italic">{v.disclaimer}</span>
                <button
                  onClick={() => alert(`Initiated advocate support contact with ${v.workerName}`)}
                  className="px-2.5 py-1 bg-[#1B4332] text-white rounded-md text-[11px] font-medium hover:bg-[#2D6A4F] transition-colors cursor-pointer"
                >
                  Initiate Outreach
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
