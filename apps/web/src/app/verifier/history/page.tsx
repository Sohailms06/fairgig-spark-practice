'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';

export default function VerifierHistoryPage() {
  const auditLogs = [
    {
      id: 'rev-01',
      shiftDate: '2026-10-14',
      workerName: 'Tariq Mehmood',
      platform: 'inDrive',
      decision: 'Approved & verified',
      status: 'verified',
      verifiedNet: 4960.0,
      notes: 'Pay stub screenshot matched reported PKR 4,960 take-home net after 20% platform cut.',
      reviewedAt: '2026-10-14T11:05:00.000Z',
    },
    {
      id: 'rev-02',
      shiftDate: '2026-10-12',
      workerName: 'Usman Ali',
      platform: 'Bykea',
      decision: 'Approved & verified',
      status: 'verified',
      verifiedNet: 3936.0,
      notes: 'Delivery summary OCR matched reported gross and deductions.',
      reviewedAt: '2026-10-12T17:30:00.000Z',
    },
    {
      id: 'rev-03',
      shiftDate: '2026-10-08',
      workerName: 'Usman Ali',
      platform: 'Careem',
      decision: 'Flagged discrepancy',
      status: 'discrepancy',
      verifiedNet: 4875.0,
      notes: 'Pay slip indicates 25.0% deduction exceeding standard 18% contract rate. Referred to advocate cluster.',
      reviewedAt: '2026-10-09T09:15:00.000Z',
    },
  ];

  return (
    <AppShell
      title="Audit History"
      subtitle="Verified shift submissions and audit decisions."
    >
      <div className="card-subtle p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Audit records</h3>
          <p className="text-xs text-[#5B6370]">
            Log of verified shift reviews and auditor decisions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E1E4EA] text-[#5B6370] text-xs font-medium">
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Worker</th>
                <th className="py-3 px-4 font-medium">Platform</th>
                <th className="py-3 px-4 font-medium">Shift date</th>
                <th className="py-3 px-4 text-right font-medium">Verified net</th>
                <th className="py-3 px-4 text-center font-medium">Decision</th>
                <th className="py-3 px-4 font-medium">Review notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E4EA]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F3F3F0]/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[#5B6370] text-xs tabular-nums">
                    {new Date(log.reviewedAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#22252A]">{log.workerName}</td>
                  <td className="py-3.5 px-4 text-[#5B6370]">{log.platform}</td>
                  <td className="py-3.5 px-4 text-[#5B6370] tabular-nums">{log.shiftDate}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-[#22252A] tabular-nums">
                    PKR {log.verifiedNet.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                        log.status === 'verified'
                          ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                          : 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                      }`}
                    >
                      {log.decision}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#5B6370] max-w-xs truncate" title={log.notes}>
                    {log.notes}
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
