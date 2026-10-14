'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Sliders,
  Loader2,
  Calculator,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';

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
      title="Anomaly Detection & Risk Analysis"
      subtitle="Statistical Z-score & MAD evaluation for platform deductions, surge anomalies, and wage floors."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Anomaly Simulator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-subtle p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1B4332]" aria-hidden="true" />
                <h2 className="text-base font-semibold text-[#22252A] tracking-tight">Interactive Simulator</h2>
              </div>
              <span className="text-[10px] bg-[#F3F3F0] text-[#1B4332] font-mono font-medium px-2 py-0.5 rounded-md border border-[#E1E4EA]">
                Live Math
              </span>
            </div>
            <p className="text-xs text-[#5B6370] mb-4 leading-relaxed">
              Test statistical threshold triggers: Z-score fee outliers, sudden income drops (&gt;20%), and sub-minimum wage deficits.
            </p>

            {/* Quick Presets for Demo */}
            <div className="mb-4 p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-lg">
              <span className="text-[10px] font-semibold text-[#5B6370] uppercase tracking-wider block mb-2">
                Auditor Benchmark Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(6500, 1950, 'careem')}
                  className="focus-ring text-[10px] font-medium px-2.5 py-1 bg-white border border-[#DC2626]/30 text-[#DC2626] rounded-md hover:bg-[#DC2626]/5 cursor-pointer transition-colors"
                >
                  30% Spike (Critical)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(6500, 1625, 'careem')}
                  className="focus-ring text-[10px] font-medium px-2.5 py-1 bg-white border border-[#D97706]/30 text-[#D97706] rounded-md hover:bg-[#D97706]/5 cursor-pointer transition-colors"
                >
                  25% Cut (Warning)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(5000, 1000, 'indrive')}
                  className="focus-ring text-[10px] font-medium px-2.5 py-1 bg-white border border-[#E1E4EA] text-[#1B4332] rounded-md hover:bg-[#F3F3F0] cursor-pointer transition-colors"
                >
                  20% Baseline
                </button>
              </div>
            </div>

            <form onSubmit={handleSimulate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                >
                  <option value="careem">Careem Pakistan (Test 25% Surge Clawback)</option>
                  <option value="indrive">inDrive Pakistan (Test Normal 20%)</option>
                  <option value="bykea">Bykea (Test 18% Delivery)</option>
                  <option value="foodpanda">Foodpanda (Test Rain Surge)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Hours Worked</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Gross (PKR)</label>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5B6370] uppercase tracking-wider mb-1">Deductions (PKR)</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="focus-ring w-full text-xs p-2 border border-[#E1E4EA] rounded-md bg-white text-[#22252A]"
                />
                <div className="text-[10px] text-[#5B6370] mt-1.5 flex items-center justify-between">
                  <span>Calculated Fee Ratio:</span>
                  <span className="font-semibold text-[#22252A] tabular-nums">
                    {Number(grossAmount) > 0 ? ((Number(deductions) / Number(grossAmount)) * 100).toFixed(1) : 0}% deduction
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isScanning}
                aria-busy={isScanning}
                className="focus-ring w-full py-2 px-3 bg-[#1B4332] text-white text-xs font-medium rounded-md hover:bg-[#2D6A4F] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Statistical Rules...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Run Statistical Scan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Mathematical Engine Specs Box */}
          <div className="card-subtle p-5 bg-[#FAF9F5] border-[#E1E4EA]">
            <div className="text-xs font-semibold text-[#1B4332] mb-2 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Statistical Engine Safeguards</span>
            </div>
            <ul className="text-[11px] text-[#5B6370] space-y-1.5 list-disc list-inside">
              <li><strong>Zero-Variance Guard:</strong> Enforces &sigma;<sub>floor</sub> = 0.02 to eliminate division-by-zero on uniform cohorts.</li>
              <li><strong>Robust Estimators:</strong> Uses Median Absolute Deviation (MAD) for small samples ($n &lt; 30$).</li>
              <li><strong>Statutory Wage Floor:</strong> Evaluates net rate deficits against PKR 175.0/hr municipal minimum wage.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Active Anomaly Alerts & Scan Results */}
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
                    {simResult.isAnomaly ? 'Anomaly Detected by Statistical Engine' : 'Shift Conforms to Historical Baseline'}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                    simResult.riskLevel === 'critical'
                      ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                      : simResult.riskLevel === 'warning'
                      ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
                      : 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20'
                  }`}
                >
                  Risk: {simResult.riskLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#E1E4EA] mb-3 text-xs">
                <div>
                  <span className="text-[#5B6370] text-[10px] uppercase tracking-wider font-medium">Effective Rate</span>
                  <div className="font-semibold text-[#22252A] mt-0.5 tabular-nums">PKR {simResult.targetHourlyRate}/hr</div>
                </div>
                <div>
                  <span className="text-[#5B6370] text-[10px] uppercase tracking-wider font-medium">Deduction Ratio</span>
                  <div className="font-semibold text-[#22252A] mt-0.5 tabular-nums">{(simResult.targetDeductionRatio * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-[#5B6370] text-[10px] uppercase tracking-wider font-medium">Baseline Rate</span>
                  <div className="font-semibold text-[#22252A] mt-0.5 tabular-nums">PKR {simResult.baselineAverageHourlyRate}/hr</div>
                </div>
                <div>
                  <span className="text-[#5B6370] text-[10px] uppercase tracking-wider font-medium">Baseline Fee</span>
                  <div className="font-semibold text-[#22252A] mt-0.5 tabular-nums">{(simResult.baselineAverageDeductionRatio * 100).toFixed(1)}%</div>
                </div>
              </div>

              {simResult.anomaliesDetected?.length > 0 ? (
                <div className="space-y-2.5">
                  {simResult.anomaliesDetected.map((a: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-white rounded-lg border border-[#DC2626]/20 text-xs">
                      <div className="font-semibold text-[#DC2626]">{a.name}</div>
                      <div className="text-[#5B6370] mt-1 leading-relaxed">{a.description}</div>
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
                <p className="text-xs text-[#5B6370]">
                  Shift earnings and deduction percentages fall cleanly within normal 2.0 standard deviation statistical bounds.
                </p>
              )}
            </div>
          )}

          {/* Historical Flagged Shifts from Live Seed Data */}
          <div className="card-subtle p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#22252A] tracking-tight">Historical Platform Outlier Flags</h3>
                <p className="text-xs text-[#5B6370]">Past shifts evaluated against municipal baselines</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Flagged Item 1 */}
              <div className="p-4 rounded-lg border border-[#D97706]/30 bg-[#D97706]/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-semibold text-[#22252A]">Careem 25.0% Unexplained Deduction Outlier</div>
                      <div className="text-[11px] text-[#5B6370] mt-0.5">Shift Date: October 8, 2026 &bull; Gross PKR 6,500 &bull; Deducted PKR 1,625</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                    Warning
                  </span>
                </div>
                <div className="text-xs text-[#5B6370] mt-2 leading-relaxed">
                  Deduction ratio 25.0% is 4.2 standard deviations above historical platform average (18.0%).
                </div>
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#D97706]/20 text-xs">
                  <span className="text-[#5B6370]">Suggested Action: Grievance under review with advocate cluster</span>
                  <span className="font-medium text-[#1B4332]">Clustered in FG-CLUST-44</span>
                </div>
              </div>

              {/* Normal Item 2 */}
              <div className="p-4 rounded-lg border border-[#E1E4EA] bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-semibold text-[#22252A]">inDrive October 14 Regular Shift</div>
                      <div className="text-[11px] text-[#5B6370] mt-0.5">Shift Date: October 14, 2026 &bull; Net Rate: PKR 583.5/hr</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                    Normal
                  </span>
                </div>
                <div className="text-xs text-[#5B6370] mt-2">
                  20.0% standard commission; effective hourly rate conforms to Lahore rideshare median.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
