"""FairGig Phase 2 Anomaly Detection Automated Test Suite.
Validates tests 1-8:
1. Normal deductions are not flagged.
2. Unusual deductions are detected.
3. Greater-than-20% income drop is detected.
4. Insufficient history is handled.
5. Zero variance is handled without division-by-zero.
6. Invalid input is rejected with HTTP 422.
7. Standalone judge payload works directly without prior login/DB.
8. Detection logic endpoint documents thresholds and formulas.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add root repository path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from services.anomaly.main import app

client = TestClient(app)


def test_01_normal_deductions_not_flagged():
    """1. Normal deductions conforming to baseline are not flagged."""
    payload = {
        "targetShift": {
            "shiftDate": "2026-10-14",
            "hoursWorked": 8.0,
            "grossAmount": 5000.00,
            "netAmount": 4100.00,
            "deductions": 900.00,  # 18.0%
            "tipsAmount": 200.00,
            "tripsCount": 12,
        },
        "historicalShifts": [
            {"shiftDate": "2026-10-01", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4100.0, "deductions": 900.0},
            {"shiftDate": "2026-10-03", "hoursWorked": 7.5, "grossAmount": 4800.0, "netAmount": 3936.0, "deductions": 864.0},
            {"shiftDate": "2026-10-05", "hoursWorked": 8.5, "grossAmount": 5200.0, "netAmount": 4264.0, "deductions": 936.0},
        ],
        "platform": "bykea",
        "cityMinimumHourlyWage": 175.0,
    }
    res = client.post("/api/v1/anomalies/detect", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["isAnomaly"] is False, "Normal 18% deduction should not be flagged"
    assert data["riskLevel"] == "low"
    assert len(data["anomaliesDetected"]) == 0
    print("\n[TEST 1 PASS] Normal deductions correctly evaluated with zero false positives.")


def test_02_unusual_deductions_detected():
    """2. Unusual deductions exceeding Z-score threshold are flagged with explanation."""
    payload = {
        "targetShift": {
            "shiftDate": "2026-10-14",
            "hoursWorked": 8.0,
            "grossAmount": 6000.00,
            "netAmount": 3720.00,
            "deductions": 2280.00,  # 38.0% deduction
            "tipsAmount": 300.00,
            "tripsCount": 14,
        },
        "historicalShifts": [
            {"shiftDate": "2026-10-01", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4100.0, "deductions": 900.0},   # 18%
            {"shiftDate": "2026-10-03", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4050.0, "deductions": 950.0},   # 19%
            {"shiftDate": "2026-10-05", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4150.0, "deductions": 850.0},   # 17%
            {"shiftDate": "2026-10-07", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4100.0, "deductions": 900.0},   # 18%
        ],
        "platform": "careem",
        "cityMinimumHourlyWage": 175.0,
    }
    res = client.post("/api/v1/anomalies/detect", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["isAnomaly"] is True, "38% deduction must be flagged when baseline is ~18%"
    ded_anomaly = next((a for a in data["anomaliesDetected"] if a["type"] == "deduction_outlier"), None)
    assert ded_anomaly is not None, "Must contain deduction_outlier anomaly"
    assert ded_anomaly["observedValue"] == 0.38
    assert "explanation" in ded_anomaly and len(ded_anomaly["explanation"]) > 10
    print(f"[TEST 2 PASS] Unusual deduction detected: {ded_anomaly['description']}")


def test_03_greater_than_20_percent_income_drop_detected():
    """3. Greater-than-20% income drop is detected and hours-normalized."""
    payload = {
        "targetShift": {
            "shiftDate": "2026-10-14",
            "hoursWorked": 8.0,
            "grossAmount": 3500.00,
            "netAmount": 2800.00,  # Effective rate: 350 PKR/hr
            "deductions": 700.00,
            "tipsAmount": 100.00,
            "tripsCount": 8,
        },
        "historicalShifts": [
            # Baseline effective rate: ~600 PKR/hr (4800 net / 8 hrs) -> 350 is a 41.6% drop (> 20%)
            {"shiftDate": "2026-10-01", "hoursWorked": 8.0, "grossAmount": 6000.0, "netAmount": 4800.0, "deductions": 1200.0},
            {"shiftDate": "2026-10-03", "hoursWorked": 8.0, "grossAmount": 6000.0, "netAmount": 4800.0, "deductions": 1200.0},
            {"shiftDate": "2026-10-05", "hoursWorked": 8.0, "grossAmount": 6000.0, "netAmount": 4800.0, "deductions": 1200.0},
        ],
        "platform": "indrive",
        "cityMinimumHourlyWage": 175.0,
    }
    res = client.post("/api/v1/anomalies/detect", json=payload)
    assert res.status_code == 200
    data = res.json()
    drop_anomaly = next((a for a in data["anomaliesDetected"] if a["type"] == "sudden_income_drop"), None)
    assert drop_anomaly is not None, "Income drop > 20% must be flagged"
    assert drop_anomaly["observedValue"] == 350.00
    assert drop_anomaly["expectedThreshold"] == 480.00  # 600 * (1 - 0.20)
    print(f"[TEST 3 PASS] Sudden income drop flagged: {drop_anomaly['description']}")


def test_04_insufficient_history_handled():
    """4. Small sample size (< 3 shifts) falls back gracefully to platform cap."""
    payload = {
        "targetShift": {
            "shiftDate": "2026-10-14",
            "hoursWorked": 6.0,
            "grossAmount": 4000.00,
            "netAmount": 2600.00,
            "deductions": 1400.00,  # 35.0% (> 30% cap)
        },
        "historicalShifts": [
            # Only 1 historical shift (< 3 minimum required for Z-score)
            {"shiftDate": "2026-10-10", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4000.0, "deductions": 1000.0},
        ],
        "platform": "bykea",
        "cityMinimumHourlyWage": 175.0,
    }
    res = client.post("/api/v1/anomalies/detect", json=payload)
    assert res.status_code == 200
    data = res.json()
    anomaly = next((a for a in data["anomaliesDetected"] if a["type"] == "deduction_outlier"), None)
    assert anomaly is not None, "Deduction > 30% cap must be flagged even with small sample"
    assert "small sample" in anomaly["description"].lower() or "platform cap" in anomaly["description"].lower()
    print("[TEST 4 PASS] Insufficient baseline history handled with platform cap fallback.")


def test_05_zero_variance_handled():
    """5. Zero variance in baseline (all shifts have identical deduction ratio) avoids division by zero."""
    payload = {
        "targetShift": {
            "shiftDate": "2026-10-14",
            "hoursWorked": 8.0,
            "grossAmount": 5000.00,
            "netAmount": 3100.00,
            "deductions": 1900.00,  # 38%
        },
        "historicalShifts": [
            # All historical shifts have EXACTLY 18% deduction (variance = 0.0)
            {"shiftDate": "2026-10-01", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4100.0, "deductions": 900.0},
            {"shiftDate": "2026-10-02", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4100.0, "deductions": 900.0},
            {"shiftDate": "2026-10-03", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4100.0, "deductions": 900.0},
            {"shiftDate": "2026-10-04", "hoursWorked": 8.0, "grossAmount": 5000.0, "netAmount": 4100.0, "deductions": 900.0},
        ],
        "platform": "bykea",
        "cityMinimumHourlyWage": 175.0,
    }
    res = client.post("/api/v1/anomalies/detect", json=payload)
    assert res.status_code == 200, "Must not crash with ZeroDivisionError"
    data = res.json()
    assert data["isAnomaly"] is True
    print("[TEST 5 PASS] Zero-variance baseline handled gracefully with standard deviation floor.")


def test_06_invalid_input_rejected():
    """6. Invalid financial or duration inputs are rejected with HTTP 422."""
    payload = {
        "targetShift": {
            "shiftDate": "2026-10-14",
            "hoursWorked": 0.0,  # Invalid: hoursWorked must be > 0
            "grossAmount": -100.00,  # Invalid: cannot be negative
            "netAmount": 50.00,
        },
        "historicalShifts": [],
    }
    res = client.post("/api/v1/anomalies/detect", json=payload)
    assert res.status_code == 422, "Must reject invalid inputs with 422"
    err = res.json()
    assert err["success"] is False
    assert err["error"]["code"] == "VALIDATION_FAILED"
    print("[TEST 6 PASS] Input validation enforced adhering to RFC 7807 error format.")


def test_07_standalone_judge_payload_works():
    """7. Standalone judge payload works directly on public endpoint without credentials."""
    judge_payload = {
        "targetShift": {
            "shiftDate": "2026-10-14",
            "hoursWorked": 8.0,
            "grossAmount": 160.00,
            "netAmount": 88.00,
            "deductions": 72.00,
            "tipsAmount": 10.00,
            "tripsCount": 9,
        },
        "historicalShifts": [
            {"shiftDate": "2026-10-06", "hoursWorked": 8.0, "grossAmount": 200.0, "netAmount": 170.0, "deductions": 30.0},
            {"shiftDate": "2026-10-07", "hoursWorked": 7.5, "grossAmount": 190.0, "netAmount": 161.5, "deductions": 28.5},
            {"shiftDate": "2026-10-08", "hoursWorked": 8.5, "grossAmount": 220.0, "netAmount": 187.0, "deductions": 33.0},
        ],
        "platform": "uber",
        "cityMinimumHourlyWage": 19.97,
    }
    res = client.post("/api/v1/anomalies/detect", json=judge_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["targetHourlyRate"] == 11.00
    assert data["targetDeductionRatio"] == 0.45
    assert data["riskLevel"] in ["high", "critical"]
    print("[TEST 7 PASS] Standalone judge evaluation succeeded without account registration.")


def test_08_detection_logic_endpoint_documents_thresholds():
    """8. Detection logic endpoint documents thresholds, mathematical methods, and edge cases."""
    res = client.get("/api/v1/anomalies/logic")
    assert res.status_code == 200
    data = res.json()
    assert "methods" in data
    assert "deduction_outlier" in data["methods"]
    assert "sudden_income_drop" in data["methods"]
    assert data["methods"]["deduction_outlier"]["defaultThreshold"] == 2.0
    assert data["methods"]["sudden_income_drop"]["defaultThreshold"] == 20.0
    print("[TEST 8 PASS] Detection logic endpoint successfully documents thresholds and formulas.")
