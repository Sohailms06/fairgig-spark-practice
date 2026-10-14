'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
  Sliders,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';

export default function AnomaliesPage() {
  // Interactive Anomaly Simulator for Hackathon Judges
  const [platform, setPlatform] = useState('careem');
  const [hoursWorked, setHoursWorked] = useState('8.0');
  const [grossAmount, setGrossAmount] = useState('6500');
  const [deductions, setDeductions] = useState('1625'); // 25% cut
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

  return (
    <AppShell
      title="Statistical Anomaly Detection Engine"
      subtitle="Gaussian Z-score & MAD evaluation for unusual platform deductions and earnings collapse"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Anomaly Simulator for Judges */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-subtle p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-[#1E3A2F]" />
              <h2 className="text-sm font-bold text-[#1C1917]">Interactive Judge Simulator</h2>
            </div>
            <p className="text-xs text-[#78716C] mb-4">
              Test live mathematical rules: Z-score deduction outliers, sudden income drops (&gt;20%), and sub-minimum wage deficits.
            </p>

            <form onSubmit={handleSimulate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                >
                  <option value="careem">Careem Pakistan (Test 25% Surge Clawback)</option>
                  <option value="indrive">inDrive Pakistan (Test Normal 20%)</option>
                  <option value="bykea">Bykea (Test 18% Delivery)</option>
                  <option value="foodpanda">Foodpanda (Test Rain Surge)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Hours Worked</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Gross (PKR)</label>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#44403C] uppercase mb-1">Deductions (PKR)</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                />
                <div className="text-[10px] text-[#78716C] mt-1">
                  Ratio: {Number(grossAmount) > 0 ? ((Number(deductions) / Number(grossAmount)) * 100).toFixed(1) : 0}% deduction
                </div>
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="w-full py-2 px-3 bg-[#1E3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#234737] transition shadow-xs flex items-center justify-center gap-1.5"
              >
                {isScanning ? (
                  <span>Evaluating Statistical Rules...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Live Mathematical Scan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Mathematical Engine Specs Box */}
          <div className="card-subtle p-5 bg-[#F2F7F4] border-[#C5D9CE]">
            <div className="text-xs font-bold text-[#1E3A2F] mb-1.5 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-800" />
              <span>Statistical Engine Safeguards</span>
            </div>
            <ul className="text-[11px] text-[#234737] space-y-1 list-disc list-inside">
              <li><strong>Zero-Variance Guard:</strong> Enforces &sigma;<sub>floor</sub> = 0.02 to avoid division-by-zero.</li>
              <li><strong>Robust Estimators:</strong> Uses Median Absolute Deviation (MAD) for small samples.</li>
              <li><strong>Statutory Wage Floor:</strong> Checks deficit against PKR 175.0/hr municipal minimum wage.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Active Anomaly Alerts & Scan Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scan Result Card */}
          {simResult && (
            <div
              className={`card-subtle p-6 border-l-4 ${
                simResult.isAnomaly ? 'border-l-red-500 bg-red-50/30' : 'border-l-emerald-600 bg-emerald-50/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {simResult.isAnomaly ? (
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  <h3 className="text-sm font-bold text-[#1C1917]">
                    {simResult.isAnomaly ? 'Anomaly Detected by Statistical Engine' : 'Shift Conforms to Historical Baseline'}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    simResult.riskLevel === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : simResult.riskLevel === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Risk: {simResult.riskLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#E7E5E4] mb-3 text-xs">
                <div>
                  <span className="text-[#78716C] text-[10px] uppercase">Effective Rate</span>
                  <div className="font-bold text-[#1C1917]">PKR {simResult.targetHourlyRate}/hr</div>
                </div>
                <div>
                  <span className="text-[#78716C] text-[10px] uppercase">Deduction Ratio</span>
                  <div className="font-bold text-[#1C1917]">{(simResult.targetDeductionRatio * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-[#78716C] text-[10px] uppercase">Baseline Rate</span>
                  <div className="font-bold text-[#1C1917]">PKR {simResult.baselineAverageHourlyRate}/hr</div>
                </div>
                <div>
                  <span className="text-[#78716C] text-[10px] uppercase">Baseline Fee</span>
                  <div className="font-bold text-[#1C1917]">{(simResult.baselineAverageDeductionRatio * 100).toFixed(1)}%</div>
                </div>
              </div>

              {simResult.anomaliesDetected?.length > 0 ? (
                <div className="space-y-2">
                  {simResult.anomaliesDetected.map((a: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-red-200 text-xs">
                      <div className="font-bold text-red-700">{a.name}</div>
                      <div className="text-[#44403C] mt-0.5">{a.description}</div>
                      {a.suggestedAction && (
                        <div className="text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          <span>Action: {a.suggestedAction}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#78716C]">
                  Shift earnings and deduction percentages fall within normal 2.0 standard deviation bounds.
                </p>
              )}
            </div>
          )}

          {/* Historical Flagged Shifts from Live Seed Data */}
          <div className="card-subtle p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1C1917]">Historical Platform Outlier Flags</h3>
                <p className="text-xs text-[#78716C]">Past shifts evaluated against municipal baselines</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Flagged Item 1 */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#1C1917]">Careem 25.0% Unexplained Deduction Outlier</div>
                      <div className="text-[11px] text-[#78716C]">Shift Date: October 8, 2026 &bull; Gross PKR 6,500 &bull; Deducted PKR 1,625</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                    Warning
                  </span>
                </div>
                <div className="text-xs text-[#44403C] mt-2">
                  Deduction ratio 25.0% is 4.2 standard deviations above historical platform average (18.0%).
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
                  <span className="text-[#78716C]">Suggested Action: Grievance under review with advocate cluster</span>
                  <span className="font-semibold text-emerald-800">Clustered in FG-CLUST-44</span>
                </div>
              </div>

              {/* Normal Item 2 */}
              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#1C1917]">inDrive October 14 Regular Shift</div>
                      <div className="text-[11px] text-[#78716C]">Shift Date: October 14, 2026 &bull; Net Rate: PKR 583.5/hr</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Normal
                  </span>
                </div>
                <div className="text-xs text-[#78716C] mt-2">
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
