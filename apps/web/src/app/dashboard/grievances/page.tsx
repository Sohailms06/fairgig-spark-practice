'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  PlusCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';

export default function WorkerGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('unexplained_deduction');
  const [platform, setPlatform] = useState('careem');
  const [claimedLoss, setClaimedLoss] = useState('450');
  const [priority, setPriority] = useState('high');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGrievances();
  }, []);

  async function loadGrievances() {
    try {
      const data = await apiClient.getGrievances();
      setGrievances(data);
    } catch (err) {
      console.error('Failed to load grievances:', err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.createGrievance({
        title,
        description,
        category,
        platform,
        priority,
        claimedLossAmount: Number(claimedLoss) || 0,
      });
      setIsSubmitModalOpen(false);
      setTitle('');
      setDescription('');
      await loadGrievances();
    } catch (err: any) {
      alert('Error filing grievance: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Disputes & Grievance Ledger"
      subtitle="File payout discrepancies, track collective clustering, and monitor advocate escalation"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs text-[#78716C]">
            Logged disputes are analyzed by the collective clustering engine to build joint advocate petitions.
          </span>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] transition shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>File New Grievance</span>
        </button>
      </div>

      {/* Grievance List */}
      <div className="space-y-4">
        {grievances.map((g) => (
          <div key={g.id} className="card-subtle p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    g.priority === 'urgent'
                      ? 'bg-red-100 text-red-800'
                      : g.priority === 'high'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {g.priority} priority
                </span>
                <span className="text-xs text-[#78716C] capitalize font-medium">Platform: {g.platform}</span>
                <span className="text-[#E7E5E4]">&bull;</span>
                <span className="text-xs text-[#78716C] font-mono">{new Date(g.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className={`px-2.5 py-0.5 rounded-full capitalize text-[10px] ${
                    g.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : g.status === 'escalated'
                      ? 'bg-purple-100 text-purple-800'
                      : g.status === 'clustered'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {g.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-[#1C1917] mb-1">{g.title}</h3>
            <p className="text-xs text-[#44403C] leading-relaxed mb-3">{g.description}</p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0EFEA] text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[#78716C]">
                  Claimed Underpayment: <strong className="text-[#1C1917]">PKR {g.claimedLossAmount}</strong>
                </span>
                <span className="text-[#78716C]">Category: <strong className="capitalize">{g.category.replace(/_/g, ' ')}</strong></span>
              </div>

              {g.clusterId && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Linked to Collective Action Cluster</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* File Grievance Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E7E5E4] max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4] mb-4">
              <h2 className="text-base font-bold text-[#1C1917]">Submit Worker Grievance</h2>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 text-[#78716C] hover:text-[#1C1917] rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unexplained 25% surge fee deduction on October 8 shift"
                  className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  >
                    <option value="careem">Careem Pakistan</option>
                    <option value="indrive">inDrive Pakistan</option>
                    <option value="bykea">Bykea</option>
                    <option value="foodpanda">Foodpanda Pakistan</option>
                    <option value="yango">Yango</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  >
                    <option value="unexplained_deduction">Unexplained Deduction</option>
                    <option value="fare_underpayment">Fare Underpayment</option>
                    <option value="surge_manipulation">Surge Fee Clawback</option>
                    <option value="tip_withholding">Tip Withholding</option>
                    <option value="account_deactivation">Unfair Account Deactivation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Claimed Loss (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={claimedLoss}
                    onChange={(e) => setClaimedLoss(e.target.value)}
                    className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Incident Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide shift dates, trip IDs, and details of unexplained platform deductions..."
                  className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                />
              </div>

              <div className="p-3 bg-[#F2F7F4] border border-[#C5D9CE] rounded-lg text-[11px] text-[#234737] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Your identity is protected. When published to community solidarity feeds, worker names are masked as <strong>ANON-XXXX</strong>.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3 py-1.5 border border-[#E7E5E4] text-xs font-semibold rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] disabled:opacity-50"
                >
                  {isSubmitting ? 'Filing...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
