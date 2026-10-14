-- ============================================================================
-- FAIRGIG PAKISTAN SEED DATA
-- Target: Supabase PostgreSQL 15+
-- Metropolitan Hubs: Lahore, Karachi, Islamabad, Rawalpindi
-- Currency: PKR (Pakistani Rupee)
-- ============================================================================

-- 1. Reference Platforms (Active Pakistani Gig Ecosystem)
INSERT INTO public.platforms (id, slug, name, website_url, is_active) VALUES
    ('10000000-0000-0000-0000-000000000001', 'bykea', 'Bykea (Rides & Deliveries)', 'https://www.bykea.com', TRUE),
    ('10000000-0000-0000-0000-000000000002', 'foodpanda', 'Foodpanda Pakistan', 'https://www.foodpanda.pk', TRUE),
    ('10000000-0000-0000-0000-000000000003', 'indrive', 'inDrive Pakistan', 'https://indrive.com', TRUE),
    ('10000000-0000-0000-0000-000000000004', 'careem', 'Careem Pakistan', 'https://www.careem.com', TRUE),
    ('10000000-0000-0000-0000-000000000005', 'yango', 'Yango Pakistan', 'https://yango.com', TRUE),
    ('10000000-0000-0000-0000-000000000006', 'cheetay', 'Cheetay Logistics', 'https://cheetay.pk', TRUE),
    ('10000000-0000-0000-0000-000000000007', 'other', 'Independent / Other Courier', NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, website_url = EXCLUDED.website_url;

-- 2. Worker Categories
INSERT INTO public.worker_categories (id, slug, name, description) VALUES
    ('20000000-0000-0000-0000-000000000001', 'rideshare', 'Rideshare Captains (Car, Bike, Rickshaw)', 'Passenger transit via inDrive, Bykea, Careem, Yango'),
    ('20000000-0000-0000-0000-000000000002', 'food_delivery', 'Food & Meal Delivery Couriers', 'Restaurant order delivery via Foodpanda, Cheetay'),
    ('20000000-0000-0000-0000-000000000003', 'grocery_delivery', 'Grocery & Pandamart Couriers', 'Quick-commerce retail couriers'),
    ('20000000-0000-0000-0000-000000000004', 'package_logistics', 'Parcel & Last-Mile Cargo Logistics', 'On-demand parcel delivery'),
    ('20000000-0000-0000-0000-000000000005', 'general_task', 'On-Demand Services & Maintenance', 'Domestic technical and odd-job taskers')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. Cities & Metropolitan Zones (Pakistan)
INSERT INTO public.cities (id, name, state, country, minimum_hourly_wage) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Lahore', 'Punjab', 'Pakistan', 175.00),
    ('22222222-2222-2222-2222-222222222222', 'Karachi', 'Sindh', 'Pakistan', 178.00),
    ('33333333-3333-3333-3333-333333333333', 'Islamabad', 'ICT', 'Pakistan', 175.00),
    ('44444444-4444-4444-4444-444444444444', 'Rawalpindi', 'Punjab', 'Pakistan', 175.00)
ON CONFLICT (id) DO UPDATE SET minimum_hourly_wage = EXCLUDED.minimum_hourly_wage;

INSERT INTO public.zones (id, city_id, name, code) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Gulberg / Main Boulevard', 'LHE-GLB'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'DHA Phase 5 & 6', 'LHE-DHA'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Johar Town / Emporium', 'LHE-JT'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Clifton / Defense (DHA)', 'KHI-CFT'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Saddar / I.I. Chundrigar', 'KHI-SDR'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222', 'Gulshan-e-Iqbal', 'KHI-GSH'),
    ('10101010-1010-1010-1010-101010101010', '33333333-3333-3333-3333-333333333333', 'Blue Area / F-6 / F-7', 'ISB-BLU'),
    ('20202020-2020-2020-2020-202020202020', '33333333-3333-3333-3333-333333333333', 'G-9 / G-11 Markaz', 'ISB-G9'),
    ('30303030-3030-3030-3030-303030303030', '44444444-4444-4444-4444-444444444444', 'Saddar / Murree Road', 'RWP-SDR'),
    ('40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-444444444444', 'Bahria Town Phase 1-7', 'RWP-BHR')
ON CONFLICT (id) DO NOTHING;
