'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';

export default function CertificatesPage() {
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-14');
  const [purpose, setPurpose] = useState('housing_rental');
  const [recipientName, setRecipientName] = useState('Cascade Ridge Apartments Leasing Office');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCert, setCurrentCert] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const cert = await apiClient.generateCertificate(startDate, endDate, purpose, recipientName);
      setCurrentCert(cert);
    } catch (err: any) {
      alert('Failed to generate income certificate: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyVerificationLink = () => {
    if (currentCert?.publicVerificationUrl) {
      navigator.clipboard.writeText(currentCert.publicVerificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AppShell
      title="Verifiable Income Certificates"
      subtitle="Generate cryptographically signed proof of gig income for landlords, banks, and visa authorities"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate Generator Form */}
        <div className="lg:col-span-1 space-y-6 no-print">
          <div className="card-subtle p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <h2 className="text-sm font-bold text-[#1C1917]">Request Income Certificate</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                >
                  <option value="housing_rental">Housing / Apartment Rental</option>
                  <option value="loan_application">Bank Loan / Credit Facility</option>
                  <option value="government_support">Social Support Program</option>
                  <option value="visa_immigration">Visa / Consulate Verification</option>
                  <option value="personal_record">Personal Financial Record</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Recipient Name / Agency</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Bank of Punjab Credit Dept"
                  className="focus-ring w-full text-xs p-2 border border-[#E7E5E4] rounded-lg bg-white"
                />
              </div>

              <div className="p-3 bg-[#F2F7F4] border border-[#C5D9CE] rounded-lg text-[11px] text-[#234737] space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" aria-hidden="true" />
                  <span>Auditor Verified Isolation</span>
                </div>
                <p className="leading-relaxed">
                  Only 100% verified shift records are included. Unverified or disputed shifts are excluded from gross and net totals.
                </p>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                aria-busy={isGenerating}
                className="btn-press focus-ring w-full py-2.5 px-4 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling Verified Ledger...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Generate Income Certificate</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Certificate Preview Card */}
        <div className="lg:col-span-2 space-y-6">
          {currentCert ? (
            <div className="card-subtle p-6 bg-white border border-[#E7E5E4] relative animate-modal-enter">
              {/* Certificate Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E7E5E4] mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    Platform Ledger Verified
                  </span>
                  <h3 className="text-base font-bold text-[#1C1917]">FairGig Income Statement</h3>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    Worker: <strong className="text-[#1C1917]">{currentCert.workerName}</strong> &bull; Period: {currentCert.periodStartDate} to {currentCert.periodEndDate}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#1C1917] bg-stone-100 px-2.5 py-1 rounded-md">
                    {currentCert.certificateNumber}
                  </span>
                  <div className="text-[10px] text-[#78716C] mt-1">Valid for 90 days from issuance</div>
                </div>
              </div>

              {/* Verified Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAFAF8] rounded-xl border border-[#E7E5E4] mb-4">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Verified Gross</div>
                  <div className="text-sm font-bold text-[#1C1917] mt-0.5">PKR {currentCert.totalGrossIncome?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Deductions</div>
                  <div className="text-sm font-bold text-red-600 mt-0.5">-PKR {currentCert.totalDeductions?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Verified Net</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">PKR {currentCert.totalNetIncome?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#78716C]">Verified Shifts</div>
                  <div className="text-sm font-bold text-[#1C1917] mt-0.5">{currentCert.verifiedShiftsCount} shifts</div>
                </div>
              </div>

              {/* Cryptographic Signature & Verification URL */}
              <div className="p-3.5 bg-[#F4F7F5] border border-[#C8D5CD] rounded-xl text-xs space-y-2 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[#1A3428]">SHA-256 Ledger Signature:</span>
                  <span className="font-mono text-[10px] text-[#292524] truncate max-w-xs bg-white px-2 py-0.5 rounded border border-[#C8D5CD]">
                    {currentCert.cryptographicSignature}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#C8D5CD]/50">
                  <span className="font-semibold text-[#1A3428]">Public Verification URL:</span>
                  <a
                    href={currentCert.publicVerificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Inspect Public Token</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Required Non-Governmental Disclaimer */}
              <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-[11px] text-amber-900 leading-relaxed mb-5">
                <strong>OFFICIAL VERIFICATION DISCLAIMER:</strong> This document is an automated platform-generated statement derived solely from cryptographically verified shift records on the FairGig gig-work transparency ledger. It does NOT constitute a government-issued tax certificate, statutory proof of permanent employment, or a bank guarantee.
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E7E5E4] no-print">
                <button
                  type="button"
                  onClick={copyVerificationLink}
                  className="btn-press focus-ring px-3.5 py-1.5 border border-[#E7E5E4] rounded-lg text-xs font-semibold text-[#44403C] hover:bg-stone-50 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{copied ? 'Copied Verification Link!' : 'Copy Verification Link'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-press focus-ring px-4 py-1.5 bg-[#1E3A2F] text-white rounded-lg text-xs font-semibold hover:bg-[#234737] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Print A4 Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-subtle p-12 text-center text-[#78716C]">
              <div className="w-12 h-12 rounded-full bg-[#F2F7F4] border border-[#C5D9CE] flex items-center justify-center text-[#1E3A2F] mx-auto mb-3">
                <FileCheck className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1917]">No Active Certificate Generated</h3>
              <p className="text-xs text-[#78716C] max-w-sm mx-auto mt-1 leading-relaxed">
                Select your required date range and recipient on the left to compile a tamper-proof income statement from verified shifts.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
