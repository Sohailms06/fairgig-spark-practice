from datetime import datetime, timezone
from decimal import Decimal
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class PlatformEnum(str):
    UBER = "uber"
    DOORDASH = "doordash"
    GRUBHUB = "grubhub"
    LYFT = "lyft"
    INSTACART = "instacart"
    DELIVEROO = "deliveroo"
    OTHER = "other"


class VerificationStatusEnum(str):
    PENDING = "pending"
    VERIFIED = "verified"
    DISCREPANCY = "discrepancy"
    UNVERIFIABLE = "unverifiable"


class VerificationDecisionEnum(str):
    APPROVE = "approve"
    FLAG_DISCREPANCY = "flag_discrepancy"
    MARK_UNVERIFIABLE = "mark_unverifiable"


class CreateEarningRecordRequest(BaseModel):
    platform: str
    shiftDate: str
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    hoursWorked: float = Field(gt=0, le=24)
    grossAmount: float = Field(ge=0)
    netAmount: float = Field(ge=0)
    deductions: float = Field(default=0.0, ge=0)
    tipsAmount: float = Field(default=0.0, ge=0)
    bonusAmount: float = Field(default=0.0, ge=0)
    tripsCount: int = Field(default=0, ge=0)
    zoneId: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("shiftDate")
    @classmethod
    def validate_shift_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("shiftDate must be in format YYYY-MM-DD")
        return v

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        valid = ["uber", "doordash", "grubhub", "lyft", "instacart", "deliveroo", "other"]
        if v.lower() not in valid:
            raise ValueError(f"Invalid platform '{v}'. Allowed: {valid}")
        return v.lower()


class UpdateEarningRecordRequest(BaseModel):
    platform: Optional[str] = None
    shiftDate: Optional[str] = None
    hoursWorked: Optional[float] = Field(default=None, gt=0, le=24)
    grossAmount: Optional[float] = Field(default=None, ge=0)
    netAmount: Optional[float] = Field(default=None, ge=0)
    deductions: Optional[float] = Field(default=None, ge=0)
    tipsAmount: Optional[float] = Field(default=None, ge=0)
    bonusAmount: Optional[float] = Field(default=None, ge=0)
    tripsCount: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None, max_length=500)


class EarningRecordResponse(BaseModel):
    id: str
    workerId: str
    platform: str
    shiftDate: str
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    hoursWorked: float
    grossAmount: float
    netAmount: float
    deductions: float
    tipsAmount: float
    bonusAmount: float
    tripsCount: int
    hourlyRate: float
    zoneId: Optional[str] = None
    verificationStatus: str
    notes: Optional[str] = None
    createdAt: str
    updatedAt: str


class PaginationMeta(BaseModel):
    page: int
    limit: int
    totalItems: int
    totalPages: int
    hasNextPage: bool
    hasPrevPage: bool


class EarningsListResponse(BaseModel):
    items: List[EarningRecordResponse]
    meta: PaginationMeta


class CsvImportRequest(BaseModel):
    csvContent: str = Field(min_length=1)
    hasHeader: bool = True
    platformFallback: Optional[str] = None


class CsvImportErrorDetail(BaseModel):
    row: int
    message: str
    rawLine: Optional[str] = None


class CsvImportResponse(BaseModel):
    totalRows: int
    importedCount: int
    skippedCount: int
    records: List[EarningRecordResponse]
    errors: List[CsvImportErrorDetail]


class PresignedUploadRequest(BaseModel):
    earningId: str
    filename: str = Field(min_length=1)
    contentType: str
    fileSizeBytes: int = Field(gt=0, le=10 * 1024 * 1024)

    @field_validator("contentType")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
        if v.lower() not in allowed:
            raise ValueError(f"Content type '{v}' not supported. Allowed: {allowed}")
        return v.lower()


class PresignedUploadResponse(BaseModel):
    uploadUrl: str
    storagePath: str
    evidenceId: str
    expiresInSeconds: int


class ConfirmEvidenceRequest(BaseModel):
    evidenceId: str
    earningId: str
    storagePath: str
    extractedData: Optional[Dict[str, Any]] = None


class EvidenceResponse(BaseModel):
    id: str
    earningId: str
    workerId: str
    storagePath: str
    contentType: str
    ocrConfidence: Optional[float] = None
    extractedData: Optional[Dict[str, Any]] = None
    isHumanVerified: bool = False  # Clearly distinguishing OCR from human verification
    createdAt: str


class SubmitVerificationReviewRequest(BaseModel):
    earningId: str
    decision: str  # 'approve', 'flag_discrepancy', 'mark_unverifiable'
    notes: str = Field(min_length=5)
    discrepancyReason: Optional[str] = None
    verifiedGrossAmount: Optional[float] = None
    verifiedNetAmount: Optional[float] = None
    verifiedHoursWorked: Optional[float] = None

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: str) -> str:
        valid = ["approve", "flag_discrepancy", "mark_unverifiable"]
        if v.lower() not in valid:
            raise ValueError(f"Invalid decision '{v}'. Allowed: {valid}")
        return v.lower()


class VerificationReviewResponse(BaseModel):
    id: str
    earningId: str
    verifierId: str
    previousStatus: str
    newStatus: str
    decision: str
    notes: str
    discrepancyReason: Optional[str] = None
    verifiedGrossAmount: Optional[float] = None
    verifiedNetAmount: Optional[float] = None
    verifiedHoursWorked: Optional[float] = None
    createdAt: str


class VerificationQueueItem(BaseModel):
    earningId: str
    workerId: str
    platform: str
    shiftDate: str
    hoursWorked: float
    grossAmount: float
    netAmount: float
    evidenceCount: int
    submittedAt: str
    status: str
    flaggedByAnomaly: bool = False


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "earnings"
    version: str = "0.1.0"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReadyResponse(BaseModel):
    status: str
    service: str = "earnings"
    database: str
    databaseEngine: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
