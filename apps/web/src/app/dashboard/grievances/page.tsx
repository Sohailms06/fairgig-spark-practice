'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  PlusCircle,
  Layers,
  X,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';

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
      title="Grievances"
      subtitle="Report deduction discrepancies and track dispute status."
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-[#5B6370]">
          {grievances.length} {grievances.length === 1 ? 'grievance' : 'grievances'} filed
        </span>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="focus-ring inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B4332] text-white text-xs font-medium rounded-lg hover:bg-[#2D6A4F] transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>File grievance</span>
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
          title="No active grievances"
          description="If you notice arbitrary platform fee deductions, unfair deactivations, or withheld tips, file a grievance here."
          action={{
            label: "File grievance",
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
                    className={`px-2 py-0.5 rounded-md text-xs font-medium uppercase tracking-wider border ${
                      g.priority === 'urgent'
                        ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                        : g.priority === 'high'
                        ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
                        : 'bg-[#F3F3F0] text-[#5B6370] border-[#E1E4EA]'
                    }`}
                  >
                    {g.priority} priority
                  </span>
                  <span className="text-xs text-[#5B6370] capitalize">{g.platform}</span>
                  <span className="text-[#E1E4EA]">&bull;</span>
                  <span className="text-xs text-[#5B6370] tabular-nums">{new Date(g.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Status Indicator */}
                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md capitalize text-xs font-medium border ${
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
              <p className="text-sm text-[#5B6370] leading-relaxed mb-3">{g.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E1E4EA] text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[#5B6370]">
                    Claimed underpayment: <strong className="text-[#22252A] tabular-nums">PKR {g.claimedLossAmount}</strong>
                  </span>
                  <span className="text-[#5B6370]">Category: <strong className="capitalize text-[#22252A]">{g.category.replace(/_/g, ' ')}</strong></span>
                </div>

                {g.clusterId && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1B4332] bg-[#FAF9F5] px-2.5 py-1 rounded-md border border-[#E1E4EA]">
                    <Layers className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
                    <span>Linked to collective action</span>
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
          <div className="bg-white rounded-xl border border-[#E1E4EA] max-w-md w-full p-4 sm:p-6 shadow-sm max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E4EA] mb-4">
              <h2 id="grievance-modal-title" className="text-base font-semibold text-[#22252A] tracking-tight">File grievance</h2>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-10 h-10 -mr-2 text-[#5B6370] hover:text-[#22252A] rounded-lg transition-colors focus-ring flex items-center justify-center"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unexplained 25% surge fee deduction"
                  className="focus-ring w-full text-base sm:text-sm p-2.5 border border-[#E1E4EA] rounded-lg bg-white text-[#22252A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Platform</label>
                  <Select
                    value={platform}
                    onValueChange={setPlatform}
                    options={[
                      { value: 'careem', label: 'Careem' },
                      { value: 'indrive', label: 'inDrive' },
                      { value: 'bykea', label: 'Bykea' },
                      { value: 'foodpanda', label: 'Foodpanda' },
                      { value: 'yango', label: 'Yango' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Category</label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    options={[
                      { value: 'unexplained_deduction', label: 'Unexplained deduction' },
                      { value: 'fare_underpayment', label: 'Fare underpayment' },
                      { value: 'surge_manipulation', label: 'Surge clawback' },
                      { value: 'tip_withholding', label: 'Tip withholding' },
                      { value: 'account_deactivation', label: 'Account deactivation' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Claimed underpayment (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={claimedLoss}
                    onChange={(e) => setClaimedLoss(e.target.value)}
                    className="focus-ring w-full text-base sm:text-sm p-2.5 border border-[#E1E4EA] rounded-lg bg-white text-[#22252A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Priority</label>
                  <Select
                    value={priority}
                    onValueChange={setPriority}
                    options={[
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide shift dates, trip numbers, and details of deductions..."
                  className="focus-ring w-full text-sm p-2.5 border border-[#E1E4EA] rounded-lg bg-white text-[#22252A]"
                />
              </div>

              <div className="p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-lg text-xs text-[#5B6370]">
                Worker identity is anonymized on public feeds.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="focus-ring px-3.5 py-2 border border-[#E1E4EA] text-xs font-medium rounded-lg hover:bg-[#F3F3F0] transition-colors cursor-pointer text-[#22252A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="focus-ring inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B4332] text-white text-xs font-medium rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Submitting...' : 'Submit grievance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
