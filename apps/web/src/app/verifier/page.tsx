'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';

export default function VerifierQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const data = await apiClient.getVerificationQueue();
      setQueue(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDecision = async (decision: 'approve' | 'flag_discrepancy' | 'mark_unverifiable') => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await apiClient.submitVerificationDecision(selectedItem.id, decision, notes || 'Verified by reviewer');
      const actionName = decision === 'approve' ? 'Approved & verified' : decision === 'flag_discrepancy' ? 'Flagged as discrepancy' : 'Marked unverifiable';
      setActionFeedback(`Shift #${selectedItem.id.substring(0, 8)} ${actionName}.`);
      setTimeout(() => setActionFeedback(null), 4000);

      setQueue((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
      setNotes('');
    } catch (err: any) {
      alert('Error submitting review: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOcrColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-[#2D6A4F] bg-[#2D6A4F]/10 border-[#2D6A4F]/20';
    if (confidence >= 0.6) return 'text-[#D97706] bg-[#D97706]/10 border-[#D97706]/20';
    return 'text-[#DC2626] bg-[#DC2626]/10 border-[#DC2626]/20';
  };

  const filteredQueue = queue.filter((item) => {
    if (platformFilter !== 'all' && item.platform.toLowerCase() !== platformFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <AppShell
      title="Verification Queue"
      subtitle="Review shift evidence and verify earnings records."
    >
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="mb-4 p-3 bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 rounded-lg text-sm font-medium text-[#2D6A4F] flex items-center gap-2 animate-modal-enter">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F] shrink-0" aria-hidden="true" />
          <span>{actionFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Review Queue List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E4EA] text-sm">
            <span className="font-semibold text-[#22252A]">{filteredQueue.length} shifts to review</span>
            <span className="text-xs text-[#5B6370]">Pending</span>
          </div>

          <Select
            value={platformFilter}
            onValueChange={setPlatformFilter}
            aria-label="Filter queue by platform"
            className="w-full"
            options={[
              { value: 'all', label: 'All platforms' },
              { value: 'indrive', label: 'inDrive' },
              { value: 'careem', label: 'Careem' },
              { value: 'bykea', label: 'Bykea' },
              { value: 'foodpanda', label: 'Foodpanda' },
            ]}
          />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-subtle p-4 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : filteredQueue.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={queue.length > 0 ? "No matches" : "Queue clear"}
              description={queue.length > 0 ? "No pending shifts for the selected platform." : "All submitted shift proofs have been reviewed."}
            />
          ) : (
            filteredQueue.map((item) => {
              const ocrPercent = Math.round(item.ocrConfidence * 100);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors text-sm ${
                    selectedItem?.id === item.id
                      ? 'border-[#1B4332] bg-[#FAF9F5]'
                      : 'border-[#E1E4EA] bg-white hover:bg-[#F3F3F0]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-[#22252A]">{item.workerName}</span>
                    <span className="capitalize font-medium text-[#1B4332] text-xs">{item.platform}</span>
                  </div>
                  <div className="text-xs text-[#5B6370] flex items-center justify-between">
                    <span>{item.shiftDate}</span>
                    <span className="font-semibold text-sm text-[#22252A] tabular-nums">PKR {item.netAmount}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-md font-medium border ${getOcrColor(item.ocrConfidence)}`}>
                      OCR match: {ocrPercent}%
                    </span>
                    <span className="text-[#5B6370]">{item.evidenceCount} screenshot</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Evidence Inspector & Audit Actions */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="card-subtle p-6 space-y-6 animate-modal-enter">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E1E4EA]">
                <div>
                  <h3 className="text-base font-semibold text-[#22252A] tracking-tight">{selectedItem.workerName}</h3>
                  <div className="text-xs text-[#5B6370] mt-0.5">
                    {selectedItem.platform} &bull; {selectedItem.shiftDate} &bull; {selectedItem.hoursWorked} hrs
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium uppercase bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                  {selectedItem.verificationStatus}
                </span>
              </div>

              {/* Financial Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FAF9F5] rounded-xl border border-[#E1E4EA]">
                <div>
                  <div className="text-xs font-medium text-[#5B6370]">Reported gross</div>
                  <div className="text-base font-semibold text-[#22252A] mt-0.5 tabular-nums">PKR {selectedItem.grossAmount}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#5B6370]">Deductions</div>
                  <div className="text-base font-semibold text-[#DC2626] mt-0.5 tabular-nums">-PKR {selectedItem.deductions}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#5B6370]">Net earnings</div>
                  <div className="text-base font-semibold text-[#1B4332] mt-0.5 tabular-nums">PKR {selectedItem.netAmount}</div>
                </div>
              </div>

              {/* OCR Match Confidence Bar */}
              <div className="p-4 rounded-xl border border-[#E1E4EA] bg-white space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#22252A]">Automated OCR match</span>
                  <span className="font-semibold text-[#1B4332]">{Math.round(selectedItem.ocrConfidence * 100)}% confidence</span>
                </div>
                <div className="w-full bg-[#F3F3F0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1B4332] h-full rounded-full transition-all duration-300"
                    style={{ width: `${selectedItem.ocrConfidence * 100}%` }}
                  />
                </div>
                <div className="text-xs text-[#5B6370]">
                  Date, platform header, and payout total matched statement screenshot.
                </div>
              </div>

              {/* Evidence Display Card */}
              <div>
                <div className="text-xs font-medium text-[#5B6370] uppercase tracking-wider mb-2">Evidence inspection</div>
                <div className="p-4 sm:p-6 border border-dashed border-[#E1E4EA] rounded-xl bg-[#FAF9F5] text-center">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#E1E4EA] flex items-center justify-center mx-auto mb-2 text-[#1B4332]">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="text-sm font-semibold text-[#22252A] capitalize">{selectedItem.platform} pay stub screenshot</div>
                  <div className="text-xs text-[#5B6370] mt-1">
                    OCR confirmed: PKR {selectedItem.netAmount} matches statement net payout
                  </div>
                </div>
              </div>

              {/* Review Notes Form */}
              <div>
                <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                  Review notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Screenshot timestamps match logged hours; deductions verified."
                  className="focus-ring w-full text-base sm:text-sm p-2.5 border border-[#E1E4EA] rounded-lg bg-white text-[#22252A]"
                />
              </div>

              {/* Decision Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E1E4EA]">
                <div className="text-xs text-[#5B6370]">
                  Decisions are recorded in the audit log.
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={() => handleDecision('flag_discrepancy')}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="focus-ring px-3.5 py-2.5 bg-[#D97706] text-white rounded-lg text-xs font-medium hover:bg-[#B45309] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Flag discrepancy</span>
                  </button>
                  <button
                    onClick={() => handleDecision('mark_unverifiable')}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="focus-ring px-3.5 py-2.5 border border-[#DC2626]/30 text-[#DC2626] rounded-lg text-xs font-medium hover:bg-[#DC2626]/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Unverifiable</span>
                  </button>
                  <button
                    onClick={() => handleDecision('approve')}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="focus-ring px-4 py-2.5 bg-[#1B4332] text-white rounded-lg text-xs font-medium hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{isSubmitting ? 'Signing...' : 'Approve & verify'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-subtle p-12 text-center text-[#5B6370] text-sm">
              Select a shift from the queue to inspect screenshot evidence.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
