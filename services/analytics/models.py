from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ==========================================
# Worker Analytics Models
# ==========================================

class PlatformBreakdownItem(BaseModel):
    platform: str
    grossAmount: float
    netAmount: float
    hoursWorked: float
    hourlyRate: float
    shiftsCount: int
    commissionPercentage: Optional[float] = 0.0


class DailyTrendItem(BaseModel):
    date: str
    amount: float
    hours: float


class WeeklyTrendItem(BaseModel):
    weekStart: str
    weekEnd: str
    grossAmount: float
    netAmount: float
    hoursWorked: float
    effectiveHourlyRate: float
    shiftsCount: int


class MonthlyTrendItem(BaseModel):
    month: str  # YYYY-MM
    grossAmount: float
    netAmount: float
    hoursWorked: float
    effectiveHourlyRate: float
    shiftsCount: int


class CityBenchmarkComparison(BaseModel):
    cityName: str
    category: str
    cityMedianHourlyRate: Optional[float] = None
    workerHourlyRate: float
    variancePercentage: Optional[float] = None
    workerCohortSize: int
    isSuppressedForPrivacy: bool
    status: str  # 'above_median', 'below_median', 'suppressed'


class WorkerAnalyticsSummary(BaseModel):
    workerId: str
    timeframe: str
    totalGrossEarnings: float
    totalNetEarnings: float
    totalDeductions: float
    totalTips: float
    totalHoursWorked: float
    effectiveHourlyRate: float
    shiftsLoggedCount: int
    verifiedShiftsCount: int
    verificationRate: float
    platformBreakdown: List[PlatformBreakdownItem]
    dailyEarningsTrend: List[DailyTrendItem]
    weeklyEarningsTrend: Optional[List[WeeklyTrendItem]] = Field(default_factory=list)
    monthlyEarningsTrend: Optional[List[MonthlyTrendItem]] = Field(default_factory=list)
    cityBenchmark: Optional[CityBenchmarkComparison] = None


# ==========================================
# Advocate Analytics Models (K-Anonymity)
# ==========================================

class AdvocateCohortMetric(BaseModel):
    platform: str
    cityId: Optional[str] = None
    cityName: Optional[str] = None
    workerSampleCount: int
    isSuppressedForPrivacy: bool
    averageHourlyRate: Optional[float] = None
    averageDeductionPercentage: Optional[float] = None
    discrepancyRate: Optional[float] = None
    topDisputeCategories: List[str] = Field(default_factory=list)
    estimatedWageTheftTotal: Optional[float] = None


class GrievanceClusterMetric(BaseModel):
    clusterId: str
    title: str
    platform: str
    affectedCount: int
    estimatedLoss: float


class AdvocateAnalyticsOverview(BaseModel):
    privacyMinimumThreshold: int = 5
    totalWorkersMonitored: int
    totalShiftsAnalyzed: int
    totalDiscrepanciesIdentified: int
    totalEstimatedLossClaimed: float
    platformComparison: List[AdvocateCohortMetric]
    topGrievanceClusters: List[GrievanceClusterMetric]
    generatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ==========================================
# Specialized Advocate Analytics
# ==========================================

class PlatformCommissionTrendItem(BaseModel):
    platform: str
    platformName: str
    shiftCount: int
    workerCount: int
    averageGrossShift: float
    averageDeduction: float
    averageDeductionPercentage: float
    medianDeductionPercentage: float
    minDeductionPercentage: float
    maxDeductionPercentage: float
    trendDirection: str  # 'increasing', 'stable', 'decreasing'


class ZoneIncomeDistributionItem(BaseModel):
    cityId: Optional[str] = None
    cityName: str
    zoneId: Optional[str] = None
    zoneName: str
    workerCount: int
    shiftCount: int
    isSuppressedForPrivacy: bool
    averageHourlyRate: Optional[float] = None
    medianHourlyRate: Optional[float] = None
    statutoryMinimumWage: float
    subMinimumWageWorkerCount: Optional[int] = None


class ComplaintIntelligence(BaseModel):
    totalComplaints: int
    escalatedCount: int
    resolvedCount: int
    underReviewCount: int
    topCategories: List[Dict[str, Any]]
    platformDistribution: Dict[str, int]
    collectiveClustersCount: int
    estimatedTotalLossClaimed: float


class VulnerabilityRecord(BaseModel):
    workerId: str
    workerName: Optional[str] = None
    platform: Optional[str] = None
    previousPeriodIncome: float
    currentPeriodIncome: float
    percentageDrop: float
    isVulnerable: bool
    severity: str  # 'none', 'warning', 'critical'
    evaluationPeriod: str
    disclaimer: str = (
        "Statistical vulnerability indicator for worker assistance outreach. "
        "Does not constitute legal evidence of unfair dismissal or exploitation."
    )


# ==========================================
# System Models
# ==========================================

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "analytics"
    version: str = "0.1.0"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReadyResponse(BaseModel):
    status: str = "ready"
    service: str = "analytics"
    database: str = "connected"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
