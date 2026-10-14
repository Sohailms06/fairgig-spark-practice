"""FairGig Pakistan Seed Script & Live Database Populator.
Populates realistic Pakistani gig worker reference data, profiles, shifts, and grievances
directly into live Supabase via Admin REST API.
"""

from datetime import datetime, timezone
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from dotenv import load_dotenv

# Load credentials
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(root_dir, ".env.local"))
load_dotenv(os.path.join(root_dir, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing!")
    sys.exit(1)


def api_request(method: str, path: str, payload: dict | list | None = None, prefer: str | None = None):
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer

    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            if "application/json" in content_type and raw:
                return json.loads(raw.decode("utf-8"))
            return raw.decode("utf-8") if raw else None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"HTTP Error {e.code} on {method} {path}: {err_msg}")
        raise RuntimeError(f"API Error {e.code}: {err_msg}") from e


def get_or_create_auth_user(email: str, password: str, full_name: str) -> str:
    """Finds existing auth.users by email or creates via Admin API."""
    users_resp = api_request("GET", "/auth/v1/admin/users")
    existing_users = users_resp.get("users", [])
    for u in existing_users:
        if u.get("email", "").lower() == email.lower():
            return u["id"]

    create_payload = {
        "email": email.lower(),
        "password": password,
        "email_confirm": True,
        "user_metadata": {"full_name": full_name},
    }
    created = api_request("POST", "/auth/v1/admin/users", create_payload)
    return created["id"]


def main():
    print(f"Connecting to Supabase instance: {SUPABASE_URL}")

    # =========================================================================
    # 1. CITIES (Pakistan Metropolitan Hubs)
    # =========================================================================
    print("Seeding Pakistani Cities...")
    cities = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "Lahore",
            "state": "Punjab",
            "country": "Pakistan",
            "minimum_hourly_wage": 175.00,
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "name": "Karachi",
            "state": "Sindh",
            "country": "Pakistan",
            "minimum_hourly_wage": 178.00,
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "name": "Islamabad",
            "state": "ICT",
            "country": "Pakistan",
            "minimum_hourly_wage": 175.00,
        },
        {
            "id": "44444444-4444-4444-4444-444444444444",
            "name": "Rawalpindi",
            "state": "Punjab",
            "country": "Pakistan",
            "minimum_hourly_wage": 175.00,
        },
    ]
    api_request("POST", "/rest/v1/cities", cities, prefer="resolution=merge-duplicates")

    # =========================================================================
    # 2. ZONES (Pakistani Metropolitan Corridors)
    # =========================================================================
    print("Seeding Metropolitan Zones...")
    zones = [
        {"id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "city_id": "11111111-1111-1111-1111-111111111111", "name": "Gulberg / Main Boulevard", "code": "LHE-GLB"},
        {"id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "city_id": "11111111-1111-1111-1111-111111111111", "name": "DHA Phase 5 & 6", "code": "LHE-DHA"},
        {"id": "cccccccc-cccc-cccc-cccc-cccccccccccc", "city_id": "11111111-1111-1111-1111-111111111111", "name": "Johar Town / Emporium", "code": "LHE-JT"},
        {"id": "dddddddd-dddd-dddd-dddd-dddddddddddd", "city_id": "22222222-2222-2222-2222-222222222222", "name": "Clifton / Defense (DHA)", "code": "KHI-CFT"},
        {"id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "city_id": "22222222-2222-2222-2222-222222222222", "name": "Saddar / I.I. Chundrigar", "code": "KHI-SDR"},
        {"id": "ffffffff-ffff-ffff-ffff-ffffffffffff", "city_id": "22222222-2222-2222-2222-222222222222", "name": "Gulshan-e-Iqbal", "code": "KHI-GSH"},
        {"id": "10101010-1010-1010-1010-101010101010", "city_id": "33333333-3333-3333-3333-333333333333", "name": "Blue Area / F-6 / F-7", "code": "ISB-BLU"},
        {"id": "20202020-2020-2020-2020-202020202020", "city_id": "33333333-3333-3333-3333-333333333333", "name": "G-9 / G-11 Markaz", "code": "ISB-G9"},
        {"id": "30303030-3030-3030-3030-303030303030", "city_id": "44444444-4444-4444-4444-444444444444", "name": "Saddar / Murree Road", "code": "RWP-SDR"},
        {"id": "40404040-4040-4040-4040-404040404040", "city_id": "44444444-4444-4444-4444-444444444444", "name": "Bahria Town Phase 1-7", "code": "RWP-BHR"},
    ]
    api_request("POST", "/rest/v1/zones", zones, prefer="resolution=merge-duplicates")

    # =========================================================================
    # 3. PLATFORMS (Active Pakistani Gig Apps)
    # =========================================================================
    print("Seeding Pakistani Platforms...")
    platforms = [
        {"id": "10000000-0000-0000-0000-000000000001", "slug": "bykea", "name": "Bykea (Rides & Deliveries)", "website_url": "https://www.bykea.com", "is_active": True},
        {"id": "10000000-0000-0000-0000-000000000002", "slug": "foodpanda", "name": "Foodpanda Pakistan", "website_url": "https://www.foodpanda.pk", "is_active": True},
        {"id": "10000000-0000-0000-0000-000000000003", "slug": "indrive", "name": "inDrive Pakistan", "website_url": "https://indrive.com", "is_active": True},
        {"id": "10000000-0000-0000-0000-000000000004", "slug": "careem", "name": "Careem Pakistan", "website_url": "https://www.careem.com", "is_active": True},
        {"id": "10000000-0000-0000-0000-000000000005", "slug": "yango", "name": "Yango Pakistan", "website_url": "https://yango.com", "is_active": True},
        {"id": "10000000-0000-0000-0000-000000000006", "slug": "cheetay", "name": "Cheetay Logistics", "website_url": "https://cheetay.pk", "is_active": True},
        {"id": "10000000-0000-0000-0000-000000000007", "slug": "other", "name": "Independent / Other Courier", "website_url": None, "is_active": True},
    ]
    api_request("POST", "/rest/v1/platforms", platforms, prefer="resolution=merge-duplicates")

    # =========================================================================
    # 4. WORKER CATEGORIES
    # =========================================================================
    print("Seeding Worker Categories...")
    categories = [
        {"id": "20000000-0000-0000-0000-000000000001", "slug": "rideshare", "name": "Rideshare Captains (Car, Bike, Rickshaw)", "description": "Passenger transit via inDrive, Bykea, Careem, Yango"},
        {"id": "20000000-0000-0000-0000-000000000002", "slug": "food_delivery", "name": "Food & Meal Delivery Couriers", "description": "Restaurant order delivery via Foodpanda, Cheetay"},
        {"id": "20000000-0000-0000-0000-000000000003", "slug": "grocery_delivery", "name": "Grocery & Pandamart Couriers", "description": "Quick-commerce retail couriers"},
        {"id": "20000000-0000-0000-0000-000000000004", "slug": "package_logistics", "name": "Parcel & Last-Mile Cargo Logistics", "description": "On-demand parcel delivery"},
        {"id": "20000000-0000-0000-0000-000000000005", "slug": "general_task", "name": "On-Demand Services & Maintenance", "description": "Domestic technical and odd-job taskers"},
    ]
    api_request("POST", "/rest/v1/worker_categories", categories, prefer="resolution=merge-duplicates")

    # =========================================================================
    # 5. AUTH USERS & PROFILES (Fictional Pakistani Workers, Verifiers, Advocates)
    # =========================================================================
    print("Provisioning Demo Users and Profiles...")
    user_definitions = [
        # Staff Demo Accounts
        {"email": "verifier.pk@fairgig.pk", "password": "VerifierPass123!", "name": "Fatima Noor", "phone": "+923001112233", "role": "verifier", "city": "11111111-1111-1111-1111-111111111111", "plat": "10000000-0000-0000-0000-000000000001", "cat": "20000000-0000-0000-0000-000000000001"},
        {"email": "advocate.pk@fairgig.pk", "password": "AdvocatePass123!", "name": "Ayesha Siddiqui", "phone": "+923002223344", "role": "advocate", "city": "11111111-1111-1111-1111-111111111111", "plat": "10000000-0000-0000-0000-000000000001", "cat": "20000000-0000-0000-0000-000000000001"},

        # 6 Lahore Rideshare Workers (Cohort >= 5 for Unsuppressed Median Calculations)
        {"email": "tariq.worker@fairgig.pk", "password": "WorkerPass123!", "name": "Tariq Mehmood", "phone": "+923015550101", "role": "worker", "city": "11111111-1111-1111-1111-111111111111", "plat": "10000000-0000-0000-0000-000000000003", "cat": "20000000-0000-0000-0000-000000000001"},
        {"email": "usman.worker@fairgig.pk", "password": "WorkerPass123!", "name": "Usman Ali", "phone": "+923015550102", "role": "worker", "city": "11111111-1111-1111-1111-111111111111", "plat": "10000000-0000-0000-0000-000000000001", "cat": "20000000-0000-0000-0000-000000000001"},
        {"email": "hamza.worker@fairgig.pk", "password": "WorkerPass123!", "name": "Hamza Nadeem", "phone": "+923015550103", "role": "worker", "city": "11111111-1111-1111-1111-111111111111", "plat": "10000000-0000-0000-0000-000000000004", "cat": "20000000-0000-0000-0000-000000000001"},
        {"email": "bilal.worker@fairgig.pk", "password": "WorkerPass123!", "name": "Bilal Ahmed", "phone": "+923015550104", "role": "worker", "city": "11111111-1111-1111-1111-111111111111", "plat": "10000000-0000-0000-0000-000000000005", "cat": "20000000-0000-0000-0000-000000000001"},
        {"email": "zeeshan.worker@fairgig.pk", "password": "WorkerPass123!", "name": "Zeeshan Khan", "phone": "+923015550105", "role": "worker", "city": "11111111-1111-1111-1111-111111111111", "plat": "10000000-0000-0000-0000-000000000003", "cat": "20000000-0000-0000-0000-000000000001"},
        {"email": "farhan.worker@fairgig.pk", "password": "WorkerPass123!", "name": "Muhammad Farhan", "phone": "+923015550106", "role": "worker", "city": "11111111-1111-1111-1111-111111111111", "plat": "10000000-0000-0000-0000-000000000001", "cat": "20000000-0000-0000-0000-000000000001"},

        # 2 Rawalpindi Food Delivery Workers (Small Cohort < 5 demonstrating Privacy Suppression)
        {"email": "kamran.worker@fairgig.pk", "password": "WorkerPass123!", "name": "Kamran Aslam", "phone": "+923025550201", "role": "worker", "city": "44444444-4444-4444-4444-444444444444", "plat": "10000000-0000-0000-0000-000000000001", "cat": "20000000-0000-0000-0000-000000000002"},
        {"email": "noman.worker@fairgig.pk", "password": "WorkerPass123!", "name": "Noman Rasheed", "phone": "+923025550202", "role": "worker", "city": "44444444-4444-4444-4444-444444444444", "plat": "10000000-0000-0000-0000-000000000002", "cat": "20000000-0000-0000-0000-000000000002"},
    ]

    worker_id_map = {}
    profiles = []

    for u in user_definitions:
        uid = get_or_create_auth_user(u["email"], u["password"], u["name"])
        worker_id_map[u["email"]] = uid
        profiles.append({
            "id": uid,
            "email": u["email"],
            "full_name": u["name"],
            "phone_number": u["phone"],
            "role": u["role"],
            "city_id": u["city"],
            "primary_platform_id": u["plat"],
            "worker_category_id": u["cat"],
            "is_active": True,
        })

    api_request("POST", "/rest/v1/profiles", profiles, prefer="resolution=merge-duplicates")
    print(f"Created {len(profiles)} Profiles.")

    # =========================================================================
    # 6. EARNINGS SHIFTS (Realistic PKR Values & Weekly History)
    # =========================================================================
    print("Seeding Realistic PKR Shift Records...")
    # 6 Lahore workers across multiple shifts
    shifts = [
        # Tariq Mehmood (inDrive - Lahore Gulberg)
        {"worker": "tariq.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000003", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-01", "hrs": 8.5, "gross": 6200.00, "net": 4960.00, "ded": 1240.00, "tips": 350.00, "trips": 14, "status": "verified"},
        {"worker": "tariq.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000003", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-03", "hrs": 9.0, "gross": 6800.00, "net": 5440.00, "ded": 1360.00, "tips": 400.00, "trips": 16, "status": "verified"},
        {"worker": "tariq.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000003", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-08", "hrs": 8.0, "gross": 5800.00, "net": 4640.00, "ded": 1160.00, "tips": 300.00, "trips": 13, "status": "verified"},

        # Usman Ali (Bykea - Lahore Gulberg/DHA)
        {"worker": "usman.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000001", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-02", "hrs": 7.5, "gross": 4600.00, "net": 3680.00, "ded": 920.00, "tips": 250.00, "trips": 18, "status": "verified"},
        {"worker": "usman.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000001", "zone": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "date": "2026-10-05", "hrs": 8.0, "gross": 5200.00, "net": 4160.00, "ded": 1040.00, "tips": 300.00, "trips": 20, "status": "verified"},
        {"worker": "usman.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000001", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-10", "hrs": 8.5, "gross": 5500.00, "net": 4400.00, "ded": 1100.00, "tips": 350.00, "trips": 22, "status": "pending"},

        # Hamza Nadeem (Careem - Lahore DHA) - UNUSUAL DEDUCTION PATTERN (38% deduction)
        {"worker": "hamza.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000004", "zone": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "date": "2026-10-02", "hrs": 9.0, "gross": 7500.00, "net": 4650.00, "ded": 2850.00, "tips": 500.00, "trips": 12, "status": "discrepancy"},
        {"worker": "hamza.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000004", "zone": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "date": "2026-10-06", "hrs": 8.0, "gross": 6400.00, "net": 5120.00, "ded": 1280.00, "tips": 400.00, "trips": 11, "status": "verified"},

        # Bilal Ahmed (Yango - Lahore Johar Town)
        {"worker": "bilal.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000005", "zone": "cccccccc-cccc-cccc-cccc-cccccccccccc", "date": "2026-10-03", "hrs": 7.0, "gross": 4200.00, "net": 3444.00, "ded": 756.00, "tips": 200.00, "trips": 10, "status": "verified"},
        {"worker": "bilal.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000005", "zone": "cccccccc-cccc-cccc-cccc-cccccccccccc", "date": "2026-10-07", "hrs": 8.0, "gross": 5100.00, "net": 4182.00, "ded": 918.00, "tips": 300.00, "trips": 12, "status": "verified"},

        # Zeeshan Khan (inDrive - Lahore Gulberg)
        {"worker": "zeeshan.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000003", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-04", "hrs": 8.0, "gross": 5600.00, "net": 4592.00, "ded": 1008.00, "tips": 250.00, "trips": 14, "status": "verified"},
        {"worker": "zeeshan.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000003", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-09", "hrs": 8.5, "gross": 6100.00, "net": 5002.00, "ded": 1098.00, "tips": 350.00, "trips": 15, "status": "verified"},

        # Muhammad Farhan (Bykea - Lahore Gulberg)
        {"worker": "farhan.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000001", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-04", "hrs": 8.0, "gross": 4900.00, "net": 3920.00, "ded": 980.00, "tips": 200.00, "trips": 19, "status": "verified"},
        {"worker": "farhan.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000001", "zone": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "date": "2026-10-11", "hrs": 9.0, "gross": 5800.00, "net": 4640.00, "ded": 1160.00, "tips": 300.00, "trips": 21, "status": "pending"},

        # 2 Rawalpindi Food Delivery Workers (Small Cohort < 5, Private)
        {"worker": "kamran.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000001", "zone": "30303030-3030-3030-3030-303030303030", "date": "2026-10-05", "hrs": 7.0, "gross": 3800.00, "net": 3040.00, "ded": 760.00, "tips": 300.00, "trips": 12, "status": "verified"},
        {"worker": "kamran.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000001", "zone": "30303030-3030-3030-3030-303030303030", "date": "2026-10-08", "hrs": 8.0, "gross": 4400.00, "net": 3520.00, "ded": 880.00, "tips": 400.00, "trips": 14, "status": "verified"},
        {"worker": "noman.worker@fairgig.pk", "plat": "10000000-0000-0000-0000-000000000002", "zone": "30303030-3030-3030-3030-303030303030", "date": "2026-10-06", "hrs": 7.5, "gross": 4100.00, "net": 3280.00, "ded": 820.00, "tips": 350.00, "trips": 15, "status": "verified"},
    ]

    earnings_payload = []
    import uuid
    shift_ids = []

    for s in shifts:
        s_id = str(uuid.uuid4())
        shift_ids.append((s_id, s))
        w_id = worker_id_map[s["worker"]]
        earnings_payload.append({
            "id": s_id,
            "worker_id": w_id,
            "platform_id": s["plat"],
            "zone_id": s["zone"],
            "shift_date": s["date"],
            "hours_worked": s["hrs"],
            "gross_amount": s["gross"],
            "net_amount": s["net"],
            "deductions": s["ded"],
            "tips_amount": s["tips"],
            "trips_count": s["trips"],
            "verification_status": s["status"],
            "notes": "Weekly Statement Shift Log",
        })

    api_request("POST", "/rest/v1/earnings_shifts", earnings_payload, prefer="resolution=merge-duplicates")
    print(f"Inserted {len(earnings_payload)} Shift Records in PKR.")

    # =========================================================================
    # 7. SCREENSHOT EVIDENCE
    # =========================================================================
    print("Attaching Evidence Records...")
    evidence_payload = []
    for s_id, s in shift_ids[:3]:
        w_id = worker_id_map[s["worker"]]
        evidence_payload.append({
            "id": str(uuid.uuid4()),
            "earning_id": s_id,
            "worker_id": w_id,
            "storage_path": f"evidence-private/{w_id}/{s_id}_statement.png",
            "mime_type": "image/png",
            "file_size_bytes": 1048576,
            "ocr_confidence": 0.94,
            "extracted_data": {"extracted_gross": s["gross"], "extracted_net": s["net"], "currency": "PKR"},
        })
    api_request("POST", "/rest/v1/screenshot_evidence", evidence_payload, prefer="resolution=merge-duplicates")

    # =========================================================================
    # 8. VERIFICATION REVIEWS (Auditor Decisions)
    # =========================================================================
    print("Recording Verification Reviews...")
    verifier_id = worker_id_map["verifier.pk@fairgig.pk"]
    review_payload = [
        {
            "id": str(uuid.uuid4()),
            "earning_id": shift_ids[0][0],
            "verifier_id": verifier_id,
            "previous_status": "pending",
            "new_status": "verified",
            "decision": "approve",
            "notes": "Verified against inDrive weekly payout receipt. Amounts match exactly.",
            "discrepancy_reason": None,
            "verified_gross_amount": shift_ids[0][1]["gross"],
            "verified_net_amount": shift_ids[0][1]["net"],
            "verified_hours_worked": shift_ids[0][1]["hrs"],
        },
        {
            "id": str(uuid.uuid4()),
            "earning_id": shift_ids[6][0],  # Hamza's high deduction shift
            "verifier_id": verifier_id,
            "previous_status": "pending",
            "new_status": "discrepancy",
            "decision": "flag_discrepancy",
            "notes": "38% commission deducted. Exceeds standard Careem 22% rate threshold.",
            "discrepancy_reason": "Excessive platform commission cut",
            "verified_gross_amount": shift_ids[6][1]["gross"],
            "verified_net_amount": shift_ids[6][1]["net"],
            "verified_hours_worked": shift_ids[6][1]["hrs"],
        },
    ]
    api_request("POST", "/rest/v1/verification_reviews", review_payload, prefer="resolution=merge-duplicates")

    # =========================================================================
    # 9. GRIEVANCES (Demonstrating Worker Advocacy)
    # =========================================================================
    print("Filing Demonstration Grievances...")
    hamza_id = worker_id_map["hamza.worker@fairgig.pk"]
    grievances = [
        {
            "id": str(uuid.uuid4()),
            "worker_id": hamza_id,
            "platform_id": "10000000-0000-0000-0000-000000000004",  # Careem
            "title": "Excessive 38% Commission Cut on DHA Peak Hours",
            "description": "Captain statement shows PKR 2,850 deduction on PKR 7,500 gross without explanation.",
            "category": "unfair_deduction",
            "priority": "high",
            "status": "submitted",
            "claimed_loss_amount": 1200.00,
        }
    ]
    api_request("POST", "/rest/v1/grievances", grievances, prefer="resolution=merge-duplicates")

    print("\n--- SEEDING COMPLETED SUCCESSFULLY ---")


if __name__ == "__main__":
    main()
