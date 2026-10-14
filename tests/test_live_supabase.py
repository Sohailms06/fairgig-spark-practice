"""FairGig Live Supabase Database Verification Test Suite.
Executes non-mocked real integration tests against the live Supabase cloud database:
1. Live Worker Registration & Profile Persistence
2. Live Worker Login & Token Generation
3. Live Earnings Shift Creation & DB Persistence
4. Live Shift Retrieval & Ownership Protection (RLS)
5. Live PostgreSQL City Median Calculation (Cohort >= 5)
6. Live K-Anonymity Privacy Suppression (Cohort < 5)
7. Live Evidence Private Storage Bucket Validation
"""

import json
import os
import sys
import uuid
import urllib.error
import urllib.request
import pytest
from dotenv import load_dotenv

# Load live credentials
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(ROOT_DIR, ".env.local"))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

assert SUPABASE_URL, "SUPABASE_URL must be defined"
assert SERVICE_KEY, "SUPABASE_SERVICE_ROLE_KEY must be defined"


def supabase_rest(
    method: str,
    path: str,
    payload: dict | list | None = None,
    token: str | None = None,
    prefer: str | None = None,
):
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": ANON_KEY if token else SERVICE_KEY,
        "Authorization": f"Bearer {token if token else SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer

    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        raw = resp.read()
        if raw:
            try:
                return json.loads(raw.decode("utf-8"))
            except Exception:
                return raw.decode("utf-8")
        return None


# Test state across live tests
live_state = {
    "worker_id": "",
    "worker_email": f"live.worker.{uuid.uuid4().hex[:6]}@fairgig.pk",
    "worker_password": "LiveWorkerPass123!",
    "worker_access_token": "",
    "earning_id": "",
}


def test_live_01_database_connectivity_and_schema():
    """1. Test live database connectivity and verified 15 public tables."""
    meta = supabase_rest("GET", "/rest/v1/")
    assert isinstance(meta, dict), "OpenAPI metadata must be parsed as a dictionary"
    defs = meta.get("definitions", {})
    required_tables = [
        "cities", "zones", "platforms", "worker_categories", "profiles",
        "earnings_shifts", "screenshot_evidence", "verification_reviews",
        "grievances", "grievance_clusters", "audit_logs"
    ]
    for table in required_tables:
        assert table in defs, f"Table '{table}' must exist in live Supabase schema"
    print(f"\n[LIVE 1 PASS] Live PostgreSQL connected. Verified {len(defs)} tables in live schema.")


def test_live_02_worker_registration_and_persistence():
    """2. Real worker registration in auth.users and persistence in profiles."""
    email = live_state["worker_email"]
    password = live_state["worker_password"]

    # 1. Create in auth.users via Admin API
    auth_user = supabase_rest("POST", "/auth/v1/admin/users", {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"full_name": "Live Test Worker"}
    })
    uid = auth_user["id"]
    live_state["worker_id"] = uid

    # 2. Persist in public.profiles with merge-duplicates
    supabase_rest(
        "POST",
        "/rest/v1/profiles",
        {
            "id": uid,
            "email": email,
            "full_name": "Live Test Worker",
            "role": "worker",
            "city_id": "11111111-1111-1111-1111-111111111111",  # Lahore
            "primary_platform_id": "10000000-0000-0000-0000-000000000003",  # inDrive
            "worker_category_id": "20000000-0000-0000-0000-000000000001",  # rideshare
            "is_active": True,
        },
        prefer="resolution=merge-duplicates",
    )

    # 3. Verify real persistence in database
    saved_profile = supabase_rest("GET", f"/rest/v1/profiles?id=eq.{uid}&select=*")
    assert len(saved_profile) == 1, "Profile record must persist in database"
    assert saved_profile[0]["email"] == email
    assert saved_profile[0]["role"] == "worker"
    print(f"[LIVE 2 PASS] Real worker registered (ID: {uid}) and verified in public.profiles.")


def test_live_03_worker_authentication_login():
    """3. Real worker login via Supabase Auth endpoint to receive access JWT."""
    login_resp = supabase_rest("POST", "/auth/v1/token?grant_type=password", {
        "email": live_state["worker_email"],
        "password": live_state["worker_password"]
    }, token=None)

    assert "access_token" in login_resp, "Login must return access_token"
    live_state["worker_access_token"] = login_resp["access_token"]
    assert login_resp["user"]["email"] == live_state["worker_email"]
    print(f"[LIVE 3 PASS] Real authentication login succeeded. Access JWT received.")


def test_live_04_earnings_creation_and_persistence():
    """4. Real earnings shift creation and database persistence."""
    worker_id = live_state["worker_id"]
    earning_id = str(uuid.uuid4())
    live_state["earning_id"] = earning_id

    # Insert shift record in live database
    shift_payload = {
        "id": earning_id,
        "worker_id": worker_id,
        "platform_id": "10000000-0000-0000-0000-000000000003",  # inDrive
        "zone_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",  # Lahore Gulberg
        "shift_date": "2026-10-14",
        "hours_worked": 8.0,
        "gross_amount": 6000.00,
        "net_amount": 4800.00,
        "deductions": 1200.00,
        "tips_amount": 300.00,
        "trips_count": 12,
        "verification_status": "pending",
        "notes": "Live test shift record",
    }
    supabase_rest("POST", "/rest/v1/earnings_shifts", shift_payload, prefer="resolution=merge-duplicates")

    # Query directly from database to verify persistence
    records = supabase_rest("GET", f"/rest/v1/earnings_shifts?id=eq.{earning_id}&select=*")
    assert len(records) == 1, "Shift must persist in live database"
    assert float(records[0]["gross_amount"]) == 6000.00
    assert float(records[0]["net_amount"]) == 4800.00
    print(f"[LIVE 4 PASS] Real shift {earning_id} persisted in live earnings_shifts table.")


def test_live_05_worker_ownership_protection():
    """5. Verify worker can retrieve own shift and RLS blocks unauthorized queries."""
    worker_id = live_state["worker_id"]
    earning_id = live_state["earning_id"]

    # Authenticated fetch with Worker A's token
    token_a = live_state["worker_access_token"]
    own_records = supabase_rest("GET", f"/rest/v1/earnings_shifts?id=eq.{earning_id}&select=*", token=token_a)
    assert len(own_records) == 1, "Worker must be able to view their own shift"

    # Create Worker B
    email_b = f"worker.b.{uuid.uuid4().hex[:6]}@fairgig.pk"
    auth_b = supabase_rest("POST", "/auth/v1/admin/users", {
        "email": email_b,
        "password": "WorkerBPass123!",
        "email_confirm": True
    })
    token_b = supabase_rest("POST", "/auth/v1/token?grant_type=password", {
        "email": email_b,
        "password": "WorkerBPass123!"
    })["access_token"]

    # Worker B queries Worker A's shift through RLS
    b_records = supabase_rest("GET", f"/rest/v1/earnings_shifts?id=eq.{earning_id}&select=*", token=token_b)
    assert len(b_records) == 0, "RLS must protect shift ownership: Worker B cannot access Worker A's record"
    print("[LIVE 5 PASS] Worker ownership protection verified. RLS strictly isolated Worker B.")


def test_live_06_database_median_calculation():
    """6. Real database median calculation from seeded Lahore records (Cohort >= 5)."""
    lahore_id = "11111111-1111-1111-1111-111111111111"
    rideshare_id = "20000000-0000-0000-0000-000000000001"

    result = supabase_rest("POST", "/rest/v1/rpc/get_city_category_median_income", {
        "p_city_id": lahore_id,
        "p_category_id": rideshare_id,
        "min_group_size": 5
    })

    assert len(result) >= 1, "RPC must return results for Lahore"
    row = result[0]
    assert row["is_suppressed_for_privacy"] is False, "Cohort >= 5 must not be suppressed"
    assert row["worker_sample_count"] >= 5, "Worker sample count must be >= 5"
    assert row["median_hourly_rate"] is not None, "Median hourly rate must be calculated"
    assert float(row["median_hourly_rate"]) > 175.00, "Hourly rate should be above minimum wage floor"
    print(f"[LIVE 6 PASS] Real DB median calculated for Lahore: PKR {row['median_hourly_rate']}/hr (Sample: {row['worker_sample_count']} workers).")


def test_live_07_privacy_suppression():
    """7. Privacy suppression for small cohorts (< 5 workers) in Rawalpindi."""
    rwp_id = "44444444-4444-4444-4444-444444444444"
    food_id = "20000000-0000-0000-0000-000000000002"

    result = supabase_rest("POST", "/rest/v1/rpc/get_city_category_median_income", {
        "p_city_id": rwp_id,
        "p_category_id": food_id,
        "min_group_size": 5
    })

    assert len(result) >= 1, "RPC must return results for Rawalpindi"
    row = result[0]
    assert row["is_suppressed_for_privacy"] is True, "Cohort < 5 MUST be suppressed for k-anonymity"
    assert row["worker_sample_count"] < 5, "Worker sample count must be < 5"
    assert row["median_hourly_rate"] is None, "Suppressed cohort must have NULL median_hourly_rate"
    print(f"[LIVE 7 PASS] K-Anonymity privacy suppression verified. Rawalpindi cohort of {row['worker_sample_count']} workers was suppressed.")


def test_live_08_evidence_storage_bucket():
    """8. Evidence private storage bucket configuration."""
    buckets = supabase_rest("GET", "/storage/v1/bucket")
    matching = [b for b in buckets if b["id"] == "evidence-private"]
    assert len(matching) == 1, "Bucket 'evidence-private' must exist in Supabase storage"
    assert matching[0]["public"] is False, "Bucket 'evidence-private' must be private (public: False)"
    print(f"[LIVE 8 PASS] Private evidence storage bucket 'evidence-private' confirmed (Public: False).")
