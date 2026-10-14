'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  PlusCircle,
  UploadCloud,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function EarningsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Form State
  const [platform, setPlatform] = useState('indrive');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursWorked, setHoursWorked] = useState('8.0');
  const [grossAmount, setGrossAmount] = useState('5000');
  const [deductions, setDeductions] = useState('1000');
  const [tipsAmount, setTipsAmount] = useState('200');
  const [tripsCount, setTripsCount] = useState('12');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV State
  const [csvRaw, setCsvRaw] = useState(
    'shift_date,platform,hours_worked,gross_amount,deductions,tips_amount,trips_count\n2026-10-15,indrive,7.5,5500,1100,250,13\n2026-10-16,bykea,6.0,4200,750,150,15'
  );

  useEffect(() => {
    loadShifts();
  }, []);

  // Keyboard shortcut listener for ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setIsCsvModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function loadShifts() {
    setLoading(true);
    try {
      const data = await apiClient.getShifts();
      setShifts(data);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setLoading(false);
    }
  }

  const calculatedNet = Math.max(0, (Number(grossAmount) || 0) - (Number(deductions) || 0) + (Number(tipsAmount) || 0));

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.createShift({
        platform,
        shiftDate,
        hoursWorked: Number(hoursWorked),
        grossAmount: Number(grossAmount),
        netAmount: calculatedNet,
        deductions: Number(deductions),
        tipsAmount: Number(tipsAmount),
        tripsCount: Number(tripsCount),
        notes,
      });
      setIsAddModalOpen(false);
      await loadShifts();
    } catch (err) {
      alert('Error creating shift: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvImport = async () => {
    setIsSubmitting(true);
    try {
      const lines = csvRaw.trim().split('\n');
      if (lines.length > 1) {
        // Parse CSV rows
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 5) {
            await apiClient.createShift({
              shiftDate: parts[0]?.trim(),
              platform: parts[1]?.trim() || 'indrive',
              hoursWorked: Number(parts[2]?.trim()) || 8,
              grossAmount: Number(parts[3]?.trim()) || 5000,
              deductions: Number(parts[4]?.trim()) || 1000,
              tipsAmount: Number(parts[5]?.trim()) || 0,
              tripsCount: Number(parts[6]?.trim()) || 10,
              notes: 'Batch CSV Imported Shift',
            });
          }
        }
      }
      setIsCsvModalOpen(false);
      await loadShifts();
    } catch (err) {
      alert('Error importing CSV: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredShifts = shifts.filter((s) => {
    if (platformFilter !== 'all' && s.platform !== platformFilter) return false;
    if (statusFilter !== 'all' && s.verificationStatus !== statusFilter) return false;
    return true;
  });

  return (
    <AppShell
      title="Shifts & Earnings Ledger"
      subtitle="Log daily gig shifts, import platform statements, and track auditor verification"
    >
      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Platform Filter */}
          <div className="flex items-center gap-2 text-xs text-[#78716C] bg-white border border-[#E7E5E4] px-3 py-1.5 rounded-lg shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-[#78716C]" aria-hidden="true" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-[#1C1917] font-medium focus:outline-none cursor-pointer"
              aria-label="Filter shifts by platform"
            >
              <option value="all">All Platforms</option>
              <option value="indrive">inDrive</option>
              <option value="bykea">Bykea</option>
              <option value="foodpanda">Foodpanda</option>
              <option value="careem">Careem</option>
              <option value="yango">Yango</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs text-[#78716C] bg-white border border-[#E7E5E4] px-3 py-1.5 rounded-lg shadow-2xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[#1C1917] font-medium focus:outline-none cursor-pointer"
              aria-label="Filter shifts by audit status"
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Audit</option>
              <option value="discrepancy">Discrepancy Flagged</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="btn-press focus-ring inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E7E5E4] text-[#44403C] text-xs font-semibold rounded-lg hover:bg-stone-50 shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#78716C]" aria-hidden="true" />
            <span>CSV Statement Import</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-press focus-ring inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log Single Shift</span>
          </button>
        </div>
      </div>

      {/* Shifts Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="card-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#E7E5E4] text-[#78716C] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Shift Date</th>
                  <th className="py-3 px-4 font-semibold">Platform</th>
                  <th className="py-3 px-4 text-right font-semibold">Hours</th>
                  <th className="py-3 px-4 text-right font-semibold">Trips</th>
                  <th className="py-3 px-4 text-right font-semibold">Gross (PKR)</th>
                  <th className="py-3 px-4 text-right font-semibold">Deductions</th>
                  <th className="py-3 px-4 text-right font-semibold">Tips</th>
                  <th className="py-3 px-4 text-right font-bold">Net (PKR)</th>
                  <th className="py-3 px-4 text-right font-semibold">Rate</th>
                  <th className="py-3 px-4 text-center font-semibold">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#78716C]">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <p className="font-semibold text-[#1C1917]">No Matching Shifts Found</p>
                        <p className="text-[11px] text-[#78716C]">Try clearing the platform or verification filters to see all recorded shifts.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift) => {
                    const rate = shift.hoursWorked > 0 ? (shift.netAmount / shift.hoursWorked).toFixed(1) : '0';
                    return (
                      <tr key={shift.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#1C1917]">{shift.shiftDate}</td>
                        <td className="py-3.5 px-4 capitalize font-medium text-[#44403C]">{shift.platform}</td>
                        <td className="py-3.5 px-4 text-right text-[#44403C]">{shift.hoursWorked} hrs</td>
                        <td className="py-3.5 px-4 text-right text-[#78716C]">{shift.tripsCount || 1}</td>
                        <td className="py-3.5 px-4 text-right text-[#44403C]">PKR {shift.grossAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-red-600">-PKR {shift.deductions.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-emerald-700">+PKR {shift.tipsAmount || 0}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#1C1917]">
                          PKR {shift.netAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#78716C]">PKR {rate}/hr</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              shift.verificationStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : shift.verificationStatus === 'discrepancy'
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {shift.verificationStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Shift Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-modal-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-shift-title"
        >
          <div className="bg-white rounded-xl border border-[#E7E5E4] max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4] mb-4">
              <h2 id="manual-shift-title" className="text-base font-bold text-[#1C1917]">Log Daily Gig Shift</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md transition focus-ring"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddShift} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  >
                    <option value="indrive">inDrive</option>
                    <option value="bykea">Bykea</option>
                    <option value="foodpanda">Foodpanda</option>
                    <option value="careem">Careem</option>
                    <option value="yango">Yango</option>
                    <option value="cheetay">Cheetay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Shift Date</label>
                  <input
                    type="date"
                    required
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Hours Worked</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Trips Logged</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tripsCount}
                    onChange={(e) => setTripsCount(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Gross (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Deductions</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Tips</label>
                  <input
                    type="number"
                    min="0"
                    value={tipsAmount}
                    onChange={(e) => setTipsAmount(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Dynamic Real-Time Math Preview */}
              <div className="p-3 bg-[#F2F7F4] border border-[#C5D9CE] rounded-lg flex items-center justify-between text-xs">
                <span className="font-semibold text-[#234737]">Calculated Take-Home Net:</span>
                <span className="font-bold text-sm text-[#1E3A2F]">PKR {calculatedNet.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Shift Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Airport surge fare; heavy traffic"
                  className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-press focus-ring px-3.5 py-1.5 border border-[#E7E5E4] text-xs font-semibold rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="btn-press focus-ring inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Recording Shift...' : 'Record Shift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Batch Import Modal */}
      {isCsvModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-modal-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-modal-title"
        >
          <div className="bg-white rounded-xl border border-[#E7E5E4] max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4] mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <h2 id="csv-modal-title" className="text-base font-bold text-[#1C1917]">CSV Statement Batch Import</h2>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md transition focus-ring"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#78716C] mb-3">
              Paste CSV records exported from inDrive, Bykea, or Careem rider weekly summaries:
            </p>

            <textarea
              rows={6}
              value={csvRaw}
              onChange={(e) => setCsvRaw(e.target.value)}
              className="focus-ring w-full font-mono text-[11px] p-2.5 border border-[#E7E5E4] rounded-lg mb-4 bg-[#FAFAF8]"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#78716C]">
                {csvRaw.trim().split('\n').length - 1} shifts ready to import
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="btn-press focus-ring px-3.5 py-1.5 border border-[#E7E5E4] text-xs font-semibold rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="btn-press focus-ring inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Importing Shifts...' : 'Confirm Batch Import'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
