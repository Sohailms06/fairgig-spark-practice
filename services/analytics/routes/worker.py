from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

try:
    from config import settings
    from database import analytics_db, round_num
    from models import (
        CityBenchmarkComparison,
        DailyTrendItem,
        MonthlyTrendItem,
        PlatformBreakdownItem,
        WeeklyTrendItem,
        WorkerAnalyticsSummary,
    )
    from security import get_current_user_claims
except ImportError:
    from services.analytics.config import settings
    from services.analytics.database import analytics_db, round_num
    from services.analytics.models import (
        CityBenchmarkComparison,
        DailyTrendItem,
        MonthlyTrendItem,
        PlatformBreakdownItem,
        WeeklyTrendItem,
        WorkerAnalyticsSummary,
    )
    from services.analytics.security import get_current_user_claims

router = APIRouter(prefix="/api/v1/analytics/worker", tags=["Worker Analytics"])


def calculate_worker_summary(
    worker_id: str,
    timeframe: str,
    shifts: List[Dict[str, Any]],
    profile: Dict[str, Any],
) -> WorkerAnalyticsSummary:
    """Computes chart-ready worker analytics summary using Decimal precision."""
    total_gross = Decimal("0.00")
    total_net = Decimal("0.00")
    total_deductions = Decimal("0.00")
    total_tips = Decimal("0.00")
    total_hours = Decimal("0.00")
    verified_count = 0

    platform_data: Dict[str, Dict[str, Decimal]] = defaultdict(
        lambda: {
            "gross": Decimal("0.00"),
            "net": Decimal("0.00"),
            "deductions": Decimal("0.00"),
            "hours": Decimal("0.00"),
            "shifts": Decimal("0"),
        }
    )

    daily_data: Dict[str, Dict[str, Decimal]] = defaultdict(
        lambda: {"amount": Decimal("0.00"), "hours": Decimal("0.00")}
    )

    weekly_data: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {
            "gross": Decimal("0.00"),
            "net": Decimal("0.00"),
            "hours": Decimal("0.00"),
            "shifts": Decimal("0"),
            "start": None,
            "end": None,
        }
    )

    monthly_data: Dict[str, Dict[str, Decimal]] = defaultdict(
        lambda: {
            "gross": Decimal("0.00"),
            "net": Decimal("0.00"),
            "hours": Decimal("0.00"),
            "shifts": Decimal("0"),
        }
    )

    for s in shifts:
        gross = Decimal(str(s.get("gross_amount") or 0.0))
        net = Decimal(str(s.get("net_amount") or 0.0))
        ded = Decimal(str(s.get("deductions") or 0.0))
        tips = Decimal(str(s.get("tips_amount") or 0.0))
        hours = Decimal(str(s.get("hours_worked") or 0.0))
        v_status = s.get("verification_status", "pending")
        plat = s.get("platform", "other")
        shift_date_str = str(s.get("shift_date", ""))

        total_gross += gross
        total_net += net
        total_deductions += ded
        total_tips += tips
        total_hours += hours

        if v_status == "verified":
            verified_count += 1

        # Platform breakdown
        p = platform_data[plat]
        p["gross"] += gross
        p["net"] += net
        p["deductions"] += ded
        p["hours"] += hours
        p["shifts"] += Decimal("1")

        # Daily trend
        if shift_date_str:
            d = daily_data[shift_date_str]
            d["amount"] += net
            d["hours"] += hours

            # Monthly aggregation
            month_key = shift_date_str[:7]  # YYYY-MM
            m = monthly_data[month_key]
            m["gross"] += gross
            m["net"] += net
            m["hours"] += hours
            m["shifts"] += Decimal("1")

            # Weekly aggregation
            try:
                dt = datetime.strptime(shift_date_str, "%Y-%m-%d").date()
                week_start = dt - timedelta(days=dt.weekday())
                week_end = week_start + timedelta(days=6)
                w_key = week_start.isoformat()
                w = weekly_data[w_key]
                w["start"] = w_key
                w["end"] = week_end.isoformat()
                w["gross"] += gross
                w["net"] += net
                w["hours"] += hours
                w["shifts"] += Decimal("1")
            except Exception:
                pass

    shifts_count = len(shifts)
    effective_rate = (
        round_num(total_net / total_hours) if total_hours > Decimal("0") else 0.0
    )
    verification_rate = (
        round_num(Decimal(str(verified_count)) / Decimal(str(shifts_count)))
        if shifts_count > 0
        else 0.0
    )

    # Format Platform Breakdown
    platform_breakdown = []
    for plat_name, p in sorted(platform_data.items()):
        hrs = p["hours"]
        g = p["gross"]
        n = p["net"]
        d = p["deductions"]
        s_count = int(p["shifts"])
        h_rate = round_num(n / hrs) if hrs > Decimal("0") else 0.0
        c_pct = round_num((d / g) * Decimal("100")) if g > Decimal("0") else 0.0

        platform_breakdown.append(
            PlatformBreakdownItem(
                platform=plat_name,
                grossAmount=round_num(g),
                netAmount=round_num(n),
                hoursWorked=round_num(hrs),
                hourlyRate=h_rate,
                shiftsCount=s_count,
                commissionPercentage=c_pct,
            )
        )

    # Format Daily Trend
    daily_trends = [
        DailyTrendItem(
            date=k,
            amount=round_num(v["amount"]),
            hours=round_num(v["hours"]),
        )
        for k, v in sorted(daily_data.items())
    ]

    # Format Weekly Trend
    weekly_trends = []
    for k, w in sorted(weekly_data.items()):
        w_hrs = w["hours"]
        w_net = w["net"]
        w_rate = round_num(w_net / w_hrs) if w_hrs > Decimal("0") else 0.0
        weekly_trends.append(
            WeeklyTrendItem(
                weekStart=w["start"] or k,
                weekEnd=w["end"] or k,
                grossAmount=round_num(w["gross"]),
                netAmount=round_num(w_net),
                hoursWorked=round_num(w_hrs),
                effectiveHourlyRate=w_rate,
                shiftsCount=int(w["shifts"]),
            )
        )

    # Format Monthly Trend
    monthly_trends = []
    for k, m in sorted(monthly_data.items()):
        m_hrs = m["hours"]
        m_net = m["net"]
        m_rate = round_num(m_net / m_hrs) if m_hrs > Decimal("0") else 0.0
        monthly_trends.append(
            MonthlyTrendItem(
                month=k,
                grossAmount=round_num(m["gross"]),
                netAmount=round_num(m_net),
                hoursWorked=round_num(m_hrs),
                effectiveHourlyRate=m_rate,
                shiftsCount=int(m["shifts"]),
            )
        )

    # City Benchmark Comparison (k >= 5 privacy suppression)
    city_name = profile.get("city_name", "Lahore")
    category_slug = profile.get("category_slug", "rideshare")
    median_info = analytics_db.get_city_category_median(city_name, category_slug)

    city_median = median_info.get("median_hourly_rate")
    is_suppressed = median_info.get("is_suppressed_for_privacy", False)
    cohort_size = median_info.get("worker_count", 0)

    variance_pct = None
    status_str = "suppressed"
    if not is_suppressed and city_median and city_median > 0:
        variance_pct = round_num(
            ((effective_rate - city_median) / city_median) * 100
        )
        status_str = "above_median" if effective_rate >= city_median else "below_median"

    city_benchmark = CityBenchmarkComparison(
        cityName=city_name,
        category=category_slug,
        cityMedianHourlyRate=city_median,
        workerHourlyRate=effective_rate,
        variancePercentage=variance_pct,
        workerCohortSize=cohort_size,
        isSuppressedForPrivacy=is_suppressed,
        status=status_str,
    )

    return WorkerAnalyticsSummary(
        workerId=worker_id,
        timeframe=timeframe,
        totalGrossEarnings=round_num(total_gross),
        totalNetEarnings=round_num(total_net),
        totalDeductions=round_num(total_deductions),
        totalTips=round_num(total_tips),
        totalHoursWorked=round_num(total_hours),
        effectiveHourlyRate=effective_rate,
        shiftsLoggedCount=shifts_count,
        verifiedShiftsCount=verified_count,
        verificationRate=verification_rate,
        platformBreakdown=platform_breakdown,
        dailyEarningsTrend=daily_trends,
        weeklyEarningsTrend=weekly_trends,
        monthlyEarningsTrend=monthly_trends,
        cityBenchmark=city_benchmark,
    )


@router.get("", response_model=WorkerAnalyticsSummary)
async def get_worker_analytics(
    timeframe: str = Query("last_30_days", pattern="^(last_7_days|last_30_days|last_90_days|all_time)$"),
    startDate: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    endDate: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    worker_id: Optional[str] = Query(None),
    claims: dict = Depends(get_current_user_claims),
) -> WorkerAnalyticsSummary:
    """Retrieves chart-ready personal analytics for an authenticated worker."""
    current_user_id = claims.get("sub")
    role = claims.get("role", "worker")

    target_worker_id = worker_id or current_user_id
    if not target_worker_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing worker identifier",
        )

    # Worker ownership protection
    if role == "worker" and target_worker_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Workers cannot inspect another worker's financial analytics",
        )

    # Resolve date filters
    s_date = startDate
    e_date = endDate

    # Fetch shifts for worker
    shifts = analytics_db.get_worker_shifts(target_worker_id)
    profile = analytics_db.get_worker_profile(target_worker_id) or {}

    # If shifts exist and timeframe is specified without explicit dates, filter relative to dataset/current date
    if shifts and not (startDate and endDate) and timeframe != "all_time":
        # Find latest date in shifts
        latest_date_str = max(s["shift_date"] for s in shifts)
        try:
            latest_dt = datetime.strptime(latest_date_str, "%Y-%m-%d").date()
        except Exception:
            latest_dt = date.today()

        days_map = {"last_7_days": 7, "last_30_days": 30, "last_90_days": 90}
        days = days_map.get(timeframe, 30)
        cutoff_date = (latest_dt - timedelta(days=days)).isoformat()
        shifts = [s for s in shifts if s.get("shift_date", "") >= cutoff_date]

    return calculate_worker_summary(target_worker_id, timeframe, shifts, profile)


@router.get("/benchmark", response_model=CityBenchmarkComparison)
async def get_worker_benchmark(
    worker_id: Optional[str] = Query(None),
    claims: dict = Depends(get_current_user_claims),
) -> CityBenchmarkComparison:
    """Compares worker's hourly rate against live city-category benchmark."""
    current_user_id = claims.get("sub")
    role = claims.get("role", "worker")
    target_id = worker_id or current_user_id

    if role == "worker" and target_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Workers cannot view benchmarks for other workers",
        )

    shifts = analytics_db.get_worker_shifts(target_id)
    profile = analytics_db.get_worker_profile(target_id) or {}
    summary = calculate_worker_summary(target_id, "all_time", shifts, profile)
    if summary.cityBenchmark:
        return summary.cityBenchmark
    raise HTTPException(status_code=404, detail="Benchmark not available")
