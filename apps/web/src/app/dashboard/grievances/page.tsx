'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  PlusCircle,
  Layers,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkerGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Keyboard shortcut listener for ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSubmitModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function loadGrievances() {
    setLoading(true);
    try {
      const data = await apiClient.getGrievances();
      setGrievances(data);
    } catch (err) {
      console.error('Failed to load grievances:', err);
    } finally {
      setLoading(false);
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
      title="Disputes & Grievances"
      subtitle="File payout discrepancies, track collective clustering, and monitor advocate petitions."
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs text-[#5B6370]">
            Logged disputes are analyzed by the collective clustering engine to assemble joint advocate actions.
          </span>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4332] text-white text-xs font-medium rounded-lg hover:bg-[#2D6A4F] transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>File New Grievance</span>
        </button>
      </div>

      {/* Grievance List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-subtle p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <div className="flex justify-between pt-2 border-t border-[#E1E4EA]">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : grievances.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Active Grievances"
          description="If you notice arbitrary platform commission clawbacks, unfair account deactivations, or withheld tips, file a grievance here for collective action."
          action={{
            label: "File First Grievance",
            onClick: () => setIsSubmitModalOpen(true)
          }}
        />
      ) : (
        <div className="space-y-4">
          {grievances.map((g) => (
            <div key={g.id} className="card-subtle p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border ${
                      g.priority === 'urgent'
                        ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                        : g.priority === 'high'
                        ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
                        : 'bg-[#F3F3F0] text-[#5B6370] border-[#E1E4EA]'
                    }`}
                  >
                    {g.priority} priority
                  </span>
                  <span className="text-xs text-[#5B6370] capitalize font-medium">Platform: {g.platform}</span>
                  <span className="text-[#E1E4EA]">&bull;</span>
                  <span className="text-xs text-[#5B6370] font-mono tabular-nums">{new Date(g.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <span
                    className={`px-2.5 py-0.5 rounded-md capitalize text-[10px] border ${
                      g.status === 'resolved'
                        ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                        : g.status === 'escalated'
                        ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20'
                        : g.status === 'clustered'
                        ? 'bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]/20'
                        : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
                    }`}
                  >
                    {g.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-semibold text-[#22252A] mb-1 tracking-tight">{g.title}</h3>
              <p className="text-xs text-[#5B6370] leading-relaxed mb-3">{g.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E1E4EA] text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[#5B6370]">
                    Claimed Underpayment: <strong className="text-[#22252A] tabular-nums">PKR {g.claimedLossAmount}</strong>
                  </span>
                  <span className="text-[#5B6370]">Category: <strong className="capitalize text-[#22252A]">{g.category.replace(/_/g, ' ')}</strong></span>
                </div>

                {g.clusterId && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1B4332] bg-[#FAF9F5] px-2.5 py-1 rounded-md border border-[#E1E4EA]">
                    <Layers className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
                    <span>Linked to Collective Action Cluster</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Grievance Modal */}
      {isSubmitModalOpen && (
        <div
          className="fixed inset-0 bg-[#22252A]/40 flex items-center justify-center p-4 z-50 animate-modal-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="grievance-modal-title"
        >
          <div className="bg-white rounded-xl border border-[#E1E4EA] max-w-lg w-full p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E4EA] mb-4">
              <h2 id="grievance-modal-title" className="text-base font-semibold text-[#22252A] tracking-tight">Submit Worker Grievance</h2>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-[#5B6370] hover:text-[#22252A] rounded-md transition-colors focus-ring"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unexplained 25% surge fee deduction on October 8 shift"
                  className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  >
                    <option value="careem">Careem Pakistan</option>
                    <option value="indrive">inDrive Pakistan</option>
                    <option value="bykea">Bykea</option>
                    <option value="foodpanda">Foodpanda Pakistan</option>
                    <option value="yango">Yango</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
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
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Claimed Loss (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={claimedLoss}
                    onChange={(e) => setClaimedLoss(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Incident Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide shift dates, trip IDs, and details of unexplained platform deductions..."
                  className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                />
              </div>

              <div className="p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-md text-[11px] text-[#5B6370] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2D6A4F] shrink-0" aria-hidden="true" />
                <span>Identity protected. Worker names are strictly anonymized as <strong className="text-[#22252A]">ANON-XXXX</strong> on public solidarity feeds.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="focus-ring px-3.5 py-1.5 border border-[#E1E4EA] text-xs font-medium rounded-md hover:bg-[#F3F3F0] transition-colors cursor-pointer text-[#22252A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="focus-ring inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1B4332] text-white text-xs font-medium rounded-md hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Filing Grievance...' : 'Submit Grievance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
