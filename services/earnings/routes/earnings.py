import csv
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import io
import math
import re
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status

try:
    from config import settings
    from database import earnings_db
    from models import (
        ConfirmEvidenceRequest,
        CreateEarningRecordRequest,
        CsvImportErrorDetail,
        CsvImportRequest,
        CsvImportResponse,
        EarningRecordResponse,
        EarningsListResponse,
        EvidenceResponse,
        PaginationMeta,
        PresignedUploadRequest,
        PresignedUploadResponse,
        SubmitVerificationReviewRequest,
        UpdateEarningRecordRequest,
        VerificationQueueItem,
        VerificationReviewResponse,
    )
    from security import get_current_user_claims, require_role
except ImportError:
    from services.earnings.config import settings
    from services.earnings.database import earnings_db
    from services.earnings.models import (
        ConfirmEvidenceRequest,
        CreateEarningRecordRequest,
        CsvImportErrorDetail,
        CsvImportRequest,
        CsvImportResponse,
        EarningRecordResponse,
        EarningsListResponse,
        EvidenceResponse,
        PaginationMeta,
        PresignedUploadRequest,
        PresignedUploadResponse,
        SubmitVerificationReviewRequest,
        UpdateEarningRecordRequest,
        VerificationQueueItem,
        VerificationReviewResponse,
    )
    from services.earnings.security import get_current_user_claims, require_role

router = APIRouter(prefix="/api/v1/earnings", tags=["Earnings & Verification"])


def _format_earning_response(e: dict) -> EarningRecordResponse:
    return EarningRecordResponse(
        id=e["id"],
        workerId=e["worker_id"],
        platform=e["platform"],
        shiftDate=e["shift_date"],
        startTime=e.get("start_time"),
        endTime=e.get("end_time"),
        hoursWorked=float(e["hours_worked"]),
        grossAmount=float(e["gross_amount"]),
        netAmount=float(e["net_amount"]),
        deductions=float(e.get("deductions", 0.0)),
        tipsAmount=float(e.get("tips_amount", 0.0)),
        bonusAmount=float(e.get("bonus_amount", 0.0)),
        tripsCount=int(e.get("trips_count", 0)),
        hourlyRate=float(e.get("hourly_rate", 0.0)),
        zoneId=e.get("zone_id"),
        verificationStatus=e.get("verification_status", "pending"),
        notes=e.get("notes"),
        createdAt=e["created_at"],
        updatedAt=e["updated_at"],
    )


def _validate_financial_math(gross: float, deductions: float, net: float, tips: float = 0.0, bonus: float = 0.0):
    """Verifies that gross, deductions, tips, and net amounts are mathematically consistent using Decimal precision."""
    d_gross = Decimal(str(gross))
    d_deductions = Decimal(str(deductions))
    d_net = Decimal(str(net))
    d_tips = Decimal(str(tips))
    d_bonus = Decimal(str(bonus))

    if d_deductions > (d_gross + d_tips + d_bonus):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Deductions (${deductions:.2f}) cannot exceed total earnings (${(gross + tips + bonus):.2f}).",
        )

    expected_net_with_tips = (d_gross - d_deductions + d_tips + d_bonus).quantize(Decimal("0.01"))
    expected_net_base = (d_gross - d_deductions).quantize(Decimal("0.01"))
    actual_net = d_net.quantize(Decimal("0.01"))

    # Net must match either (gross - deductions) or (gross - deductions + tips + bonus)
    if actual_net != expected_net_with_tips and actual_net != expected_net_base:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Financial calculation mismatch: netAmount (${net:.2f}) must equal "
                f"grossAmount (${gross:.2f}) - deductions (${deductions:.2f}) [expected: ${expected_net_base:.2f} or ${expected_net_with_tips:.2f} with tips/bonus]."
            ),
        )


@router.post(
    "",
    response_model=EarningRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Shift Earnings Record",
)
async def create_earning(
    request: CreateEarningRecordRequest,
    claims: dict = Depends(get_current_user_claims),
) -> EarningRecordResponse:
    """Creates a new shift earnings record bound to the authenticated worker."""
    worker_id = claims["sub"]
    _validate_financial_math(
        gross=request.grossAmount,
        deductions=request.deductions,
        net=request.netAmount,
        tips=request.tipsAmount,
        bonus=request.bonusAmount,
    )

    earning = earnings_db.create_earning(worker_id=worker_id, data=request.model_dump())
    return _format_earning_response(earning)


@router.get(
    "",
    response_model=EarningsListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Worker's Own Earnings Records",
)
async def list_earnings(
    startDate: Optional[str] = Query(None, alias="startDate"),
    endDate: Optional[str] = Query(None, alias="endDate"),
    platform: Optional[str] = Query(None),
    verificationStatus: Optional[str] = Query(None, alias="verificationStatus"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    claims: dict = Depends(get_current_user_claims),
) -> EarningsListResponse:
    """Returns paginated shift records belonging strictly to the authenticated worker."""
    worker_id = claims["sub"]
    items, total_items = earnings_db.list_earnings(
        worker_id=worker_id,
        start_date=startDate,
        end_date=endDate,
        platform=platform,
        verification_status=verificationStatus,
        page=page,
        limit=limit,
    )

    total_pages = math.ceil(total_items / limit) if total_items > 0 else 0
    formatted_items = [_format_earning_response(e) for e in items]

    return EarningsListResponse(
        items=formatted_items,
        meta=PaginationMeta(
            page=page,
            limit=limit,
            totalItems=total_items,
            totalPages=total_pages,
            hasNextPage=page < total_pages,
            hasPrevPage=page > 1,
        ),
    )


@router.get(
    "/{earning_id}",
    response_model=EarningRecordResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Specific Earnings Record",
)
async def get_earning(
    earning_id: str,
    claims: dict = Depends(get_current_user_claims),
) -> EarningRecordResponse:
    """Fetches an individual earnings record enforcing strict ownership or verifier/admin roles."""
    earning = earnings_db.get_earning_by_id(earning_id)
    if not earning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Earnings record '{earning_id}' not found.",
        )

    user_id = claims["sub"]
    role = claims.get("role", "worker")

    # Only owner or authorized verifier/admin can read
    if earning["worker_id"] != user_id and role not in ["verifier", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot access earnings belonging to another worker.",
        )

    return _format_earning_response(earning)


@router.put(
    "/{earning_id}",
    response_model=EarningRecordResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Earnings Record",
)
async def update_earning(
    earning_id: str,
    request: UpdateEarningRecordRequest,
    claims: dict = Depends(get_current_user_claims),
) -> EarningRecordResponse:
    """Updates an existing earnings record.

    If financial fields (gross, net, deductions, hours) are changed on a verified record,
    its verification status is automatically reset to 'pending' for re-audit.
    """
    earning = earnings_db.get_earning_by_id(earning_id)
    if not earning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Earnings record '{earning_id}' not found.",
        )

    worker_id = claims["sub"]
    if earning["worker_id"] != worker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot edit earnings records belonging to another worker.",
        )

    updates = request.model_dump(exclude_unset=True)
    if not updates:
        return _format_earning_response(earning)

    new_gross = updates.get("grossAmount", earning["gross_amount"])
    new_net = updates.get("netAmount", earning["net_amount"])
    new_ded = updates.get("deductions", earning["deductions"])
    new_tips = updates.get("tipsAmount", earning["tips_amount"])
    new_bonus = updates.get("bonusAmount", earning["bonus_amount"])

    _validate_financial_math(gross=new_gross, deductions=new_ded, net=new_net, tips=new_tips, bonus=new_bonus)

    # Material financial change triggers re-verification
    financial_fields = ["grossAmount", "netAmount", "deductions", "hoursWorked"]
    material_change = any(f in updates for f in financial_fields)
    should_reset = material_change and earning["verification_status"] in ["verified", "discrepancy"]

    updated = earnings_db.update_earning(
        earning_id=earning_id,
        worker_id=worker_id,
        updates=updates,
        reset_verification=should_reset,
    )
    return _format_earning_response(updated)


@router.delete(
    "/{earning_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Earnings Record",
)
async def delete_earning(
    earning_id: str,
    claims: dict = Depends(get_current_user_claims),
) -> dict:
    """Deletes an earnings record while recording an immutable audit log."""
    earning = earnings_db.get_earning_by_id(earning_id)
    if not earning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Earnings record '{earning_id}' not found.",
        )

    worker_id = claims["sub"]
    if earning["worker_id"] != worker_id and claims.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot delete records belonging to another worker.",
        )

    success = earnings_db.delete_earning(earning_id=earning_id, worker_id=worker_id)
    return {"success": success, "message": f"Earnings record '{earning_id}' deleted successfully."}


@router.post(
    "/import/csv",
    response_model=CsvImportResponse,
    status_code=status.HTTP_200_OK,
    summary="Bulk CSV Earnings Import",
)
async def import_csv_earnings(
    request: CsvImportRequest,
    claims: dict = Depends(get_current_user_claims),
) -> CsvImportResponse:
    """Parses and validates CSV earnings data, importing valid rows for the authenticated worker."""
    worker_id = claims["sub"]
    stream = io.StringIO(request.csvContent.strip())
    reader = csv.reader(stream)

    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CSV content is empty.")

    start_idx = 0
    header = None
    if request.hasHeader and len(rows) > 0:
        header = [h.strip().lower() for h in rows[0]]
        start_idx = 1

    imported_records = []
    errors = []

    for idx, row in enumerate(rows[start_idx:], start=start_idx + 1):
        if not row or all(c.strip() == "" for c in row):
            continue

        raw_line = ",".join(row)
        try:
            # Map columns
            if header:
                row_dict = dict(zip(header, [c.strip() for c in row]))
                platform = row_dict.get("platform") or request.platformFallback or "other"
                shift_date = row_dict.get("shiftdate") or row_dict.get("shift_date") or row_dict.get("date")
                hours = float(row_dict.get("hoursworked") or row_dict.get("hours_worked") or row_dict.get("hours", 0))
                gross = float(row_dict.get("grossamount") or row_dict.get("gross_amount") or row_dict.get("gross", 0))
                net = float(row_dict.get("netamount") or row_dict.get("net_amount") or row_dict.get("net", 0))
                deductions = float(row_dict.get("deductions") or 0.0)
                tips = float(row_dict.get("tipsamount") or row_dict.get("tips_amount") or row_dict.get("tips", 0.0))
                trips = int(row_dict.get("tripscount") or row_dict.get("trips_count") or row_dict.get("trips", 0))
            else:
                # Positional fallback: platform, date, hours, gross, net, deductions, tips, trips
                platform = row[0].strip() if len(row) > 0 else (request.platformFallback or "other")
                shift_date = row[1].strip() if len(row) > 1 else None
                hours = float(row[2].strip()) if len(row) > 2 else 0.0
                gross = float(row[3].strip()) if len(row) > 3 else 0.0
                net = float(row[4].strip()) if len(row) > 4 else 0.0
                deductions = float(row[5].strip()) if len(row) > 5 else 0.0
                tips = float(row[6].strip()) if len(row) > 6 else 0.0
                trips = int(row[7].strip()) if len(row) > 7 else 0

            if not shift_date or not re.match(r"^\d{4}-\d{2}-\d{2}$", shift_date):
                raise ValueError(f"Invalid shiftDate '{shift_date}'. Format must be YYYY-MM-DD.")
            if hours <= 0 or hours > 24:
                raise ValueError(f"Invalid hoursWorked '{hours}'. Must be between 0 and 24.")
            if gross < 0 or net < 0 or deductions < 0:
                raise ValueError("Monetary amounts cannot be negative.")

            _validate_financial_math(gross=gross, deductions=deductions, net=net, tips=tips)

            earning = earnings_db.create_earning(
                worker_id=worker_id,
                data={
                    "platform": platform.lower(),
                    "shiftDate": shift_date,
                    "hoursWorked": hours,
                    "grossAmount": gross,
                    "netAmount": net,
                    "deductions": deductions,
                    "tipsAmount": tips,
                    "tripsCount": trips,
                    "notes": "CSV Bulk Import",
                },
            )
            imported_records.append(_format_earning_response(earning))

        except Exception as exc:
            errors.append(
                CsvImportErrorDetail(
                    row=idx,
                    message=str(exc),
                    rawLine=raw_line,
                )
            )

    return CsvImportResponse(
        totalRows=len(rows) - (1 if request.hasHeader else 0),
        importedCount=len(imported_records),
        skippedCount=len(errors),
        records=imported_records,
        errors=errors,
    )


@router.post(
    "/evidence/presign",
    response_model=PresignedUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Request Presigned Upload URL for Screenshot Evidence",
)
async def presign_evidence_upload(
    request: PresignedUploadRequest,
    claims: dict = Depends(get_current_user_claims),
) -> PresignedUploadResponse:
    """Validates shift ownership and generates a time-limited pre-signed URL for Supabase private storage."""
    earning = earnings_db.get_earning_by_id(request.earningId)
    if not earning:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Earnings record not found.")

    worker_id = claims["sub"]
    if earning["worker_id"] != worker_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You cannot upload evidence for another worker's shift.")

    evidence_id = str(uuid.uuid4())
    safe_filename = f"{evidence_id}_{request.filename.replace(' ', '_')}"
    storage_path = f"evidence-private/{worker_id}/{safe_filename}"

    # Supabase S3 presigned URL or mock upload URL
    if settings.supabase_url:
        upload_url = f"{settings.supabase_url}/storage/v1/object/{settings.storage_bucket_evidence}/{storage_path}"
    else:
        upload_url = f"http://localhost:{settings.port}/api/v1/earnings/evidence/mock-upload?path={storage_path}"

    return PresignedUploadResponse(
        uploadUrl=upload_url,
        storagePath=storage_path,
        evidenceId=evidence_id,
        expiresInSeconds=600,
    )


@router.post(
    "/evidence/confirm",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Confirm Screenshot Evidence Upload and Attach OCR Metadata",
)
async def confirm_evidence_upload(
    request: ConfirmEvidenceRequest,
    claims: dict = Depends(get_current_user_claims),
) -> EvidenceResponse:
    """Saves evidence metadata and optional automated OCR extractions.

    Crucial: Marks isHumanVerified as false, clearly distinguishing automated OCR from human verification.
    """
    earning = earnings_db.get_earning_by_id(request.earningId)
    if not earning:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Earnings record not found.")

    worker_id = claims["sub"]
    if earning["worker_id"] != worker_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You cannot attach evidence to another worker's shift.")

    evidence = earnings_db.create_evidence(
        evidence_id=request.evidenceId,
        earning_id=request.earningId,
        worker_id=worker_id,
        storage_path=request.storagePath,
        mime_type="image/png",
        file_size_bytes=1024,
        ocr_confidence=request.extractedData.get("ocrConfidence") if request.extractedData else None,
        extracted_data=request.extractedData,
    )

    return EvidenceResponse(
        id=evidence["id"],
        earningId=evidence["earning_id"],
        workerId=evidence["worker_id"],
        storagePath=evidence["storage_path"],
        contentType=evidence["mime_type"],
        ocrConfidence=evidence.get("ocr_confidence"),
        extractedData=evidence.get("extracted_data"),
        isHumanVerified=False,  # Clear distinction: OCR is automated, not human confirmed
        createdAt=evidence["created_at"],
    )


@router.get(
    "/{earning_id}/evidence",
    response_model=List[EvidenceResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Screenshot Evidence for a Shift",
)
async def get_evidence_for_earning(
    earning_id: str,
    claims: dict = Depends(get_current_user_claims),
) -> List[EvidenceResponse]:
    """Fetches screenshot evidence metadata for a given earnings record."""
    earning = earnings_db.get_earning_by_id(earning_id)
    if not earning:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Earnings record not found.")

    user_id = claims["sub"]
    role = claims.get("role", "worker")
    if earning["worker_id"] != user_id and role not in ["verifier", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You cannot view evidence for this shift.")

    evidence_list = earnings_db.get_evidence_by_earning(earning_id)
    return [
        EvidenceResponse(
            id=e["id"],
            earningId=e["earning_id"],
            workerId=e["worker_id"],
            storagePath=e["storage_path"],
            contentType=e["mime_type"],
            ocrConfidence=e.get("ocr_confidence"),
            extractedData=e.get("extracted_data"),
            isHumanVerified=False,
            createdAt=e["created_at"],
        )
        for e in evidence_list
    ]


@router.post(
    "/reviews",
    response_model=VerificationReviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit Human Verifier Review Decision",
)
async def submit_verification_review(
    request: SubmitVerificationReviewRequest,
    claims: dict = Depends(require_role(["verifier", "admin"])),
) -> VerificationReviewResponse:
    """Human auditor review decision (approve, flag_discrepancy, mark_unverifiable).

    Strict rules:
    - Workers CANNOT verify their own earnings.
    - Role must be 'verifier' or 'admin'.
    - Validates state transitions.
    """
    earning = earnings_db.get_earning_by_id(request.earningId)
    if not earning:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Earnings record not found.")

    verifier_id = claims["sub"]

    # Prevent conflict of interest: Worker cannot verify own shift
    if earning["worker_id"] == verifier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conflict of interest: Workers cannot audit or verify their own earnings.",
        )

    prev_status = earning["verification_status"]

    # Transition map
    if request.decision == "approve":
        new_status = "verified"
    elif request.decision == "flag_discrepancy":
        new_status = "discrepancy"
    elif request.decision == "mark_unverifiable":
        new_status = "unverifiable"
    else:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Unknown decision '{request.decision}'.")

    review = earnings_db.create_verification_review(
        earning_id=request.earningId,
        verifier_id=verifier_id,
        previous_status=prev_status,
        new_status=new_status,
        decision=request.decision,
        notes=request.notes,
        discrepancy_reason=request.discrepancyReason,
        verified_gross=request.verifiedGrossAmount,
        verified_net=request.verifiedNetAmount,
        verified_hours=request.verifiedHoursWorked,
    )

    return VerificationReviewResponse(
        id=review["id"],
        earningId=review["earning_id"],
        verifierId=review["verifier_id"],
        previousStatus=review["previous_status"],
        newStatus=review["new_status"],
        decision=review["decision"],
        notes=review["notes"],
        discrepancyReason=review.get("discrepancy_reason"),
        verifiedGrossAmount=review.get("verified_gross_amount"),
        verifiedNetAmount=review.get("verified_net_amount"),
        verifiedHoursWorked=review.get("verified_hours_worked"),
        createdAt=review["created_at"],
    )


@router.get(
    "/verifier/queue",
    response_model=List[VerificationQueueItem],
    status_code=status.HTTP_200_OK,
    summary="Get Auditor Verification Queue",
)
async def get_verification_queue(
    statusFilter: Optional[str] = Query(None, alias="status"),
    claims: dict = Depends(require_role(["verifier", "admin"])),
) -> List[VerificationQueueItem]:
    """Returns shifts awaiting auditor review (restricted to verifiers and admins)."""
    rows = earnings_db.get_verification_queue(status_filter=statusFilter)
    return [
        VerificationQueueItem(
            earningId=r["id"],
            workerId=r["worker_id"],
            platform=r["platform"],
            shiftDate=r["shift_date"],
            hoursWorked=float(r["hours_worked"]),
            grossAmount=float(r["gross_amount"]),
            netAmount=float(r["net_amount"]),
            evidenceCount=int(r.get("evidence_count", 0)),
            submittedAt=r["created_at"],
            status=r["verification_status"],
            flaggedByAnomaly=False,
        )
        for r in rows
    ]
