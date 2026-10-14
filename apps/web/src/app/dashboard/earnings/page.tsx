'use client';

import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  UploadCloud,
  Filter,
  FileSpreadsheet,
  Loader2,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { TableSkeleton } from '@/components/ui/skeleton';

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
      subtitle="Log daily gig shifts, import platform statements, and track auditor verification."
    >
      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Platform Filter */}
          <div className="flex items-center gap-2 text-xs text-[#5B6370] bg-white border border-[#E1E4EA] px-3 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-[#5B6370]" aria-hidden="true" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-[#22252A] font-medium focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-2 text-xs text-[#5B6370] bg-white border border-[#E1E4EA] px-3 py-1.5 rounded-lg">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[#22252A] font-medium focus:outline-none cursor-pointer"
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
            className="focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E1E4EA] text-[#22252A] text-xs font-medium rounded-lg hover:bg-[#F3F3F0] transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#5B6370]" aria-hidden="true" />
            <span>CSV Statement Import</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4332] text-white text-xs font-medium rounded-lg hover:bg-[#2D6A4F] transition-colors cursor-pointer"
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
                <tr className="bg-[#FAF9F5] border-b border-[#E1E4EA] text-[#5B6370] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-medium">Shift Date</th>
                  <th className="py-2.5 px-4 font-medium">Platform</th>
                  <th className="py-2.5 px-4 text-right font-medium">Hours</th>
                  <th className="py-2.5 px-4 text-right font-medium">Trips</th>
                  <th className="py-2.5 px-4 text-right font-medium">Gross</th>
                  <th className="py-2.5 px-4 text-right font-medium">Deductions</th>
                  <th className="py-2.5 px-4 text-right font-medium">Tips</th>
                  <th className="py-2.5 px-4 text-right font-medium">Net</th>
                  <th className="py-2.5 px-4 text-right font-medium">Rate</th>
                  <th className="py-2.5 px-4 text-center font-medium">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E4EA]">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#5B6370]">
                      <div className="max-w-xs mx-auto text-center space-y-1.5">
                        <p className="font-semibold text-[#22252A] text-sm">No Matching Shifts Found</p>
                        <p className="text-xs text-[#5B6370]">Try clearing the platform or verification filters to see all recorded shifts.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift) => {
                    const rate = shift.hoursWorked > 0 ? (shift.netAmount / shift.hoursWorked).toFixed(1) : '0';
                    return (
                      <tr key={shift.id} className="hover:bg-[#F3F3F0]/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#22252A] tabular-nums">{shift.shiftDate}</td>
                        <td className="py-3 px-4 capitalize font-medium text-[#5B6370]">{shift.platform}</td>
                        <td className="py-3 px-4 text-right text-[#5B6370] tabular-nums">{shift.hoursWorked} hrs</td>
                        <td className="py-3 px-4 text-right text-[#5B6370] tabular-nums">{shift.tripsCount || 1}</td>
                        <td className="py-3 px-4 text-right text-[#5B6370] tabular-nums">PKR {shift.grossAmount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-[#DC2626] tabular-nums">-PKR {shift.deductions.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-[#2D6A4F] tabular-nums">+PKR {shift.tipsAmount || 0}</td>
                        <td className="py-3 px-4 text-right font-semibold text-[#22252A] tabular-nums">
                          PKR {shift.netAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-[#5B6370] tabular-nums">PKR {rate}/hr</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-medium capitalize border ${
                              shift.verificationStatus === 'verified'
                                ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                                : shift.verificationStatus === 'discrepancy'
                                ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                                : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
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
          className="fixed inset-0 bg-[#22252A]/40 flex items-center justify-center p-4 z-50 animate-modal-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-shift-title"
        >
          <div className="bg-white rounded-xl border border-[#E1E4EA] max-w-md w-full p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E4EA] mb-4">
              <h2 id="manual-shift-title" className="text-base font-semibold text-[#22252A] tracking-tight">Log Daily Gig Shift</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-[#5B6370] hover:text-[#22252A] rounded-md transition-colors focus-ring"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddShift} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
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
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Shift Date</label>
                  <input
                    type="date"
                    required
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Hours Worked</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Trips Logged</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tripsCount}
                    onChange={(e) => setTripsCount(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Gross (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Deductions</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Tips</label>
                  <input
                    type="number"
                    min="0"
                    value={tipsAmount}
                    onChange={(e) => setTipsAmount(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>
              </div>

              {/* Dynamic Real-Time Math Preview */}
              <div className="p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-md flex items-center justify-between text-xs">
                <span className="font-medium text-[#5B6370]">Calculated Take-Home Net:</span>
                <span className="font-semibold text-sm text-[#1B4332] tabular-nums">PKR {calculatedNet.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Shift Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Airport surge fare; heavy traffic"
                  className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
          className="fixed inset-0 bg-[#22252A]/40 flex items-center justify-center p-4 z-50 animate-modal-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-modal-title"
        >
          <div className="bg-white rounded-xl border border-[#E1E4EA] max-w-lg w-full p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E4EA] mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                <h2 id="csv-modal-title" className="text-base font-semibold text-[#22252A] tracking-tight">CSV Statement Batch Import</h2>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 text-[#5B6370] hover:text-[#22252A] rounded-md transition-colors focus-ring"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B6370] mb-3">
              Paste CSV records exported from inDrive, Bykea, or Careem rider weekly summaries:
            </p>

            <textarea
              rows={6}
              value={csvRaw}
              onChange={(e) => setCsvRaw(e.target.value)}
              className="focus-ring w-full font-mono text-[11px] p-2.5 border border-[#E1E4EA] rounded-md mb-4 bg-[#FAF9F5] text-[#22252A]"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#5B6370]">
                {csvRaw.trim().split('\n').length - 1} shifts ready to import
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="focus-ring px-3.5 py-1.5 border border-[#E1E4EA] text-xs font-medium rounded-md hover:bg-[#F3F3F0] transition-colors cursor-pointer text-[#22252A]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="focus-ring inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1B4332] text-white text-xs font-medium rounded-md hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors cursor-pointer"
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
