from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
import statistics
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

try:
    from config import settings
    from database import (
        PLATFORM_NAMES,
        analytics_db,
        round_num,
    )
    from models import (
        AdvocateAnalyticsOverview,
        AdvocateCohortMetric,
        ComplaintIntelligence,
        GrievanceClusterMetric,
        PlatformCommissionTrendItem,
        VulnerabilityRecord,
        ZoneIncomeDistributionItem,
    )
    from security import require_role
except ImportError:
    from services.analytics.config import settings
    from services.analytics.database import (
        PLATFORM_NAMES,
        analytics_db,
        round_num,
    )
    from services.analytics.models import (
        AdvocateAnalyticsOverview,
        AdvocateCohortMetric,
        ComplaintIntelligence,
        GrievanceClusterMetric,
        PlatformCommissionTrendItem,
        VulnerabilityRecord,
        ZoneIncomeDistributionItem,
    )
    from services.analytics.security import require_role

router = APIRouter(
    prefix="/api/v1/analytics/advocate",
    tags=["Advocate Analytics"],
    dependencies=[Depends(require_role(["advocate", "admin"]))],
)


@router.get("/overview", response_model=AdvocateAnalyticsOverview)
async def get_advocate_overview() -> AdvocateAnalyticsOverview:
    """Provides privacy-preserving aggregate intelligence for advocates with k>=5 anonymity safeguards."""
    shifts = analytics_db.get_all_shifts()
    grievances_info = analytics_db.get_grievances_summary()

    workers_set = set()
    discrepancy_count = 0
    total_loss_claimed = Decimal(str(grievances_info.get("totalEstimatedLossClaimed", 0.0)))

    # Platform & City grouping: (platform, city_name) -> list of shifts
    cohorts: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)

    for s in shifts:
        wid = s.get("worker_id")
        if wid:
            workers_set.add(wid)

        status_val = s.get("verification_status", "pending")
        if status_val == "discrepancy":
            discrepancy_count += 1
            # Add to estimated loss
            ded = Decimal(str(s.get("deductions") or 0.0))
            total_loss_claimed += ded

        plat = s.get("platform", "other")
        zid = str(s.get("zone_id", ""))
        city = "Rawalpindi" if zid == "30303030-3030-3030-3030-303030303030" else "Lahore"
        cohorts[(plat, city)].append(s)

    platform_comparisons: List[AdvocateCohortMetric] = []
    min_k = settings.min_k_anonymity_group_size

    for (plat, city), c_shifts in sorted(cohorts.items()):
        cohort_workers = set(s.get("worker_id") for s in c_shifts if s.get("worker_id"))
        sample_size = len(cohort_workers)

        if sample_size < min_k:
            # Privacy suppression triggered!
            platform_comparisons.append(
                AdvocateCohortMetric(
                    platform=plat,
                    cityName=city,
                    workerSampleCount=sample_size,
                    isSuppressedForPrivacy=True,
                    averageHourlyRate=None,
                    averageDeductionPercentage=None,
                    discrepancyRate=None,
                    topDisputeCategories=[],
                    estimatedWageTheftTotal=None,
                )
            )
        else:
            total_net = sum(Decimal(str(s.get("net_amount") or 0.0)) for s in c_shifts)
            total_gross = sum(Decimal(str(s.get("gross_amount") or 0.0)) for s in c_shifts)
            total_ded = sum(Decimal(str(s.get("deductions") or 0.0)) for s in c_shifts)
            total_hrs = sum(Decimal(str(s.get("hours_worked") or 0.0)) for s in c_shifts)
            c_discrepancies = sum(1 for s in c_shifts if s.get("verification_status") == "discrepancy")

            avg_rate = round_num(total_net / total_hrs) if total_hrs > Decimal("0") else 0.0
            avg_ded_pct = round_num((total_ded / total_gross) * Decimal("100")) if total_gross > Decimal("0") else 0.0
            disc_rate = round_num(Decimal(str(c_discrepancies)) / Decimal(str(len(c_shifts)))) if c_shifts else 0.0

            platform_comparisons.append(
                AdvocateCohortMetric(
                    platform=plat,
                    cityName=city,
                    workerSampleCount=sample_size,
                    isSuppressedForPrivacy=False,
                    averageHourlyRate=avg_rate,
                    averageDeductionPercentage=avg_ded_pct,
                    discrepancyRate=disc_rate,
                    topDisputeCategories=["unexplained_deduction", "fare_underpayment"],
                    estimatedWageTheftTotal=round_num(total_ded * Decimal("0.2")),
                )
            )

    # Format grievance clusters
    clusters = [
        GrievanceClusterMetric(
            clusterId=c["clusterId"] or "00000000-0000-0000-0000-000000000000",
            title=c["title"],
            platform=c["platform"],
            affectedCount=c["affectedCount"],
            estimatedLoss=c["estimatedLoss"],
        )
        for c in grievances_info.get("topGrievanceClusters", [])
    ]

    return AdvocateAnalyticsOverview(
        privacyMinimumThreshold=min_k,
        totalWorkersMonitored=len(workers_set),
        totalShiftsAnalyzed=len(shifts),
        totalDiscrepanciesIdentified=discrepancy_count + grievances_info.get("totalComplaints", 0),
        totalEstimatedLossClaimed=round_num(total_loss_claimed),
        platformComparison=platform_comparisons,
        topGrievanceClusters=clusters,
        generatedAt=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/commissions", response_model=List[PlatformCommissionTrendItem])
async def get_platform_commission_trends() -> List[PlatformCommissionTrendItem]:
    """Analyzes average and median deduction percentages and sample sizes by platform."""
    shifts = analytics_db.get_all_shifts()
    platform_groups: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    for s in shifts:
        plat = s.get("platform", "other")
        platform_groups[plat].append(s)

    results: List[PlatformCommissionTrendItem] = []

    for plat, p_shifts in sorted(platform_groups.items()):
        workers = set(s.get("worker_id") for s in p_shifts if s.get("worker_id"))
        pct_list: List[float] = []
        gross_list: List[float] = []
        ded_list: List[float] = []

        for s in p_shifts:
            gross = float(s.get("gross_amount") or 0.0)
            ded = float(s.get("deductions") or 0.0)
            gross_list.append(gross)
            ded_list.append(ded)
            if gross > 0:
                pct_list.append((ded / gross) * 100.0)
            else:
                pct_list.append(0.0)

        avg_gross = sum(gross_list) / len(gross_list) if gross_list else 0.0
        avg_ded = sum(ded_list) / len(ded_list) if ded_list else 0.0
        avg_pct = sum(pct_list) / len(pct_list) if pct_list else 0.0
        med_pct = statistics.median(pct_list) if pct_list else 0.0
        min_pct = min(pct_list) if pct_list else 0.0
        max_pct = max(pct_list) if pct_list else 0.0

        # Assess trend direction
        trend = "stable"
        if len(pct_list) >= 4:
            mid = len(pct_list) // 2
            first_half = sum(pct_list[:mid]) / mid
            second_half = sum(pct_list[mid:]) / (len(pct_list) - mid)
            if second_half - first_half > 1.5:
                trend = "increasing"
            elif first_half - second_half > 1.5:
                trend = "decreasing"

        results.append(
            PlatformCommissionTrendItem(
                platform=plat,
                platformName=PLATFORM_NAMES.get(plat, plat.capitalize()),
                shiftCount=len(p_shifts),
                workerCount=len(workers),
                averageGrossShift=round_num(avg_gross),
                averageDeduction=round_num(avg_ded),
                averageDeductionPercentage=round_num(avg_pct),
                medianDeductionPercentage=round_num(med_pct),
                minDeductionPercentage=round_num(min_pct),
                maxDeductionPercentage=round_num(max_pct),
                trendDirection=trend,
            )
        )

    return results


@router.get("/zones", response_model=List[ZoneIncomeDistributionItem])
async def get_zone_income_distribution() -> List[ZoneIncomeDistributionItem]:
    """Analyzes income distribution by city zone with k>=5 privacy suppression."""
    shifts = analytics_db.get_all_shifts()
    min_k = settings.min_k_anonymity_group_size
    min_wage = 175.0  # PKR statutory minimum hourly rate

    ZONE_LOOKUP = {
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": ("Lahore", "Gulberg / Main Boulevard"),
        "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": ("Lahore", "DHA Phase 5 & 6"),
        "cccccccc-cccc-cccc-cccc-cccccccccccc": ("Lahore", "Johar Town / Emporium"),
        "dddddddd-dddd-dddd-dddd-dddddddddddd": ("Karachi", "Clifton / Defense (DHA)"),
        "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee": ("Karachi", "Saddar / I.I. Chundrigar"),
        "ffffffff-ffff-ffff-ffff-ffffffffffff": ("Karachi", "Gulshan-e-Iqbal"),
        "10101010-1010-1010-1010-101010101010": ("Islamabad", "Blue Area / F-6 / F-7"),
        "20202020-2020-2020-2020-202020202020": ("Islamabad", "G-9 / G-11 Markaz"),
        "30303030-3030-3030-3030-303030303030": ("Rawalpindi", "Saddar / Murree Road"),
        "40404040-4040-4040-4040-404040404040": ("Rawalpindi", "Bahria Town Phase 1-7"),
    }

    # Group by city/zone
    zone_groups: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
    for s in shifts:
        zid = str(s.get("zone_id", ""))
        city, zone = ZONE_LOOKUP.get(zid, ("Lahore", "Gulberg / Main Boulevard"))
        zone_groups[(city, zone)].append(s)

    results: List[ZoneIncomeDistributionItem] = []

    for (city, zone), z_shifts in zone_groups.items():
        workers = set(s.get("worker_id") for s in z_shifts if s.get("worker_id"))
        w_count = len(workers)

        if w_count < min_k:
            results.append(
                ZoneIncomeDistributionItem(
                    cityName=city,
                    zoneName=zone,
                    workerCount=w_count,
                    shiftCount=len(z_shifts),
                    isSuppressedForPrivacy=True,
                    averageHourlyRate=None,
                    medianHourlyRate=None,
                    statutoryMinimumWage=min_wage,
                    subMinimumWageWorkerCount=None,
                )
            )
        else:
            rates: List[float] = []
            sub_count = 0
            for s in z_shifts:
                hrs = float(s.get("hours_worked") or 0.0)
                net = float(s.get("net_amount") or 0.0)
                if hrs > 0:
                    r = net / hrs
                    rates.append(r)
                    if r < min_wage:
                        sub_count += 1

            avg_r = sum(rates) / len(rates) if rates else 0.0
            med_r = statistics.median(rates) if rates else 0.0

            results.append(
                ZoneIncomeDistributionItem(
                    cityName=city,
                    zoneName=zone,
                    workerCount=w_count,
                    shiftCount=len(z_shifts),
                    isSuppressedForPrivacy=False,
                    averageHourlyRate=round_num(avg_r),
                    medianHourlyRate=round_num(med_r),
                    statutoryMinimumWage=min_wage,
                    subMinimumWageWorkerCount=sub_count,
                )
            )

    return results


@router.get("/complaints", response_model=ComplaintIntelligence)
async def get_complaint_intelligence() -> ComplaintIntelligence:
    """Returns aggregated grievance categories, platform distributions, and collective clusters."""
    info = analytics_db.get_grievances_summary()
    return ComplaintIntelligence(
        totalComplaints=info["totalComplaints"],
        escalatedCount=info["escalatedCount"],
        resolvedCount=info["resolvedCount"],
        underReviewCount=info["underReviewCount"],
        topCategories=info["topCategories"],
        platformDistribution=info["platformDistribution"],
        collectiveClustersCount=info["collectiveClustersCount"],
        estimatedTotalLossClaimed=info["totalEstimatedLossClaimed"],
    )


@router.get("/vulnerabilities", response_model=List[VulnerabilityRecord])
async def get_worker_vulnerabilities(
    thresholdPercentage: float = Query(20.0, ge=5.0, le=90.0),
) -> List[VulnerabilityRecord]:
    """Identifies workers whose monthly net income has fallen more than 20% across comparable periods."""
    shifts = analytics_db.get_all_shifts()

    # Group shifts by worker
    worker_shifts: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for s in shifts:
        wid = s.get("worker_id")
        if wid:
            worker_shifts[wid].append(s)

    vulnerabilities: List[VulnerabilityRecord] = []

    for wid, w_shifts in sorted(worker_shifts.items()):
        # Sort chronologically
        w_shifts.sort(key=lambda x: str(x.get("shift_date", "")))
        if len(w_shifts) < 2:
            continue

        # Split into two equal halves to ensure comparable periods
        mid = len(w_shifts) // 2
        prev_period = w_shifts[:mid]
        curr_period = w_shifts[mid:]

        prev_net = sum(Decimal(str(s.get("net_amount") or 0.0)) for s in prev_period)
        curr_net = sum(Decimal(str(s.get("net_amount") or 0.0)) for s in curr_period)

        if prev_net > Decimal("0"):
            drop = ((prev_net - curr_net) / prev_net) * Decimal("100")
            drop_pct = round_num(drop)
            is_vuln = drop_pct >= thresholdPercentage

            sev = "none"
            if drop_pct >= 40.0:
                sev = "critical"
            elif drop_pct >= thresholdPercentage:
                sev = "warning"

            prof = analytics_db.get_worker_profile(wid) or {}
            plat = w_shifts[0].get("platform", "other")

            vulnerabilities.append(
                VulnerabilityRecord(
                    workerId=wid,
                    workerName=prof.get("full_name", f"Worker {wid[:6]}"),
                    platform=plat,
                    previousPeriodIncome=round_num(prev_net),
                    currentPeriodIncome=round_num(curr_net),
                    percentageDrop=drop_pct,
                    isVulnerable=is_vuln,
                    severity=sev,
                    evaluationPeriod=f"Historical Baseline vs Current Period ({len(w_shifts)} shifts)",
                )
            )

    return sorted(vulnerabilities, key=lambda v: v.percentageDrop, reverse=True)
