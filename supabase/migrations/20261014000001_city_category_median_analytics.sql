-- ============================================================================
-- FAIRGIG CITY-WIDE MEDIAN AND PRIVACY-PRESERVING BENCHMARKS
-- Target: Supabase PostgreSQL 15+
-- Migration: 20261014000001_city_category_median_analytics.sql
-- ============================================================================

-- Function: Calculate real PostgreSQL median hourly and net income by city and category
-- Enforces k-anonymity (min_group_size, default 5)
CREATE OR REPLACE FUNCTION public.get_city_category_median_income(
    p_city_id UUID,
    p_category_id UUID DEFAULT NULL,
    min_group_size INT DEFAULT 5
)
RETURNS TABLE (
    city_id UUID,
    city_name VARCHAR,
    state VARCHAR,
    category_id UUID,
    category_name VARCHAR,
    worker_sample_count BIGINT,
    shifts_analyzed_count BIGINT,
    is_suppressed_for_privacy BOOLEAN,
    median_hourly_rate NUMERIC,
    average_hourly_rate NUMERIC,
    median_net_shift_income NUMERIC,
    average_deduction_percentage NUMERIC,
    minimum_wage_floor NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_shifts AS (
        SELECT
            c.id AS c_id,
            c.name AS c_name,
            c.state AS c_state,
            c.minimum_hourly_wage AS c_min_wage,
            cat.id AS cat_id,
            cat.name AS cat_name,
            e.worker_id,
            (e.net_amount / NULLIF(e.hours_worked, 0)) AS effective_hourly_rate,
            e.net_amount AS net_shift_income,
            CASE WHEN e.gross_amount > 0 THEN (e.deductions / e.gross_amount) * 100 ELSE 0 END AS deduction_pct
        FROM public.earnings_shifts e
        JOIN public.profiles p ON p.id = e.worker_id
        JOIN public.cities c ON c.id = COALESCE(p.city_id, (SELECT z.city_id FROM public.zones z WHERE z.id = e.zone_id LIMIT 1))
        LEFT JOIN public.worker_categories cat ON cat.id = p.worker_category_id
        WHERE c.id = p_city_id
          AND (p_category_id IS NULL OR cat.id = p_category_id)
    ),
    cohort_stats AS (
        SELECT
            fs.c_id,
            fs.c_name,
            fs.c_state,
            fs.cat_id,
            fs.cat_name,
            COUNT(DISTINCT fs.worker_id) AS w_count,
            COUNT(*) AS s_count,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY fs.effective_hourly_rate) AS med_rate,
            AVG(fs.effective_hourly_rate) AS avg_rate,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY fs.net_shift_income) AS med_shift,
            AVG(fs.deduction_pct) AS avg_ded_pct,
            MAX(fs.c_min_wage) AS min_wage
        FROM filtered_shifts fs
        GROUP BY fs.c_id, fs.c_name, fs.c_state, fs.cat_id, fs.cat_name
    )
    SELECT
        cs.c_id,
        cs.c_name,
        cs.c_state,
        cs.cat_id,
        cs.cat_name,
        cs.w_count,
        cs.s_count,
        (cs.w_count < min_group_size) AS is_suppressed,
        CASE WHEN cs.w_count >= min_group_size THEN ROUND(cs.med_rate::numeric, 2) ELSE NULL END,
        CASE WHEN cs.w_count >= min_group_size THEN ROUND(cs.avg_rate::numeric, 2) ELSE NULL END,
        CASE WHEN cs.w_count >= min_group_size THEN ROUND(cs.med_shift::numeric, 2) ELSE NULL END,
        CASE WHEN cs.w_count >= min_group_size THEN ROUND(cs.avg_ded_pct::numeric, 2) ELSE NULL END,
        ROUND(cs.min_wage::numeric, 2)
    FROM cohort_stats cs;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: City-wide benchmark across all cities for comparative advocacy
CREATE OR REPLACE FUNCTION public.get_all_cities_benchmarks(min_group_size INT DEFAULT 5)
RETURNS TABLE (
    city_id UUID,
    city_name VARCHAR,
    state VARCHAR,
    worker_sample_count BIGINT,
    is_suppressed_for_privacy BOOLEAN,
    median_hourly_rate NUMERIC,
    statutory_minimum_wage NUMERIC,
    median_vs_minimum_deficit NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH city_cohorts AS (
        SELECT
            c.id AS c_id,
            c.name AS c_name,
            c.state AS c_state,
            c.minimum_hourly_wage AS min_wage,
            COUNT(DISTINCT e.worker_id) AS w_count,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY (e.net_amount / NULLIF(e.hours_worked, 0))) AS med_rate
        FROM public.cities c
        LEFT JOIN public.profiles p ON p.city_id = c.id
        LEFT JOIN public.earnings_shifts e ON e.worker_id = p.id
        GROUP BY c.id, c.name, c.state, c.minimum_hourly_wage
    )
    SELECT
        cc.c_id,
        cc.c_name,
        cc.c_state,
        cc.w_count,
        (cc.w_count < min_group_size) AS is_suppressed,
        CASE WHEN cc.w_count >= min_group_size THEN ROUND(cc.med_rate::numeric, 2) ELSE NULL END,
        ROUND(cc.min_wage::numeric, 2),
        CASE WHEN cc.w_count >= min_group_size THEN ROUND((cc.med_rate - cc.min_wage)::numeric, 2) ELSE NULL END
    FROM city_cohorts cc;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
