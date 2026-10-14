-- ============================================================================
-- FAIRGIG SEED DATA
-- Target: Supabase PostgreSQL
-- ============================================================================

-- 1. Reference Platforms
INSERT INTO public.platforms (slug, name, website_url, is_active) VALUES
    ('uber', 'Uber / Uber Eats', 'https://www.uber.com', TRUE),
    ('doordash', 'DoorDash', 'https://www.doordash.com', TRUE),
    ('grubhub', 'Grubhub', 'https://www.grubhub.com', TRUE),
    ('lyft', 'Lyft', 'https://www.lyft.com', TRUE),
    ('instacart', 'Instacart', 'https://www.instacart.com', TRUE),
    ('deliveroo', 'Deliveroo', 'https://www.deliveroo.com', TRUE),
    ('other', 'Independent / Other Platform', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. Worker Categories
INSERT INTO public.worker_categories (slug, name, description) VALUES
    ('rideshare', 'Rideshare Drivers', 'Passenger transport services such as Uber and Lyft'),
    ('food_delivery', 'Food & Meal Couriers', 'On-demand food delivery from restaurants via DoorDash, Grubhub, etc.'),
    ('grocery_delivery', 'Grocery Shoppers & Couriers', 'In-store personal shopping and delivery via Instacart'),
    ('package_logistics', 'Parcel & Last-Mile Delivery', 'Package couriers and logistics contractors'),
    ('general_task', 'On-Demand Taskers', 'Handyman, cleaning, moving, and odd-job contractors')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

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
