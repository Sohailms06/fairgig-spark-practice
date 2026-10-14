'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
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
      title="Income Certificates"
      subtitle="Generate cryptographically signed proof of gig income for housing, banking, and official use."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate Generator Form */}
        <div className="lg:col-span-1 space-y-6 no-print">
          <div className="card-subtle p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#1B4332]" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[#22252A] tracking-tight">Request Certificate</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                >
                  <option value="housing_rental">Housing / Apartment Rental</option>
                  <option value="loan_application">Bank Loan / Credit Facility</option>
                  <option value="government_support">Social Support Program</option>
                  <option value="visa_immigration">Visa / Consulate Verification</option>
                  <option value="personal_record">Personal Financial Record</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Recipient Name / Agency</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Bank of Punjab Credit Dept"
                  className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                />
              </div>

              <div className="p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-md text-[11px] text-[#5B6370] space-y-1">
                <div className="font-semibold text-[#1B4332] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
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
                className="focus-ring w-full py-2 px-4 bg-[#1B4332] text-white text-xs font-medium rounded-md hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            <div className="card-subtle p-6 bg-white border border-[#E1E4EA] relative animate-modal-enter">
              {/* Certificate Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E1E4EA] mb-4">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#2D6A4F] bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 px-2 py-0.5 rounded-md inline-block mb-1">
                    Platform Ledger Verified
                  </span>
                  <h3 className="text-base font-semibold text-[#22252A] tracking-tight">FairGig Income Statement</h3>
                  <div className="text-xs text-[#5B6370] mt-0.5">
                    Worker: <strong className="text-[#22252A]">{currentCert.workerName}</strong> &bull; Period: {currentCert.periodStartDate} to {currentCert.periodEndDate}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-semibold text-[#22252A] bg-[#FAF9F5] border border-[#E1E4EA] px-2.5 py-1 rounded-md">
                    {currentCert.certificateNumber}
                  </span>
                  <div className="text-[10px] text-[#5B6370] mt-1">Valid for 90 days from issuance</div>
                </div>
              </div>

              {/* Verified Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAF9F5] rounded-xl border border-[#E1E4EA] mb-4">
                <div>
                  <div className="text-[10px] uppercase font-medium text-[#5B6370]">Verified Gross</div>
                  <div className="text-sm font-semibold text-[#22252A] mt-0.5 tabular-nums">PKR {currentCert.totalGrossIncome?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-medium text-[#5B6370]">Deductions</div>
                  <div className="text-sm font-semibold text-[#DC2626] mt-0.5 tabular-nums">-PKR {currentCert.totalDeductions?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-medium text-[#5B6370]">Verified Net</div>
                  <div className="text-sm font-semibold text-[#1B4332] mt-0.5 tabular-nums">PKR {currentCert.totalNetIncome?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-medium text-[#5B6370]">Verified Shifts</div>
                  <div className="text-sm font-semibold text-[#22252A] mt-0.5 tabular-nums">{currentCert.verifiedShiftsCount} shifts</div>
                </div>
              </div>

              {/* Cryptographic Signature & Verification URL */}
              <div className="p-3.5 bg-white border border-[#E1E4EA] rounded-xl text-xs space-y-2 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#22252A]">SHA-256 Ledger Signature:</span>
                  <span className="font-mono text-[10px] text-[#5B6370] truncate max-w-xs bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#E1E4EA]">
                    {currentCert.cryptographicSignature}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E1E4EA]">
                  <span className="font-medium text-[#22252A]">Public Verification URL:</span>
                  <a
                    href={currentCert.publicVerificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Inspect Public Token</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Required Non-Governmental Disclaimer */}
              <div className="p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-md text-[11px] text-[#5B6370] leading-relaxed mb-5">
                <strong className="text-[#22252A]">OFFICIAL VERIFICATION DISCLAIMER:</strong> This document is an automated platform-generated statement derived solely from cryptographically verified shift records on the FairGig gig-work transparency ledger. It does NOT constitute a government-issued tax certificate, statutory proof of permanent employment, or a bank guarantee.
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E1E4EA] no-print">
                <button
                  type="button"
                  onClick={copyVerificationLink}
                  className="focus-ring px-3.5 py-1.5 border border-[#E1E4EA] rounded-md text-xs font-medium text-[#22252A] hover:bg-[#F3F3F0] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{copied ? 'Copied Verification Link!' : 'Copy Verification Link'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="focus-ring px-4 py-1.5 bg-[#1B4332] text-white rounded-md text-xs font-medium hover:bg-[#2D6A4F] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Print A4 Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-subtle p-12 text-center text-[#5B6370]">
              <div className="w-12 h-12 rounded-lg bg-[#FAF9F5] border border-[#E1E4EA] flex items-center justify-center text-[#1B4332] mx-auto mb-3">
                <FileCheck className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-[#22252A]">No Active Certificate Generated</h3>
              <p className="text-xs text-[#5B6370] max-w-sm mx-auto mt-1 leading-relaxed">
                Select your required date range and recipient on the left to compile a tamper-proof income statement from verified shifts.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
