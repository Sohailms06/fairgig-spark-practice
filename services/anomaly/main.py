"""FairGig Anomaly Detection Service (FastAPI)
Deterministic and explainable statistical deduction outlier and sudden income-drop detection.
"""

from datetime import datetime, timezone
import math
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="FairGig Anomaly Service",
    description="Deterministic algorithms for statistical deduction outliers and sudden income drops.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str = Field(default="ok")
    service: str = Field(default="anomaly")
    version: str = Field(default="0.1.0")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ShiftInput(BaseModel):
    id: Optional[str] = None
    shiftDate: str
    hoursWorked: float = Field(gt=0)
    grossAmount: float = Field(ge=0)
    netAmount: float = Field(ge=0)
    deductions: float = Field(default=0.0, ge=0)
    tipsAmount: float = Field(default=0.0, ge=0)
    tripsCount: int = Field(default=0, ge=0)


class AnomalyThresholds(BaseModel):
    maxDeductionRatio: float = Field(default=0.30, ge=0, le=1)
    deductionZScoreThreshold: float = Field(default=2.0, gt=0)
    incomeDropPercentageThreshold: float = Field(default=40.0, ge=0, le=100)
    minimumBaselineShifts: int = Field(default=3, ge=1)


class StandaloneAnalyzeRequest(BaseModel):
    targetShift: ShiftInput
    historicalShifts: List[ShiftInput] = Field(default_factory=list)
    platform: str = "uber"
    cityMinimumHourlyWage: float = Field(default=15.0, gt=0)
    thresholds: Optional[AnomalyThresholds] = Field(default_factory=AnomalyThresholds)


class DetectedAnomaly(BaseModel):
    type: str
    severity: str
    name: str
    description: str
    observedValue: float
    expectedThreshold: float
    delta: float
    unit: str
    explanation: str
    suggestedAction: str


class StandaloneAnalyzeResponse(BaseModel):
    isAnomaly: bool
    anomalyScore: float  # 0.0 to 1.0
    riskLevel: str
    targetHourlyRate: float
    targetDeductionRatio: float
    baselineAverageHourlyRate: Optional[float] = None
    baselineAverageDeductionRatio: Optional[float] = None
    anomaliesDetected: List[DetectedAnomaly]
    evaluatedAt: str
    deterministicRulesApplied: List[str]


@app.get("/health", response_model=HealthResponse, tags=["System"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """Standard health check endpoint."""
    return HealthResponse()


@app.post(
    "/api/v1/anomaly/analyze",
    response_model=StandaloneAnalyzeResponse,
    tags=["Anomaly Detection"],
)
def analyze_shift_standalone(request: StandaloneAnalyzeRequest) -> StandaloneAnalyzeResponse:
    """Deterministic, explainable shift anomaly evaluation."""
    target = request.targetShift
    thresholds = request.thresholds or AnomalyThresholds()
    target_rate = round(target.netAmount / target.hoursWorked, 2)
    target_deduction_ratio = (
        round(target.deductions / target.grossAmount, 4) if target.grossAmount > 0 else 0.0
    )

    detected: List[DetectedAnomaly] = []
    rules_applied: List[str] = [
        "RULE_STATISTICAL_DEDUCTION_OUTLIER",
        "RULE_SUDDEN_INCOME_DROP",
        "RULE_SUB_MINIMUM_WAGE_DEFICIT",
    ]

    baseline_rates: List[float] = [
        s.netAmount / s.hoursWorked for s in request.historicalShifts if s.hoursWorked > 0
    ]
    baseline_deduction_ratios: List[float] = [
        s.deductions / s.grossAmount for s in request.historicalShifts if s.grossAmount > 0
    ]

    baseline_avg_rate: Optional[float] = (
        round(sum(baseline_rates) / len(baseline_rates), 2) if baseline_rates else None
    )
    baseline_avg_deduction: Optional[float] = (
        round(sum(baseline_deduction_ratios) / len(baseline_deduction_ratios), 4)
        if baseline_deduction_ratios
        else None
    )

    # 1. Deduction Outlier Check
    if len(baseline_deduction_ratios) >= thresholds.minimumBaselineShifts:
        mean_r = sum(baseline_deduction_ratios) / len(baseline_deduction_ratios)
        variance = sum((r - mean_r) ** 2 for r in baseline_deduction_ratios) / len(
            baseline_deduction_ratios
        )
        std_dev = math.sqrt(variance) if variance > 0 else 0.05
        z_score = (target_deduction_ratio - mean_r) / std_dev if std_dev > 0 else 0

        if z_score >= thresholds.deductionZScoreThreshold:
            delta_val = round(target_deduction_ratio - mean_r, 4)
            detected.append(
                DetectedAnomaly(
                    type="deduction_outlier",
                    severity="critical" if z_score >= 3.0 else "warning",
                    name="Statistical Deduction Outlier",
                    description=(
                        f"Deduction ratio {target_deduction_ratio * 100:.1f}% is "
                        f"{z_score:.2f} standard deviations above baseline average ({mean_r * 100:.1f}%)."
                    ),
                    observedValue=target_deduction_ratio,
                    expectedThreshold=round(mean_r + (thresholds.deductionZScoreThreshold * std_dev), 4),
                    delta=delta_val,
                    unit="ratio",
                    explanation=(
                        f"The platform deducted ${(target.deductions):.2f} out of ${(target.grossAmount):.2f}. "
                        f"Historical average deduction is {(mean_r * 100):.1f}%."
                    ),
                    suggestedAction="Submit grievance with pay stub screenshot for verifier audit.",
                )
            )
    elif target_deduction_ratio > thresholds.maxDeductionRatio:
        detected.append(
            DetectedAnomaly(
                type="deduction_outlier",
                severity="warning",
                name="Excessive Deduction Ratio",
                description=(
                    f"Deduction ratio {target_deduction_ratio * 100:.1f}% exceeds standard platform cap of "
                    f"{thresholds.maxDeductionRatio * 100:.0f}%."
                ),
                observedValue=target_deduction_ratio,
                expectedThreshold=thresholds.maxDeductionRatio,
                delta=round(target_deduction_ratio - thresholds.maxDeductionRatio, 4),
                unit="ratio",
                explanation="Deductions exceeded the maximum allowable baseline threshold.",
                suggestedAction="Request itemized deduction statement from platform support.",
            )
        )

    # 2. Sudden Income Drop Check
    if baseline_avg_rate is not None and baseline_avg_rate > 0:
        drop_pct = ((baseline_avg_rate - target_rate) / baseline_avg_rate) * 100.0
        if drop_pct >= thresholds.incomeDropPercentageThreshold:
            detected.append(
                DetectedAnomaly(
                    type="sudden_income_drop",
                    severity="critical" if drop_pct >= 60.0 else "warning",
                    name="Sudden Hourly Rate Collapse",
                    description=(
                        f"Effective rate of ${target_rate:.2f}/hr is a {drop_pct:.1f}% drop below "
                        f"historical average of ${baseline_avg_rate:.2f}/hr."
                    ),
                    observedValue=target_rate,
                    expectedThreshold=round(
                        baseline_avg_rate * (1 - thresholds.incomeDropPercentageThreshold / 100), 2
                    ),
                    delta=round(target_rate - baseline_avg_rate, 2),
                    unit="USD/hour",
                    explanation="Sharp drop indicates abnormal unpaid idle periods or uncredited trip incentives.",
                    suggestedAction="Verify logged shift start/end timestamps and compare trip records.",
                )
            )

    # 3. Sub-minimum Wage Check
    if target_rate < request.cityMinimumHourlyWage:
        deficit = round(request.cityMinimumHourlyWage - target_rate, 2)
        detected.append(
            DetectedAnomaly(
                type="hourly_rate_deficit",
                severity="critical",
                name="Sub-Minimum Wage Rate",
                description=f"Net rate of ${target_rate:.2f}/hr fell below municipal minimum wage of ${request.cityMinimumHourlyWage:.2f}/hr.",
                observedValue=target_rate,
                expectedThreshold=request.cityMinimumHourlyWage,
                delta=-deficit,
                unit="USD/hour",
                explanation=f"Worker experienced a net deficit of ${deficit:.2f}/hr against statutory minimum floor.",
                suggestedAction="File an underpayment grievance for advocate cluster review.",
            )
        )

    score = min(1.0, len(detected) * 0.35 + (0.3 if any(d.severity == "critical" for d in detected) else 0.0))
    risk = "critical" if score >= 0.7 else "high" if score >= 0.4 else "medium" if score > 0 else "low"

    return StandaloneAnalyzeResponse(
        isAnomaly=len(detected) > 0,
        anomalyScore=round(score, 2),
        riskLevel=risk,
        targetHourlyRate=target_rate,
        targetDeductionRatio=target_deduction_ratio,
        baselineAverageHourlyRate=baseline_avg_rate,
        baselineAverageDeductionRatio=baseline_avg_deduction,
        anomaliesDetected=detected,
        evaluatedAt=datetime.now(timezone.utc).isoformat(),
        deterministicRulesApplied=rules_applied,
    )


@app.get("/", tags=["System"])
def root() -> dict[str, str]:
    return {
        "service": "FairGig Anomaly Service",
        "health": "/health",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
