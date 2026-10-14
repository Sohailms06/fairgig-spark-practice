'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { Select } from '@/components/ui/select';

export default function AnomaliesPage() {
  const [platform, setPlatform] = useState('careem');
  const [hoursWorked, setHoursWorked] = useState('8.0');
  const [grossAmount, setGrossAmount] = useState('6500');
  const [deductions, setDeductions] = useState('1625');
  const [simResult, setSimResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    try {
      const g = Number(grossAmount) || 0;
      const d = Number(deductions) || 0;
      const n = Math.max(0, g - d);
      const h = Number(hoursWorked) || 8;

      const targetShift = {
        shiftDate: new Date().toISOString().split('T')[0],
        hoursWorked: h,
        grossAmount: g,
        netAmount: n,
        deductions: d,
        tipsAmount: 200,
        tripsCount: 12,
        platform,
      };

      const result = await apiClient.detectAnomaly(targetShift);
      setSimResult(result);
    } catch (err: any) {
      alert('Error running detection: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const applyPreset = (presetGross: number, presetDeductions: number, presetPlatform: string) => {
    setGrossAmount(presetGross.toString());
    setDeductions(presetDeductions.toString());
    setPlatform(presetPlatform);
  };

  return (
    <AppShell
      title="Anomalies"
      subtitle="Review unusual deductions."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Check Deductions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-subtle p-6">
            <h2 className="text-base font-semibold text-[#22252A] tracking-tight mb-4">
              Check deductions
            </h2>

            {/* Quick Example Presets */}
            <div className="mb-4">
              <span className="text-xs font-medium text-[#5B6370] block mb-2">
                Quick examples
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(6500, 1950, 'careem')}
                  className="focus-ring text-xs font-medium px-2.5 py-1 bg-white border border-[#DC2626]/30 text-[#DC2626] rounded-md hover:bg-[#DC2626]/5 cursor-pointer transition-colors"
                >
                  30% spike
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(6500, 1625, 'careem')}
                  className="focus-ring text-xs font-medium px-2.5 py-1 bg-white border border-[#D97706]/30 text-[#D97706] rounded-md hover:bg-[#D97706]/5 cursor-pointer transition-colors"
                >
                  25% cut
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(5000, 1000, 'indrive')}
                  className="focus-ring text-xs font-medium px-2.5 py-1 bg-white border border-[#E1E4EA] text-[#1B4332] rounded-md hover:bg-[#F3F3F0] cursor-pointer transition-colors"
                >
                  20% baseline
                </button>
              </div>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4">
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
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Hours worked</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="focus-ring w-full text-base sm:text-sm p-2 border border-[#E1E4EA] rounded-lg bg-white text-[#22252A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Gross earnings (PKR)</label>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="focus-ring w-full text-base sm:text-sm p-2 border border-[#E1E4EA] rounded-lg bg-white text-[#22252A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B6370] mb-1.5">Deductions (PKR)</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="focus-ring w-full text-base sm:text-sm p-2 border border-[#E1E4EA] rounded-lg bg-white text-[#22252A]"
                />
                <div className="text-xs text-[#5B6370] mt-1.5 flex items-center justify-between">
                  <span>Deduction rate:</span>
                  <span className="font-semibold text-[#22252A] tabular-nums">
                    {Number(grossAmount) > 0 ? ((Number(deductions) / Number(grossAmount)) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isScanning}
                aria-busy={isScanning}
                className="focus-ring w-full py-2.5 px-4 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#2D6A4F] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Analyze</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Detected Anomalies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scan Result Card */}
          {simResult && (
            <div
              className={`card-subtle p-6 border-l-4 animate-modal-enter ${
                simResult.isAnomaly ? 'border-l-[#DC2626] bg-[#DC2626]/5' : 'border-l-[#2D6A4F] bg-[#2D6A4F]/5'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {simResult.isAnomaly ? (
                    <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" aria-hidden="true" />
                  )}
                  <h3 className="text-base font-semibold text-[#22252A] tracking-tight">
                    {simResult.isAnomaly ? 'Unusual deduction detected' : 'Shift matches expected platform rates'}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${
                    simResult.riskLevel === 'critical'
                      ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                      : simResult.riskLevel === 'warning'
                      ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
                      : 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                  }`}
                >
                  {simResult.riskLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#E1E4EA] mb-3 text-xs">
                <div>
                  <span className="text-[#5B6370]">Hourly rate</span>
                  <div className="font-semibold text-sm text-[#22252A] mt-0.5 tabular-nums">PKR {simResult.targetHourlyRate}/hr</div>
                </div>
                <div>
                  <span className="text-[#5B6370]">Deduction rate</span>
                  <div className="font-semibold text-sm text-[#22252A] mt-0.5 tabular-nums">{(simResult.targetDeductionRatio * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-[#5B6370]">Platform baseline</span>
                  <div className="font-semibold text-sm text-[#22252A] mt-0.5 tabular-nums">{(simResult.baselineAverageDeductionRatio * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-[#5B6370]">Expected rate</span>
                  <div className="font-semibold text-sm text-[#22252A] mt-0.5 tabular-nums">PKR {simResult.baselineAverageHourlyRate}/hr</div>
                </div>
              </div>

              {simResult.anomaliesDetected?.length > 0 ? (
                <div className="space-y-2.5 mb-3">
                  {simResult.anomaliesDetected.map((a: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-white rounded-lg border border-[#DC2626]/20 text-xs">
                      <div className="font-semibold text-[#DC2626] text-sm">{a.name}</div>
                      <div className="text-[#5B6370] mt-1 leading-relaxed text-xs">{a.description}</div>
                      {a.suggestedAction && (
                        <div className="text-[#2D6A4F] font-medium mt-2 flex items-center gap-1.5 pt-2 border-t border-[#E1E4EA]">
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Action: {a.suggestedAction}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#5B6370] mb-3">
                  Shift earnings and deduction percentages are within expected platform rates.
                </p>
              )}

              {/* Analysis details disclosure */}
              <details className="text-xs text-[#5B6370] pt-2 border-t border-[#E1E4EA] group">
                <summary className="cursor-pointer font-medium text-[#22252A] hover:text-[#1B4332] flex items-center gap-1">
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                  <span>Analysis details</span>
                </summary>
                <div className="mt-2.5 p-3 bg-white rounded-lg border border-[#E1E4EA] space-y-1 font-mono text-[11px] text-[#5B6370]">
                  <div>Target deduction ratio: {(simResult.targetDeductionRatio * 100).toFixed(2)}%</div>
                  <div>Baseline deduction ratio: {(simResult.baselineAverageDeductionRatio * 100).toFixed(2)}%</div>
                  <div>Threshold trigger: 2.0 standard deviations from cohort median</div>
                </div>
              </details>
            </div>
          )}

          {/* Detected anomalies list */}
          <div className="card-subtle p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Detected anomalies</h3>
              <p className="text-xs text-[#5B6370]">Past shifts with unusual deductions</p>
            </div>

            <div className="space-y-3.5">
              {/* Flagged Item 1 */}
              <div className="p-4 rounded-xl border border-[#D97706]/30 bg-[#D97706]/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold text-[#22252A]">Careem</div>
                      <div className="text-xs text-[#5B6370] mt-0.5">October 8, 2026 &bull; Gross PKR 6,500 &bull; Deductions PKR 1,625</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                    Warning
                  </span>
                </div>
                <div className="text-sm text-[#5B6370] mt-2.5">
                  25% deduction &bull; Above the usual platform rate (18%).
                </div>
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#D97706]/20 text-xs">
                  <span className="text-[#5B6370]">Action: Grievance under review</span>
                  <span className="font-medium text-[#1B4332]">Grievance linked</span>
                </div>
              </div>

              {/* Normal Item 2 */}
              <div className="p-4 rounded-xl border border-[#E1E4EA] bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold text-[#22252A]">inDrive</div>
                      <div className="text-xs text-[#5B6370] mt-0.5">October 14, 2026 &bull; Rate: PKR 584/hr</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                    Normal
                  </span>
                </div>
                <div className="text-sm text-[#5B6370] mt-2.5">
                  20% standard commission &bull; Conforms to city median rate.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
