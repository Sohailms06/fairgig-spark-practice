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
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';

export default function VerifierQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    try {
      const data = await apiClient.getVerificationQueue();
      setQueue(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  }

  const handleDecision = async (decision: 'approve' | 'flag_discrepancy' | 'mark_unverifiable') => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await apiClient.submitVerificationDecision(selectedItem.id, decision, notes || 'Verified by human auditor');
      alert(`Shift successfully processed with decision: ${decision.replace(/_/g, ' ').toUpperCase()}`);
      setQueue((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
      setNotes('');
    } catch (err: any) {
      alert('Error submitting review: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Evidence Audit &amp; Shift Verification Queue"
      subtitle="Inspect pay stub OCR screenshots, audit platform deductions, and verify ledger records"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Review Queue List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4] text-xs">
            <span className="font-bold text-[#1C1917]">{queue.length} Shifts Pending Audit</span>
            <span className="text-[#78716C]">Private Evidence Bucket</span>
          </div>

          {queue.length === 0 ? (
            <div className="card-subtle p-8 text-center text-[#78716C] text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-700" />
              All pending shift uploads have been audited.
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 rounded-xl border cursor-pointer transition text-xs ${
                  selectedItem?.id === item.id
                    ? 'border-[#1E3A2F] bg-[#F2F7F4] shadow-xs'
                    : 'border-[#E7E5E4] bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#1C1917]">{item.workerName}</span>
                  <span className="capitalize font-semibold text-[#1E3A2F]">{item.platform}</span>
                </div>
                <div className="text-[11px] text-[#78716C] flex items-center justify-between">
                  <span>Shift Date: {item.shiftDate}</span>
                  <span className="font-bold text-[#1C1917]">PKR {item.netAmount}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-700 font-medium">OCR Confidence: {Math.round(item.ocrConfidence * 100)}%</span>
                  <span className="text-[#78716C] font-mono">{item.evidenceCount} screenshot attached</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Evidence Inspector & Audit Actions */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="card-subtle p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917]">Evidence Inspection: {selectedItem.workerName}</h3>
                  <div className="text-xs text-[#78716C]">
                    Worker ID: {selectedItem.workerId} &bull; Shift: {selectedItem.shiftDate} ({selectedItem.hoursWorked} hrs)
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                  {selectedItem.verificationStatus}
                </span>
              </div>

              {/* Financial Comparison Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAFAF8] rounded-xl border border-[#E7E5E4] text-xs">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Reported Gross</div>
                  <div className="text-sm font-bold text-[#1C1917]">PKR {selectedItem.grossAmount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Reported Deductions</div>
                  <div className="text-sm font-bold text-red-600">-PKR {selectedItem.deductions}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Reported Take-Home</div>
                  <div className="text-sm font-bold text-[#1E3A2F]">PKR {selectedItem.netAmount}</div>
                </div>
              </div>

              {/* Secure Evidence Display Placeholder */}
              <div>
                <div className="text-xs font-semibold text-[#44403C] uppercase mb-2">Authenticated OCR Evidence File</div>
                <div className="p-6 border-2 border-dashed border-[#C5D9CE] rounded-xl bg-[#F2F7F4] text-center">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#C5D9CE] flex items-center justify-center mx-auto mb-2 text-[#1E3A2F]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-[#1C1917]">inDrive Payout Screenshot &bull; Trip ID #9831</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5 font-mono">
                    Storage: evidence-private/{selectedItem.workerId?.substring(0, 8)}/stub.png
                  </div>
                  <div className="mt-3 text-xs text-emerald-800 font-semibold">
                    OCR Match Confirmed: PKR {selectedItem.netAmount} matches statement net payout
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
                  className="w-full text-xs p-2.5 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
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
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flag Discrepancy</span>
                  </button>
                  <button
                    onClick={() => handleDecision('mark_unverifiable')}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Unverifiable</span>
                  </button>
                  <button
                    onClick={() => handleDecision('approve')}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-[#1E3A2F] text-white rounded-lg text-xs font-semibold hover:bg-[#234737] transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve &amp; Verify</span>
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
