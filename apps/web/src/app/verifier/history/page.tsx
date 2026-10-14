'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

export default function VerifierHistoryPage() {
  const auditLogs = [
    {
      id: 'rev-01',
      shiftDate: '2026-10-14',
      workerName: 'Tariq Mehmood',
      platform: 'inDrive',
      decision: 'Approved & Verified',
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
      decision: 'Approved & Verified',
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
      decision: 'Flagged Discrepancy',
      status: 'discrepancy',
      verifiedNet: 4875.0,
      notes: 'Pay slip indicates 25.0% deduction exceeding standard 18% contract rate. Referred to advocate cluster.',
      reviewedAt: '2026-10-09T09:15:00.000Z',
    },
  ];

  return (
    <AppShell
      title="Auditor Review History"
      subtitle="Historical verification audit trails permanently recorded on the FairGig cryptographic ledger"
    >
      <div className="card-subtle p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#1C1917]">Audit Decision Records</h3>
          <p className="text-xs text-[#78716C]">
            Signed verification decisions stored in PostgreSQL table `verification_reviews`
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E7E5E4] text-[#78716C] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Audit Timestamp</th>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Shift Date</th>
                <th className="py-3 px-4 text-right">Verified Net</th>
                <th className="py-3 px-4 text-center">Decision</th>
                <th className="py-3 px-4">Auditor Review Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAFAF8] transition">
                  <td className="py-3 px-4 font-mono text-[#78716C] text-[11px]">
                    {new Date(log.reviewedAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#1C1917]">{log.workerName}</td>
                  <td className="py-3 px-4 text-[#44403C]">{log.platform}</td>
                  <td className="py-3 px-4 text-[#78716C]">{log.shiftDate}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#1C1917]">
                    PKR {log.verifiedNet.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {log.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#44403C] max-w-xs truncate" title={log.notes}>
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
