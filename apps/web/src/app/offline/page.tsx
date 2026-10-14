'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Brand Monogram */}
        <div className="w-12 h-12 rounded-xl bg-[#1B4332] text-white font-semibold text-base flex items-center justify-center mx-auto mb-6">
          FG
        </div>

        {/* Offline Card */}
        <div className="bg-white border border-[#E1E4EA] rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F5] border border-[#E1E4EA] flex items-center justify-center text-[#5B6370] mx-auto mb-4">
            <WifiOff className="w-5 h-5 text-[#5B6370]" aria-hidden="true" />
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-[#22252A] mb-2">
            Internet Connection Required
          </h1>

          <p className="text-xs text-[#5B6370] leading-relaxed mb-6">
            FairGig connects directly to the live cryptographic ledger. Real-time earnings records, anomaly evaluations, and verification proofs cannot be served offline.
          </p>

          <div className="p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-lg text-left text-[11px] text-[#5B6370] mb-6 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-[#22252A] block font-medium mb-0.5">Financial Data Protection</strong>
              <span>Private earnings balances and audit tokens are never retained in unverified browser caches to protect worker data integrity.</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="focus-ring w-full py-2.5 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry Connection</span>
            </button>

            <Link
              href="/"
              className="focus-ring w-full py-2.5 px-4 border border-[#E1E4EA] text-xs font-medium text-[#22252A] rounded-lg hover:bg-[#F3F3F0] transition-colors flex items-center justify-center gap-2 block"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-[#5B6370] mt-6">
          FairGig PWA &bull; Secure Financial Workspace
        </p>
      </div>
    </div>
  );
}
