"""FairGig Phase 3 Analytics Automated Test Suite.
Validates Tests 1-10:
1. Worker weekly earnings trend.
2. Worker monthly earnings trend.
3. Hourly rate calculation accuracy.
4. Commission percentage calculation.
5. City median benchmark from live data.
6. Privacy suppression for small cohorts (< 5).
7. Advocate-only authorization (403 for workers).
8. Commission trend aggregation by platform.
9. Complaint category aggregation.
10. Vulnerability detection for >20% income drops.
"""

from datetime import datetime, timedelta, timezone
import os
import sys
from fastapi.testclient import TestClient
import jwt
import pytest

# Ensure root directory is on sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from services.analytics.config import settings
from services.analytics.main import app

client = TestClient(app)

# Helper: Generate signed JWT tokens
def make_token(user_id: str, role: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
        "iss": "fairgig-auth",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


WORKER_A_ID = "ce05274e-5727-4a82-a8aa-4f6362ea7df9"
WORKER_B_ID = "61b82bf9-4eba-4d61-9854-7a5d7f3ecfae"
ADVOCATE_ID = "cfa26217-3766-4286-b259-af57a9e5181a"

worker_token = make_token(WORKER_A_ID, "worker", "tariq.worker@fairgig.pk")
worker_b_token = make_token(WORKER_B_ID, "worker", "usman.worker@fairgig.pk")
advocate_token = make_token(ADVOCATE_ID, "advocate", "advocate.pk@fairgig.pk")


def test_01_worker_weekly_earnings():
    """1. Worker weekly earnings trends are aggregated accurately."""
    headers = {"Authorization": f"Bearer {worker_token}"}
    res = client.get("/api/v1/analytics/worker?timeframe=all_time", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()

    assert data["workerId"] == WORKER_A_ID
    assert "weeklyEarningsTrend" in data
    weekly = data["weeklyEarningsTrend"]
    assert len(weekly) > 0, "Weekly earnings trends must have at least one week"
    first_week = weekly[0]
    assert "weekStart" in first_week
    assert "weekEnd" in first_week
    assert first_week["grossAmount"] > 0
    assert first_week["netAmount"] > 0
    assert first_week["hoursWorked"] > 0
    assert first_week["effectiveHourlyRate"] > 0
    print("\n[TEST 1 PASS] Worker weekly earnings trend aggregated successfully.")


def test_02_worker_monthly_earnings():
    """2. Worker monthly earnings trends are grouped by YYYY-MM."""
    headers = {"Authorization": f"Bearer {worker_token}"}
    res = client.get("/api/v1/analytics/worker?timeframe=all_time", headers=headers)
    assert res.status_code == 200
    data = res.json()

    monthly = data.get("monthlyEarningsTrend", [])
    assert len(monthly) > 0, "Monthly earnings trends must have at least one month"
    first_month = monthly[0]
    assert "month" in first_month
    assert len(first_month["month"]) == 7  # YYYY-MM
    assert first_month["grossAmount"] > 0
    assert first_month["netAmount"] > 0
    print("[TEST 2 PASS] Worker monthly earnings trend grouped accurately.")


def test_03_hourly_rate_calculation():
    """3. Effective hourly rate calculation is mathematically sound (net / hours)."""
    headers = {"Authorization": f"Bearer {worker_token}"}
    res = client.get("/api/v1/analytics/worker?timeframe=all_time", headers=headers)
    assert res.status_code == 200
    data = res.json()

    total_net = data["totalNetEarnings"]
    total_hours = data["totalHoursWorked"]
    effective_rate = data["effectiveHourlyRate"]

    if total_hours > 0:
        expected_rate = round(total_net / total_hours, 2)
        assert abs(effective_rate - expected_rate) < 0.05, (
            f"Hourly rate {effective_rate} does not match expected {expected_rate}"
        )

    # Check platform breakdown rates
    for p in data["platformBreakdown"]:
        if p["hoursWorked"] > 0:
            expected_plat_rate = round(p["netAmount"] / p["hoursWorked"], 2)
            assert abs(p["hourlyRate"] - expected_plat_rate) < 0.05
    print("[TEST 3 PASS] Hourly rate calculations match net/hours across all metrics.")


def test_04_commission_calculation():
    """4. Platform commission deduction percentage is correctly computed."""
    headers = {"Authorization": f"Bearer {worker_token}"}
    res = client.get("/api/v1/analytics/worker?timeframe=all_time", headers=headers)
    assert res.status_code == 200
    data = res.json()

    for p in data["platformBreakdown"]:
        if p["grossAmount"] > 0:
            ded = p["grossAmount"] - p["netAmount"]
            expected_comm_pct = round((ded / p["grossAmount"]) * 100, 2)
            assert abs(p["commissionPercentage"] - expected_comm_pct) < 0.1
    print("[TEST 4 PASS] Platform commission percentages computed accurately.")


def test_05_city_median_from_live_data():
    """5. Real city-category median is retrieved for valid cohorts (k >= 5)."""
    headers = {"Authorization": f"Bearer {worker_token}"}
    res = client.get("/api/v1/analytics/worker?timeframe=all_time", headers=headers)
    assert res.status_code == 200
    data = res.json()

    bench = data.get("cityBenchmark")
    assert bench is not None
    assert bench["cityName"].lower() == "lahore"
    assert bench["isSuppressedForPrivacy"] is False
    assert bench["cityMedianHourlyRate"] is not None
    assert bench["cityMedianHourlyRate"] > 0
    assert bench["workerCohortSize"] >= 5
    print(f"[TEST 5 PASS] Live Lahore benchmark retrieved: {bench['cityMedianHourlyRate']} PKR/hr (cohort={bench['workerCohortSize']}).")


def test_06_privacy_suppression():
    """6. Privacy suppression is triggered when cohort size is below threshold (< 5)."""
    headers = {"Authorization": f"Bearer {advocate_token}"}
    res = client.get("/api/v1/analytics/advocate/zones", headers=headers)
    assert res.status_code == 200
    zones = res.json()

    suppressed_zones = [z for z in zones if z["isSuppressedForPrivacy"] is True]
    assert len(suppressed_zones) > 0, "Expected at least one suppressed small cohort"
    first_suppressed = suppressed_zones[0]
    assert first_suppressed["workerCount"] < 5
    assert first_suppressed["averageHourlyRate"] is None, "Suppressed cohort must hide average rate"
    assert first_suppressed["medianHourlyRate"] is None, "Suppressed cohort must hide median rate"
    print(f"[TEST 6 PASS] Privacy suppression enforced for {first_suppressed['cityName']} (cohort={first_suppressed['workerCount']}).")


def test_07_advocate_only_authorization():
    """7. Advocate-only endpoints reject worker access with HTTP 403 Forbidden."""
    worker_headers = {"Authorization": f"Bearer {worker_token}"}
    advocate_headers = {"Authorization": f"Bearer {advocate_token}"}

    # Worker attempts advocate overview -> 403 Forbidden
    res_worker = client.get("/api/v1/analytics/advocate/overview", headers=worker_headers)
    assert res_worker.status_code == 403, f"Expected 403, got {res_worker.status_code}"

    # Worker attempts advocate commissions -> 403 Forbidden
    res_comm = client.get("/api/v1/analytics/advocate/commissions", headers=worker_headers)
    assert res_comm.status_code == 403

    # Advocate accesses overview -> 200 OK
    res_advocate = client.get("/api/v1/analytics/advocate/overview", headers=advocate_headers)
    assert res_advocate.status_code == 200
    print("[TEST 7 PASS] Role-based security strictly prevents worker access to advocate intelligence.")


def test_08_commission_trend_aggregation():
    """8. Platform commission trends provide mean/median deduction % and sample sizes."""
    headers = {"Authorization": f"Bearer {advocate_token}"}
    res = client.get("/api/v1/analytics/advocate/commissions", headers=headers)
    assert res.status_code == 200
    commissions = res.json()

    assert len(commissions) > 0
    for p in commissions:
        assert "platform" in p
        assert "shiftCount" in p
        assert "workerCount" in p
        assert p["averageDeductionPercentage"] >= 0
        assert p["medianDeductionPercentage"] >= 0
        assert p["trendDirection"] in ["increasing", "stable", "decreasing"]
    print(f"[TEST 8 PASS] Commission trends aggregated for {len(commissions)} platforms.")


def test_09_complaint_category_aggregation():
    """9. Complaint intelligence aggregates categories, platforms, and clusters."""
    headers = {"Authorization": f"Bearer {advocate_token}"}
    res = client.get("/api/v1/analytics/advocate/complaints", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "totalComplaints" in data
    assert "topCategories" in data
    assert "platformDistribution" in data
    assert "collectiveClustersCount" in data
    assert "estimatedTotalLossClaimed" in data
    print(f"[TEST 9 PASS] Complaint intelligence: {data['totalComplaints']} complaints, {data['collectiveClustersCount']} clusters.")


def test_10_vulnerability_detection():
    """10. Vulnerability detection identifies workers experiencing >20% income drops."""
    headers = {"Authorization": f"Bearer {advocate_token}"}
    res = client.get("/api/v1/analytics/advocate/vulnerabilities?thresholdPercentage=20.0", headers=headers)
    assert res.status_code == 200
    vulns = res.json()

    assert isinstance(vulns, list)
    if vulns:
        v = vulns[0]
        assert "workerId" in v
        assert "percentageDrop" in v
        assert "isVulnerable" in v
        assert "disclaimer" in v
        assert "legal evidence" in v["disclaimer"]  # Verify required disclaimer
    print(f"[TEST 10 PASS] Vulnerability detection evaluated {len(vulns)} workers with outreach disclaimer.")
