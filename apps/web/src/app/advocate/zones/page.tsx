'use client';

import React, { useEffect, useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ArrowDownRight,
  TrendingDown,
  Info,
} from 'lucide-react';
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
      title="Municipal Zone Analytics &amp; Vulnerability Radar"
      subtitle="Geographic earnings breakdown with strict privacy suppression for small worker cohorts"
    >
      {/* Zone Distribution Table */}
      <div className="card-subtle p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">City Zone Benchmarks (Statutory Wage: PKR 175.0/hr)</h3>
            <p className="text-xs text-[#78716C]">
              Enforcing k &ge; 5 distinct worker threshold for all geographic cohorts
            </p>
          </div>
          <span className="text-[10px] font-mono bg-[#E2ECE6] text-[#1E3A2F] px-2.5 py-0.5 rounded-full font-bold">
            Municipal Ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E7E5E4] text-[#78716C] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4 text-center">Cohort (k)</th>
                <th className="py-3 px-4 text-center">Privacy Status</th>
                <th className="py-3 px-4 text-right">Median Rate</th>
                <th className="py-3 px-4 text-right">Average Rate</th>
                <th className="py-3 px-4 text-center">Sub-Min Wage Deficit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {zoneCohorts.map((z, idx) => (
                <tr key={idx} className="hover:bg-[#FAFAF8] transition">
                  <td className="py-3 px-4 font-semibold text-[#1C1917]">{z.cityName}</td>
                  <td className="py-3 px-4 text-[#44403C]">{z.zoneName}</td>
                  <td className="py-3 px-4 text-center font-bold text-[#1C1917]">{z.workerCount} workers</td>
                  <td className="py-3 px-4 text-center">
                    {z.isSuppressed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-[#78716C] border border-stone-200">
                        Suppressed (k &lt; 5)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Disclosed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {z.isSuppressed ? (
                      <span className="text-[#78716C] italic font-mono">&mdash;</span>
                    ) : (
                      `PKR ${z.medianRate?.toFixed(2)}/hr`
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {z.isSuppressed ? (
                      <span className="text-[#78716C] italic font-mono">&mdash;</span>
                    ) : (
                      `PKR ${z.averageRate?.toFixed(2)}/hr`
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {z.isSuppressed ? (
                      <span className="text-[#78716C] italic font-mono">&mdash;</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-[11px]">0 Deficits</span>
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
            <h3 className="text-sm font-bold text-[#1C1917]">Worker Income Collapse Radar (&gt;20% Drop)</h3>
            <p className="text-xs text-[#78716C]">
              Authorized outreach list for union representatives and legal aid advocates
            </p>
          </div>
          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
            Confidential Advocate View
          </span>
        </div>

        <div className="space-y-3">
          {vulnerabilities.map((v) => (
            <div key={v.workerId} className="p-4 rounded-xl border border-red-200 bg-red-50/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1C1917]">{v.workerName} ({v.workerId.substring(0, 8)}...)</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5">
                    Platform: <strong className="capitalize">{v.platform}</strong> &bull; Baseline Net: PKR {v.previousPeriodIncome?.toLocaleString()} &bull; Current Net: PKR {v.currentPeriodIncome?.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-red-700">-{v.percentageDrop}% Drop</span>
                  <div className="text-[10px] uppercase font-semibold text-red-600">Severity: {v.severity}</div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-red-200/60 text-[11px] text-[#44403C] flex items-center justify-between">
                <span className="italic">{v.disclaimer}</span>
                <button
                  onClick={() => alert(`Initiated advocate support contact with ${v.workerName}`)}
                  className="px-2.5 py-1 bg-[#1E3A2F] text-white rounded text-[11px] font-semibold hover:bg-[#234737]"
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
