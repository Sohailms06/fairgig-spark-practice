'use client';

import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

export default function AdvocateGrievancesPage() {
  const [clusters, setClusters] = useState([
    {
      id: '66666666-7777-8888-9999-000000000000',
      title: 'Careem Unexplained Surge Fee Clawbacks - October 2026',
      platform: 'careem',
      category: 'unexplained_deduction',
      affectedCount: 47,
      estimatedLoss: 8940.0,
      status: 'escalated',
      targetRepresentative: 'Punjab Directorate of Labor Welfare',
      tags: ['#surge_clawback', '#careem_pakistan', '#systemic_discrepancy'],
    },
    {
      id: '77777777-8888-9999-0000-111111111111',
      title: 'Foodpanda Missing Rain Peak Delivery Allowances',
      platform: 'foodpanda',
      category: 'fare_underpayment',
      affectedCount: 23,
      estimatedLoss: 4600.0,
      status: 'clustered',
      targetRepresentative: 'Direct Platform Management Review',
      tags: ['#rain_incentive', '#foodpanda_pk'],
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleEscalate = (clusterId: string) => {
    setClusters((prev) =>
      prev.map((c) =>
        c.id === clusterId ? { ...c, status: 'escalated' } : c
      )
    );
    setNotification('Petition escalated to Directorate of Labor Welfare under FairGig cluster verification!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleResolve = (clusterId: string) => {
    setClusters((prev) =>
      prev.map((c) =>
        c.id === clusterId ? { ...c, status: 'resolved' } : c
      )
    );
    setNotification('Cluster marked as resolved with platform payout reimbursement notes.');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <AppShell
      title="Collective Grievance Action Hub"
      subtitle="Aggregate systemic platform issues, organize petitions, and escalate joint actions to labor standards regulators."
    >
      {notification && (
        <div className="mb-4 p-3 bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 rounded-lg text-xs font-medium text-[#2D6A4F] flex items-center gap-2 animate-modal-enter">
          <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" aria-hidden="true" />
          <span>{notification}</span>
        </div>
      )}

      <div className="space-y-6">
        {clusters.map((cluster) => (
          <div key={cluster.id} className="card-subtle p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 px-2 py-0.5 rounded-md">
                    Collective Action Cluster
                  </span>
                  <span className="text-xs font-medium capitalize text-[#5B6370]">
                    Platform: {cluster.platform}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#22252A] tracking-tight">{cluster.title}</h3>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold text-[#22252A] tabular-nums">
                  PKR {cluster.estimatedLoss.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-[#D97706] flex items-center justify-end gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span>{cluster.affectedCount} Workers Joint Claim</span>
                </div>
              </div>
            </div>

            {/* Tags Bar */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {cluster.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#FAF9F5] text-[#5B6370] border border-[#E1E4EA]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Target Regulatory Body */}
            <div className="p-3 bg-[#FAF9F5] rounded-lg border border-[#E1E4EA] text-xs flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-[#5B6370]">Designated Enforcement Authority:</span>
              <span className="font-medium text-[#22252A]">{cluster.targetRepresentative}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E1E4EA]">
              <span
                className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  cluster.status === 'resolved'
                    ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                    : cluster.status === 'escalated'
                    ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20'
                    : 'bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]/20'
                }`}
              >
                Status: {cluster.status}
              </span>

              <div className="flex items-center gap-2">
                {cluster.status !== 'resolved' && (
                  <>
                    <button
                      onClick={() => handleEscalate(cluster.id)}
                      className="focus-ring px-3 py-1.5 bg-[#2563EB] text-white rounded-md text-xs font-medium hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3 h-3" aria-hidden="true" />
                      <span>Escalate to Directorate</span>
                    </button>
                    <button
                      onClick={() => handleResolve(cluster.id)}
                      className="focus-ring px-3 py-1.5 bg-[#1B4332] text-white rounded-md text-xs font-medium hover:bg-[#2D6A4F] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      <span>Mark Resolved</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
