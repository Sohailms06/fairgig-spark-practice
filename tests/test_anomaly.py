"""FairGig Anomaly Detection Deterministic Verification Test
Validates the mathematical rules for deduction outliers and sudden income drop.
"""

import sys
import os
import math

# Add services/anomaly to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "anomaly")))

from main import (
    ShiftInput,
    StandaloneAnalyzeRequest,
    AnomalyThresholds,
    analyze_shift_standalone,
)


def test_standalone_anomaly_detection():
    # Target shift with 45% deductions ($72/$160) and $11/hr net ($88/8hr)
    target = ShiftInput(
        shiftDate="2026-10-13",
        hoursWorked=8.0,
        grossAmount=160.00,
        netAmount=88.00,
        deductions=72.00,
        tipsAmount=10.00,
        tripsCount=9,
    )

    # Historical shifts averaging ~15% deductions and ~$21.67/hr net
    history = [
        ShiftInput(
            shiftDate="2026-10-06",
            hoursWorked=8.0,
            grossAmount=200.00,
            netAmount=170.00,
            deductions=30.00,
            tipsAmount=20.00,
            tripsCount=12,
        ),
        ShiftInput(
            shiftDate="2026-10-07",
            hoursWorked=7.5,
            grossAmount=190.00,
            netAmount=161.50,
            deductions=28.50,
            tipsAmount=18.00,
            tripsCount=11,
        ),
        ShiftInput(
            shiftDate="2026-10-08",
            hoursWorked=8.5,
            grossAmount=220.00,
            netAmount=187.00,
            deductions=33.00,
            tipsAmount=25.00,
            tripsCount=13,
        ),
    ]

    req = StandaloneAnalyzeRequest(
        targetShift=target,
        historicalShifts=history,
        platform="uber",
        cityMinimumHourlyWage=19.97,
        thresholds=AnomalyThresholds(
            maxDeductionRatio=0.30,
            deductionZScoreThreshold=2.0,
            incomeDropPercentageThreshold=40.0,
            minimumBaselineShifts=3,
        ),
    )

    res = analyze_shift_standalone(req)

    print("=== ANOMALY DETECTION TEST RESULT ===")
    print(f"isAnomaly: {res.isAnomaly}")
    print(f"anomalyScore: {res.anomalyScore}")
    print(f"riskLevel: {res.riskLevel}")
    print(f"targetHourlyRate: ${res.targetHourlyRate}/hr")
    print(f"targetDeductionRatio: {res.targetDeductionRatio * 100:.1f}%")
    print(f"baselineAvgRate: ${res.baselineAverageHourlyRate}/hr")
    print(f"baselineAvgDeduction: {res.baselineAverageDeductionRatio * 100:.1f}%")
    print(f"Detected anomalies count: {len(res.anomaliesDetected)}")
    for a in res.anomaliesDetected:
        print(f"  - [{a.severity.upper()}] {a.name}: {a.description}")

    assert res.isAnomaly is True, "Must detect anomaly"
    assert res.targetHourlyRate == 11.00, "Hourly rate calculation must match"
    assert res.targetDeductionRatio == 0.45, "Deduction ratio must match 45%"
    assert any(a.type == "deduction_outlier" for a in res.anomaliesDetected), "Must flag deduction outlier"
    assert any(a.type == "sudden_income_drop" for a in res.anomaliesDetected), "Must flag sudden income drop"
    assert any(a.type == "hourly_rate_deficit" for a in res.anomaliesDetected), "Must flag statutory wage deficit"
    print("\nALL ANOMALY TEST ASSERTIONS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_standalone_anomaly_detection()
