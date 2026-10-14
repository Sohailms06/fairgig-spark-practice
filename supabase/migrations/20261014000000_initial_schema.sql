-- ============================================================================
-- FAIRGIG INITIAL DATABASE SCHEMA & SECURITY POLICIES
-- Target: Supabase PostgreSQL 15+
-- Migration: 20261014000000_initial_schema.sql
-- ============================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('worker', 'verifier', 'advocate', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'discrepancy', 'unverifiable');
CREATE TYPE grievance_status AS ENUM ('submitted', 'under_review', 'clustered', 'escalated', 'resolved', 'rejected');
CREATE TYPE grievance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE verification_decision AS ENUM ('approve', 'flag_discrepancy', 'mark_unverifiable');

-- 2. REFERENCE TABLES
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'USA',
    minimum_hourly_wage NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_zone_city_code UNIQUE (city_id, code)
);

CREATE TABLE IF NOT EXISTS public.platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    website_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.worker_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROFILES & AUTH REFRESH SESSIONS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    role user_role NOT NULL DEFAULT 'worker',
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    primary_platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
    worker_category_id UUID REFERENCES public.worker_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refresh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EARNINGS & SHIFTS
CREATE TABLE IF NOT EXISTS public.earnings_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE RESTRICT,
    zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
    shift_date DATE NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    hours_worked NUMERIC(5, 2) NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
    gross_amount NUMERIC(10, 2) NOT NULL CHECK (gross_amount >= 0),
    net_amount NUMERIC(10, 2) NOT NULL CHECK (net_amount >= 0),
    deductions NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
    tips_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (tips_amount >= 0),
    bonus_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (bonus_amount >= 0),
    trips_count INT NOT NULL DEFAULT 0 CHECK (trips_count >= 0),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SCREENSHOT EVIDENCE & OCR METADATA
CREATE TABLE IF NOT EXISTS public.screenshot_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    earning_id UUID NOT NULL REFERENCES public.earnings_shifts(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760), -- 10MB limit
    ocr_confidence NUMERIC(3, 2),
    extracted_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. VERIFICATION AUDIT & REVIEWS
CREATE TABLE IF NOT EXISTS public.verification_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    earning_id UUID NOT NULL REFERENCES public.earnings_shifts(id) ON DELETE CASCADE,
    verifier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    previous_status verification_status NOT NULL,
    new_status verification_status NOT NULL,
    decision verification_decision NOT NULL,
    notes TEXT NOT NULL,
    discrepancy_reason VARCHAR(100),
    verified_gross_amount NUMERIC(10, 2),
    verified_net_amount NUMERIC(10, 2),
    verified_hours_worked NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. GRIEVANCE CLUSTERS & GRIEVANCES
CREATE TABLE IF NOT EXISTS public.grievance_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE RESTRICT,
    severity grievance_priority NOT NULL DEFAULT 'medium',
    advocate_lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES public.grievance_clusters(id) ON DELETE SET NULL,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority grievance_priority NOT NULL DEFAULT 'medium',
    status grievance_status NOT NULL DEFAULT 'submitted',
    claimed_loss_amount NUMERIC(10, 2) DEFAULT 0 CHECK (claimed_loss_amount >= 0),
    escalated_at TIMESTAMPTZ,
    escalated_to_advocate_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grievance_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_grievance_tag UNIQUE (grievance_id, tag_name)
);

CREATE TABLE IF NOT EXISTS public.grievance_earnings_link (
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    earning_id UUID NOT NULL REFERENCES public.earnings_shifts(id) ON DELETE CASCADE,
    PRIMARY KEY (grievance_id, earning_id)
);

-- 8. VERIFIABLE INCOME CERTIFICATES
CREATE TABLE IF NOT EXISTS public.income_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    purpose VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(100),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    total_gross_income NUMERIC(10, 2) NOT NULL,
    total_net_income NUMERIC(10, 2) NOT NULL,
    total_deductions NUMERIC(10, 2) NOT NULL,
    total_hours_worked NUMERIC(6, 2) NOT NULL,
    verified_shifts_count INT NOT NULL DEFAULT 0,
    unverified_shifts_count INT NOT NULL DEFAULT 0,
    verification_percentage NUMERIC(5, 2) NOT NULL,
    signature_hash VARCHAR(64) NOT NULL,
    public_verification_token VARCHAR(64) UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_cert_dates CHECK (period_end_date >= period_start_date)
);

-- 9. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    ip_address INET,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_earnings_worker_date ON public.earnings_shifts (worker_id, shift_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_platform_status ON public.earnings_shifts (platform_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON public.earnings_shifts (verification_status);
CREATE INDEX IF NOT EXISTS idx_evidence_earning ON public.screenshot_evidence (earning_id);
CREATE INDEX IF NOT EXISTS idx_reviews_earning ON public.verification_reviews (earning_id);
CREATE INDEX IF NOT EXISTS idx_grievances_worker ON public.grievances (worker_id);
CREATE INDEX IF NOT EXISTS idx_grievances_platform_status ON public.grievances (platform_id, status);
CREATE INDEX IF NOT EXISTS idx_grievances_cluster ON public.grievances (cluster_id);
CREATE INDEX IF NOT EXISTS idx_cert_public_token ON public.income_certificates (public_verification_token);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON public.refresh_sessions (user_id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_audit_actor_created ON public.audit_logs (actor_id, created_at DESC);

-- 11. PRIVACY-PRESERVING ADVOCATE AGGREGATE FUNCTION (K-ANONYMITY >= 5)
CREATE OR REPLACE FUNCTION get_advocate_platform_metrics(min_group_size INT DEFAULT 5)
RETURNS TABLE (
    platform_slug VARCHAR,
    platform_name VARCHAR,
    worker_sample_count BIGINT,
    is_suppressed_for_privacy BOOLEAN,
    average_hourly_rate NUMERIC,
    average_deduction_percentage NUMERIC,
    discrepancy_count BIGINT,
    total_gross_earnings NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH cohort AS (
        SELECT
            p.slug AS p_slug,
            p.name AS p_name,
            COUNT(DISTINCT e.worker_id) AS worker_count,
            AVG(e.net_amount / NULLIF(e.hours_worked, 0)) AS avg_rate,
            AVG(CASE WHEN e.gross_amount > 0 THEN (e.deductions / e.gross_amount) * 100 ELSE 0 END) AS avg_ded_pct,
            COUNT(CASE WHEN e.verification_status = 'discrepancy' THEN 1 END) AS disc_count,
            SUM(e.gross_amount) AS total_gross
        FROM public.platforms p
        LEFT JOIN public.earnings_shifts e ON e.platform_id = p.id
        GROUP BY p.slug, p.name
    )
    SELECT
        c.p_slug,
        c.p_name,
        c.worker_count,
        (c.worker_count < min_group_size) AS is_suppressed,
        CASE WHEN c.worker_count >= min_group_size THEN ROUND(c.avg_rate, 2) ELSE NULL END,
        CASE WHEN c.worker_count >= min_group_size THEN ROUND(c.avg_ded_pct, 2) ELSE NULL END,
        c.disc_count,
        CASE WHEN c.worker_count >= min_group_size THEN ROUND(c.total_gross, 2) ELSE NULL END
    FROM cohort c;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshot_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role from auth claims or profile
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile non-privileged fields"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Verifiers and advocates can view basic profiles"
    ON public.profiles FOR SELECT
    USING (public.get_current_user_role() IN ('verifier', 'advocate', 'admin'));

-- Earnings Shifts Policies
CREATE POLICY "Workers can read and write own earnings"
    ON public.earnings_shifts FOR ALL
    USING (auth.uid() = worker_id)
    WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Verifiers can view all earnings"
    ON public.earnings_shifts FOR SELECT
    USING (public.get_current_user_role() IN ('verifier', 'admin'));

CREATE POLICY "Verifiers can update verification status"
    ON public.earnings_shifts FOR UPDATE
    USING (public.get_current_user_role() IN ('verifier', 'admin'));

-- Screenshot Evidence Policies
CREATE POLICY "Workers can access own screenshot evidence"
    ON public.screenshot_evidence FOR ALL
    USING (auth.uid() = worker_id)
    WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Verifiers can view screenshot evidence"
    ON public.screenshot_evidence FOR SELECT
    USING (public.get_current_user_role() IN ('verifier', 'admin'));

-- Verification Reviews Policies
CREATE POLICY "Verifiers can insert and view verification reviews"
    ON public.verification_reviews FOR ALL
    USING (public.get_current_user_role() IN ('verifier', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('verifier', 'admin'));

CREATE POLICY "Workers can view reviews on their own earnings"
    ON public.verification_reviews FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.earnings_shifts e
        WHERE e.id = earning_id AND e.worker_id = auth.uid()
    ));

-- Grievances Policies
CREATE POLICY "Workers can manage own grievances"
    ON public.grievances FOR ALL
    USING (auth.uid() = worker_id)
    WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Advocates can view and update grievances"
    ON public.grievances FOR ALL
    USING (public.get_current_user_role() IN ('advocate', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('advocate', 'admin'));

-- Income Certificates Policies
CREATE POLICY "Workers can manage own certificates"
    ON public.income_certificates FOR ALL
    USING (auth.uid() = worker_id)
    WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Public token verification for certificates"
    ON public.income_certificates FOR SELECT
    USING (TRUE);

-- Audit Logs Policies (System/Admin Read Only)
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.get_current_user_role() = 'admin');

-- 13. PREVENT PRIVILEGE ESCALATION ON USER CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'FairGig Worker'),
        'worker' -- Enforce default worker role strictly. Verifier/Advocate must be assigned by Admin.
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to hook auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();
