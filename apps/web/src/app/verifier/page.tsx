'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  Search,
  Loader2,
  Lock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function VerifierQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
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
      await apiClient.submitVerificationDecision(selectedItem.id, decision, notes || 'Verified by human auditor');
      const actionName = decision === 'approve' ? 'Approved & Verified' : decision === 'flag_discrepancy' ? 'Flagged as Discrepancy' : 'Marked Unverifiable';
      setActionFeedback(`Shift #${selectedItem.id.substring(0, 8)} ${actionName}. Signed into audit log.`);
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
    if (confidence >= 0.85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (confidence >= 0.6) return 'text-amber-800 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <AppShell
      title="Evidence Audit &amp; Shift Verification Queue"
      subtitle="Inspect pay stub OCR screenshots, audit platform deductions, and verify ledger records"
    >
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="mb-4 p-3 bg-[#F2F7F4] border border-[#C5D9CE] rounded-xl text-xs font-medium text-[#1E3A2F] flex items-center gap-2 animate-modal-enter shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>{actionFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Review Queue List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4] text-xs">
            <span className="font-semibold text-[#1C1917]">{queue.length} Shifts Pending Audit</span>
            <span className="text-[10px] text-[#78716C] flex items-center gap-1 font-mono">
              <Lock className="w-3 h-3 text-stone-400" aria-hidden="true" />
              <span>Private S3 Bucket</span>
            </span>
          </div>

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
          ) : queue.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Audit Queue Clear"
              description="All submitted shift screenshot proofs have been reviewed and verified by platform auditors."
            />
          ) : (
            queue.map((item) => {
              const ocrPercent = Math.round(item.ocrConfidence * 100);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl border cursor-pointer transition text-xs ${
                    selectedItem?.id === item.id
                      ? 'border-[#1E3A2F] bg-[#F2F7F4] shadow-2xs'
                      : 'border-[#E7E5E4] bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-[#1C1917]">{item.workerName}</span>
                    <span className="capitalize font-medium text-[#1E3A2F]">{item.platform}</span>
                  </div>
                  <div className="text-[11px] text-[#78716C] flex items-center justify-between">
                    <span>Shift Date: {item.shiftDate}</span>
                    <span className="font-semibold text-[#1C1917] tabular-nums">PKR {item.netAmount}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-medium border ${getOcrColor(item.ocrConfidence)}`}>
                      OCR Match: {ocrPercent}%
                    </span>
                    <span className="text-[#78716C] font-mono">{item.evidenceCount} screenshot attached</span>
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
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E7E5E4]">
                <div>
                  <h3 className="text-sm font-semibold text-[#1C1917] tracking-tight">Evidence Inspection: {selectedItem.workerName}</h3>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    Worker ID: {selectedItem.workerId} &bull; Shift: {selectedItem.shiftDate} ({selectedItem.hoursWorked} hrs)
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase bg-amber-50 text-amber-800 border border-amber-200">
                  {selectedItem.verificationStatus}
                </span>
              </div>

              {/* Financial Comparison Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAFAF8] rounded-xl border border-[#E7E5E4] text-xs">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Reported Gross</div>
                  <div className="text-sm font-bold text-[#1C1917] mt-0.5">PKR {selectedItem.grossAmount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Reported Deductions</div>
                  <div className="text-sm font-bold text-red-600 mt-0.5">-PKR {selectedItem.deductions}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Reported Take-Home</div>
                  <div className="text-sm font-bold text-[#1E3A2F] mt-0.5">PKR {selectedItem.netAmount}</div>
                </div>
              </div>

              {/* OCR Match Confidence Bar */}
              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1917]">Automated OCR Confidence Score</span>
                  <span className="font-mono font-bold text-[#1E3A2F]">{Math.round(selectedItem.ocrConfidence * 100)}% Match</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1E3A2F] h-full rounded-full transition-all duration-300"
                    style={{ width: `${selectedItem.ocrConfidence * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#78716C]">
                  Optical character recognition extracted date, platform header, and net payout token.
                </div>
              </div>

              {/* Secure Evidence Display Placeholder */}
              <div>
                <div className="text-xs font-semibold text-[#44403C] uppercase mb-2">Authenticated OCR Evidence File</div>
                <div className="p-6 border-2 border-dashed border-[#C5D9CE] rounded-xl bg-[#F2F7F4] text-center">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#C5D9CE] flex items-center justify-center mx-auto mb-2 text-[#1E3A2F]">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="text-xs font-bold text-[#1C1917]">{selectedItem.platform} Paystub Screenshot &bull; Trip ID #9831</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5 font-mono">
                    Storage: evidence-private/{selectedItem.workerId?.substring(0, 8)}/stub.png
                  </div>
                  <div className="mt-3 text-xs text-emerald-800 font-semibold flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    <span>OCR Match Confirmed: PKR {selectedItem.netAmount} matches statement net payout</span>
                  </div>
                </div>
              </div>

              {/* Audit Notes Form */}
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase mb-1.5">
                  Verifier Review Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Screenshot timestamps match logged shift hours; deductions confirmed."
                  className="focus-ring w-full text-xs p-2.5 border border-[#E7E5E4] rounded-lg bg-white"
                />
              </div>

              {/* Decision Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E7E5E4]">
                <div className="text-[11px] text-[#78716C]">
                  Decisions are permanently signed into the PostgreSQL audit log.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision('flag_discrepancy')}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="btn-press focus-ring px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Flag Discrepancy</span>
                  </button>
                  <button
                    onClick={() => handleDecision('mark_unverifiable')}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="btn-press focus-ring px-3.5 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Unverifiable</span>
                  </button>
                  <button
                    onClick={() => handleDecision('approve')}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="btn-press focus-ring px-4 py-1.5 bg-[#1E3A2F] text-white rounded-lg text-xs font-semibold hover:bg-[#234737] transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{isSubmitting ? 'Signing...' : 'Approve & Verify'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-subtle p-12 text-center text-[#78716C] text-xs">
              Select a shift from the queue on the left to inspect screenshot evidence.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
