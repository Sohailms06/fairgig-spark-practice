'use client';

import React, { useState } from 'react';
import {
  Layers,
  Flame,
  ArrowUpRight,
  CheckCircle2,
  Tag,
  Send,
  ShieldCheck,
  Scale,
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
      subtitle="Aggregate systemic platform issues, organize petitions, and escalate joint actions to labor standards regulators"
    >
      {notification && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-modal-enter shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>{notification}</span>
        </div>
      )}

      <div className="space-y-6">
        {clusters.map((cluster) => (
          <div key={cluster.id} className="card-subtle p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                    Collective Action Cluster
                  </span>
                  <span className="text-xs font-semibold capitalize text-[#78716C]">
                    Platform: {cluster.platform}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">{cluster.title}</h3>
              </div>

              <div className="text-right">
                <div className="text-lg font-extrabold text-[#1C1917]">
                  PKR {cluster.estimatedLoss.toLocaleString()}
                </div>
                <div className="text-xs font-bold text-amber-700 flex items-center justify-end gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>{cluster.affectedCount} Workers Joint Claim</span>
                </div>
              </div>
            </div>

            {/* Tags Bar */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {cluster.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-100 text-[#44403C] border border-[#E7E5E4]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Target Regulatory Body */}
            <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E7E5E4] text-xs flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-[#78716C]">Designated Enforcement Authority:</span>
              <span className="font-semibold text-[#1C1917]">{cluster.targetRepresentative}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0EFEA]">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  cluster.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : cluster.status === 'escalated'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                Status: {cluster.status}
              </span>

              <div className="flex items-center gap-2">
                {cluster.status !== 'resolved' && (
                  <>
                    <button
                      onClick={() => handleEscalate(cluster.id)}
                      className="btn-press focus-ring px-3.5 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" aria-hidden="true" />
                      <span>Escalate to Directorate</span>
                    </button>
                    <button
                      onClick={() => handleResolve(cluster.id)}
                      className="btn-press focus-ring px-3.5 py-1.5 bg-[#1E3A2F] text-white rounded-lg text-xs font-semibold hover:bg-[#234737] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
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
