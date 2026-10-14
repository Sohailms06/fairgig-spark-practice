-- ============================================================================
-- FAIRGIG SEED DATA
-- Target: Supabase PostgreSQL 15+
-- ============================================================================

-- 1. Reference Platforms
INSERT INTO public.platforms (id, slug, name, website_url, is_active) VALUES
    ('10000000-0000-0000-0000-000000000001', 'uber', 'Uber / Uber Eats', 'https://www.uber.com', TRUE),
    ('10000000-0000-0000-0000-000000000002', 'doordash', 'DoorDash', 'https://www.doordash.com', TRUE),
    ('10000000-0000-0000-0000-000000000003', 'grubhub', 'Grubhub', 'https://www.grubhub.com', TRUE),
    ('10000000-0000-0000-0000-000000000004', 'lyft', 'Lyft', 'https://www.lyft.com', TRUE),
    ('10000000-0000-0000-0000-000000000005', 'instacart', 'Instacart', 'https://www.instacart.com', TRUE),
    ('10000000-0000-0000-0000-000000000006', 'deliveroo', 'Deliveroo', 'https://www.deliveroo.com', TRUE),
    ('10000000-0000-0000-0000-000000000007', 'other', 'Independent / Other Platform', NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Worker Categories
INSERT INTO public.worker_categories (id, slug, name, description) VALUES
    ('20000000-0000-0000-0000-000000000001', 'rideshare', 'Rideshare Drivers', 'Passenger transport services such as Uber and Lyft'),
    ('20000000-0000-0000-0000-000000000002', 'food_delivery', 'Food & Meal Couriers', 'On-demand food delivery from restaurants via DoorDash, Grubhub, etc.'),
    ('20000000-0000-0000-0000-000000000003', 'grocery_delivery', 'Grocery Shoppers & Couriers', 'In-store personal shopping and delivery via Instacart'),
    ('20000000-0000-0000-0000-000000000004', 'package_logistics', 'Parcel & Last-Mile Delivery', 'Package couriers and logistics contractors'),
    ('20000000-0000-0000-0000-000000000005', 'general_task', 'On-Demand Taskers', 'Handyman, cleaning, moving, and odd-job contractors')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Cities & Metropolitan Zones
INSERT INTO public.cities (id, name, state, country, minimum_hourly_wage) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Seattle', 'WA', 'USA', 19.97),
    ('22222222-2222-2222-2222-222222222222', 'New York City', 'NY', 'USA', 18.00),
    ('33333333-3333-3333-3333-333333333333', 'San Francisco', 'CA', 'USA', 18.07),
    ('44444444-4444-4444-4444-444444444444', 'Chicago', 'IL', 'USA', 15.80)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.zones (id, city_id, name, code) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Downtown / Belltown', 'SEA-DT'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Capitol Hill / Central', 'SEA-CH'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Manhattan Midtown', 'NYC-MID'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Brooklyn North / Williamsburg', 'NYC-BKN')
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Profiles (Profiles table, with password placeholder or foreign key to auth.users)
-- Verifier & Advocate Demo Accounts (Admin-provisioned)
INSERT INTO public.profiles (id, email, full_name, phone_number, role, city_id, primary_platform_id, worker_category_id, is_active)
VALUES
    ('90000000-0000-0000-0000-000000000001', 'verifier.demo@fairgig.org', 'Eleanor Vance (Auditor Lead)', '+12065550101', 'verifier', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE),
    ('90000000-0000-0000-0000-000000000002', 'advocate.demo@fairgig.org', 'Marcus Rodriguez (Labor Advocate)', '+12065550102', 'advocate', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6 Seeded Seattle Rideshare Workers (Sufficient cohort >= 5 for Median Calculations)
INSERT INTO public.profiles (id, email, full_name, role, city_id, primary_platform_id, worker_category_id, is_active)
VALUES
    ('80000000-0000-0000-0000-000000000001', 'worker1.seattle@fairgig.org', 'Maria Santos', 'worker', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE),
    ('80000000-0000-0000-0000-000000000002', 'worker2.seattle@fairgig.org', 'David Chen', 'worker', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE),
    ('80000000-0000-0000-0000-000000000003', 'worker3.seattle@fairgig.org', 'Amina Yusuf', 'worker', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE),
    ('80000000-0000-0000-0000-000000000004', 'worker4.seattle@fairgig.org', 'James Wilson', 'worker', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE),
    ('80000000-0000-0000-0000-000000000005', 'worker5.seattle@fairgig.org', 'Priya Patel', 'worker', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE),
    ('80000000-0000-0000-0000-000000000006', 'worker6.seattle@fairgig.org', 'Lucas Rossi', 'worker', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2 Seeded NYC Workers (Small cohort < 5, demonstrating privacy suppression)
INSERT INTO public.profiles (id, email, full_name, role, city_id, primary_platform_id, worker_category_id, is_active)
VALUES
    ('80000000-0000-0000-0000-000000000007', 'worker7.nyc@fairgig.org', 'Mateo Gomez', 'worker', '22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', TRUE),
    ('80000000-0000-0000-0000-000000000008', 'worker8.nyc@fairgig.org', 'Khadija Al-Mansoor', 'worker', '22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Seeded Shifts (Realistic Earnings Records)
-- Seattle Shifts (hourly rates: $21.05, $22.50, $24.00, $20.00, $23.20, $19.50) -> Median rate is approx $21.78/hr!
INSERT INTO public.earnings_shifts (id, worker_id, platform_id, zone_id, shift_date, hours_worked, gross_amount, net_amount, deductions, tips_amount, trips_count, verification_status)
VALUES
    ('70000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-10-10', 8.0, 210.50, 168.40, 42.10, 35.00, 14, 'verified'),
    ('70000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-10-10', 8.0, 225.00, 180.00, 45.00, 40.00, 15, 'verified'),
    ('70000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-10-11', 7.5, 230.00, 180.00, 50.00, 30.00, 13, 'verified'),
    ('70000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-10-11', 8.0, 200.00, 160.00, 40.00, 25.00, 12, 'pending'),
    ('70000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-10-12', 6.5, 185.00, 150.80, 34.20, 28.00, 11, 'pending'),
    ('70000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-10-12', 8.0, 195.00, 156.00, 39.00, 20.00, 10, 'discrepancy')
ON CONFLICT (id) DO NOTHING;

-- NYC Shifts (Only 2 workers, demonstrating k-anonymity privacy suppression!)
INSERT INTO public.earnings_shifts (id, worker_id, platform_id, zone_id, shift_date, hours_worked, gross_amount, net_amount, deductions, tips_amount, trips_count, verification_status)
VALUES
    ('70000000-0000-0000-0000-000000000007', '80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2026-10-10', 6.0, 150.00, 120.00, 30.00, 25.00, 9, 'verified'),
    ('70000000-0000-0000-0000-000000000008', '80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2026-10-11', 7.0, 175.00, 140.00, 35.00, 30.00, 11, 'verified')
ON CONFLICT (id) DO NOTHING;

-- 6. Verification Reviews by Eleanor Vance (Verifier Lead)
INSERT INTO public.verification_reviews (id, earning_id, verifier_id, previous_status, new_status, decision, notes, verified_gross_amount, verified_net_amount, verified_hours_worked)
VALUES
    ('60000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'pending', 'verified', 'approve', 'Screenshot statement verified against bank deposit.', 210.50, 168.40, 8.0),
    ('60000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', 'pending', 'verified', 'approve', 'Matches Uber partner statement summary.', 225.00, 180.00, 8.0),
    ('60000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000006', '90000000-0000-0000-0000-000000000001', 'pending', 'discrepancy', 'flag_discrepancy', 'Claimed deductions do not match screenshot statement items.', 195.00, 140.00, 8.0)
ON CONFLICT (id) DO NOTHING;
