# FairGig — Complete API Contracts Specification

**Version:** 0.1.0  
**Status:** Approved for Phase 0  
**Standard Port Allocations:**
- `services/auth`: `http://localhost:8001`
- `services/earnings`: `http://localhost:8002`
- `services/anomaly`: `http://localhost:8003`
- `services/analytics`: `http://localhost:8004`
- `services/grievance`: `http://localhost:4001`
- `services/certificate`: `http://localhost:4002`
- `apps/web`: `http://localhost:3000`

---

## 1. Global Standards & Protocols

### 1.1 Headers
All authenticated requests must pass the Bearer JWT:
```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
Accept: application/json
```

### 1.2 Unified Error Envelope (RFC 7807 Inspired)
All 4xx and 5xx responses conform to this JSON schema:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Input payload failed validation rules.",
    "details": [
      {
        "field": "grossAmount",
        "message": "grossAmount must be greater than or equal to netAmount",
        "code": "INVALID_AMOUNT"
      }
    ],
    "timestamp": "2026-10-14T12:00:00.000Z"
  }
}
```

### 1.3 Role Authorization Model
- `worker`: Standard gig worker. Can log shifts, import CSVs, upload screenshots, run personal anomaly analysis, file grievances, view own certificates.
- `verifier`: Auditor. Can inspect verification queue, review evidence OCR, approve, flag discrepancies, or mark unverifiable.
- `advocate`: Organizer/analyst. Can view grievance clusters, escalate collective actions, view privacy-preserving k-anonymity aggregate analytics.
- `admin`: Platform maintainer.

---

## 2. Service 1: Auth Service (`:8001`)

### 2.1 Health Check
- **Endpoint:** `GET /health`
- **Auth:** None
- **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "auth",
  "version": "0.1.0",
  "timestamp": "2026-10-14T12:00:00.000Z"
}
```

### 2.2 Worker Registration
- **Endpoint:** `POST /api/v1/auth/register`
- **Auth:** None (Public)
- **Rules:** Public registration automatically binds `role: "worker"`. Verifier and advocate privileges can NEVER be self-assigned.
- **Request (201 Created):**
```json
{
  "email": "worker.maria@example.com",
  "password": "StrongPassword123",
  "fullName": "Maria Santos",
  "phoneNumber": "+12065550199",
  "cityId": "11111111-1111-1111-1111-111111111111",
  "primaryPlatform": "uber"
}
```
- **Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "fg_rf_a8b9c0d1e2f3a4b5c6d7e8f9...",
  "tokenType": "Bearer",
  "expiresInSeconds": 900,
  "user": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "worker.maria@example.com",
    "fullName": "Maria Santos",
    "role": "worker",
    "phoneNumber": "+12065550199",
    "cityId": "11111111-1111-1111-1111-111111111111",
    "primaryPlatform": "uber",
    "isEmailVerified": false,
    "createdAt": "2026-10-14T12:00:00.000Z",
    "updatedAt": "2026-10-14T12:00:00.000Z"
  }
}
```

### 2.3 User Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** None
- **Request:**
```json
{
  "email": "worker.maria@example.com",
  "password": "StrongPassword123"
}
```
- **Response (200 OK):** Identical to `AuthTokenResponse`.

### 2.4 Token Refresh (Rotation)
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Auth:** None (Refresh Token in body)
- **Request:**
```json
{
  "refreshToken": "fg_rf_a8b9c0d1e2f3a4b5c6d7e8f9..."
}
```
- **Response (200 OK):** Fresh `accessToken` and a newly rotated `refreshToken`.

---

## 3. Service 2: Earnings Service (`:8002`)

### 3.1 Create Earnings Record
- **Endpoint:** `POST /api/v1/earnings`
- **Auth:** Required (`worker`)
- **Request:**
```json
{
  "platform": "uber",
  "shiftDate": "2026-10-13",
  "startTime": "2026-10-13T08:00:00Z",
  "endTime": "2026-10-13T16:00:00Z",
  "hoursWorked": 8.0,
  "grossAmount": 210.50,
  "netAmount": 168.40,
  "deductions": 42.10,
  "tipsAmount": 35.00,
  "bonusAmount": 10.00,
  "tripsCount": 14,
  "zoneId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "notes": "Rainy weekday rush hour"
}
```
- **Response (201 Created):**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "workerId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "platform": "uber",
  "shiftDate": "2026-10-13",
  "startTime": "2026-10-13T08:00:00Z",
  "endTime": "2026-10-13T16:00:00Z",
  "hoursWorked": 8.0,
  "grossAmount": 210.50,
  "netAmount": 168.40,
  "deductions": 42.10,
  "tipsAmount": 35.00,
  "bonusAmount": 10.00,
  "tripsCount": 14,
  "hourlyRate": 21.05,
  "zoneId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "verificationStatus": "pending",
  "notes": "Rainy weekday rush hour",
  "createdAt": "2026-10-14T12:05:00.000Z",
  "updatedAt": "2026-10-14T12:05:00.000Z"
}
```

### 3.2 CSV Earnings Bulk Import
- **Endpoint:** `POST /api/v1/earnings/import/csv`
- **Auth:** Required (`worker`)
- **Request:**
```json
{
  "hasHeader": true,
  "platformFallback": "doordash",
  "csvContent": "platform,shiftDate,hoursWorked,grossAmount,netAmount,deductions,tipsAmount,tripsCount\ndoordash,2026-10-10,5.5,145.00,120.00,25.00,30.00,8\ndoordash,2026-10-11,6.0,160.00,135.00,25.00,25.00,10"
}
```
- **Response (200 OK):**
```json
{
  "totalRows": 2,
  "importedCount": 2,
  "skippedCount": 0,
  "records": [
    {
      "id": "11111111-2222-3333-4444-555555555555",
      "workerId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "platform": "doordash",
      "shiftDate": "2026-10-10",
      "hoursWorked": 5.5,
      "grossAmount": 145.00,
      "netAmount": 120.00,
      "deductions": 25.00,
      "tipsAmount": 30.00,
      "bonusAmount": 0.00,
      "tripsCount": 8,
      "hourlyRate": 21.82,
      "verificationStatus": "pending",
      "createdAt": "2026-10-14T12:10:00.000Z",
      "updatedAt": "2026-10-14T12:10:00.000Z"
    }
  ],
  "errors": []
}
```

### 3.3 Presigned Screenshot Evidence Upload
- **Endpoint:** `POST /api/v1/earnings/evidence/presign`
- **Auth:** Required (`worker`)
- **Request:**
```json
{
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "filename": "uber_weekly_statement_oct13.png",
  "contentType": "image/png",
  "fileSizeBytes": 1420500
}
```
- **Response (200 OK):**
```json
{
  "uploadUrl": "https://xyz.supabase.co/storage/v1/s3/evidence-private/9b1deb4d/proof_123.png?signed=true",
  "storagePath": "evidence-private/9b1deb4d/proof_123.png",
  "evidenceId": "33333333-4444-5555-6666-777777777777",
  "expiresInSeconds": 600
}
```

### 3.4 Confirm Screenshot Evidence Upload
- **Endpoint:** `POST /api/v1/earnings/evidence/confirm`
- **Auth:** Required (`worker`)
- **Request:**
```json
{
  "evidenceId": "33333333-4444-5555-6666-777777777777",
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "storagePath": "evidence-private/9b1deb4d/proof_123.png",
  "extractedData": {
    "detectedPlatform": "uber",
    "detectedAmount": 210.50,
    "detectedDate": "2026-10-13",
    "ocrConfidence": 0.94
  }
}
```
- **Response (201 Created):**
```json
{
  "id": "33333333-4444-5555-6666-777777777777",
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "workerId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "storagePath": "evidence-private/9b1deb4d/proof_123.png",
  "contentType": "image/png",
  "ocrConfidence": 0.94,
  "extractedData": {
    "detectedPlatform": "uber",
    "detectedAmount": 210.50,
    "detectedDate": "2026-10-13"
  },
  "createdAt": "2026-10-14T12:12:00.000Z"
}
```

### 3.5 Verifier Review Decisions & Status Transitions
- **Endpoint:** `POST /api/v1/earnings/reviews`
- **Auth:** Required (`verifier`, `admin`)
- **State Transition Validations:**
  - `pending` -> `verified` (Decision: `approve`)
  - `pending` -> `discrepancy` (Decision: `flag_discrepancy`)
  - `pending` -> `unverifiable` (Decision: `mark_unverifiable`)
  - `discrepancy` -> `verified` (Upon re-audit with supplemental evidence)

#### Decision Case A: Approval
- **Request:**
```json
{
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "decision": "approve",
  "notes": "Verified against high-resolution screenshot statement. Line items match exactly."
}
```
- **Response (200 OK):**
```json
{
  "id": "44444444-5555-6666-7777-888888888888",
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "verifierId": "55555555-6666-7777-8888-999999999999",
  "previousStatus": "pending",
  "newStatus": "verified",
  "decision": "approve",
  "notes": "Verified against high-resolution screenshot statement. Line items match exactly.",
  "createdAt": "2026-10-14T12:15:00.000Z"
}
```

#### Decision Case B: Discrepancy
- **Request:**
```json
{
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "decision": "flag_discrepancy",
  "notes": "Statement shows net payout of $142.10, but shift record claims $168.40. $26.30 unexplained deficit.",
  "discrepancyReason": "amount_mismatch",
  "verifiedNetAmount": 142.10
}
```
- **Response (200 OK):**
```json
{
  "id": "44444444-5555-6666-7777-888888888888",
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "verifierId": "55555555-6666-7777-8888-999999999999",
  "previousStatus": "pending",
  "newStatus": "discrepancy",
  "decision": "flag_discrepancy",
  "notes": "Statement shows net payout of $142.10, but shift record claims $168.40. $26.30 unexplained deficit.",
  "discrepancyReason": "amount_mismatch",
  "verifiedNetAmount": 142.10,
  "createdAt": "2026-10-14T12:16:00.000Z"
}
```

#### Decision Case C: Unverifiable
- **Request:**
```json
{
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "decision": "mark_unverifiable",
  "notes": "Screenshot is blurry and cropped so date and platform logos are illegible.",
  "discrepancyReason": "illegible_proof"
}
```
- **Response (200 OK):**
```json
{
  "id": "44444444-5555-6666-7777-888888888888",
  "earningId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "verifierId": "55555555-6666-7777-8888-999999999999",
  "previousStatus": "pending",
  "newStatus": "unverifiable",
  "decision": "mark_unverifiable",
  "notes": "Screenshot is blurry and cropped so date and platform logos are illegible.",
  "discrepancyReason": "illegible_proof",
  "createdAt": "2026-10-14T12:17:00.000Z"
}
```

---

## 4. Service 3: Deterministic Anomaly Detection (`:8003`)

### 4.1 Standalone Deterministic Anomaly Detection
- **Endpoint:** `POST /api/v1/anomaly/analyze`
- **Auth:** None / Optional (Supports both direct payload evaluation in UI and server batch runs)
- **Mathematical Specification & Edge Cases:**
  1. **Statistical Deduction Outlier:**
     - Given historical shifts $S_1, ..., S_n$ ($n \ge 3$), compute historical deduction ratio $r_i = \text{deductions}_i / \text{gross}_i$.
     - Sample Mean: $\mu_r = \frac{1}{n} \sum r_i$, Standard Deviation: $\sigma_r = \sqrt{\frac{1}{n}\sum (r_i - \mu_r)^2}$.
     - Outlier Rule: $z = \frac{r_{\text{target}} - \mu_r}{\sigma_r}$. If $z \ge 2.0$, flag as `deduction_outlier` (Warning if $2.0 \le z < 3.0$, Critical if $z \ge 3.0$).
     - Edge Case ($n < 3$): Fall back to deterministic platform cap threshold ($r_{\text{target}} > 0.30$).
  2. **Sudden Income Drop Detection:**
     - Effective Hourly Rate: $R = \text{netAmount} / \text{hoursWorked}$.
     - Drop Percentage: $\Delta\% = \frac{R_{\text{baseline}} - R_{\text{target}}}{R_{\text{baseline}}} \times 100\%$.
     - Outlier Rule: If $\Delta\% \ge 40.0\%$, flag as `sudden_income_drop` (Warning if $40\% \le \Delta\% < 60\%$, Critical if $\Delta\% \ge 60\%$).
  3. **Sub-Minimum Wage Deficit:**
     - Statutory City Floor: $W_{\text{min}}$ (e.g. $19.97/hr in Seattle).
     - If $R_{\text{target}} < W_{\text{min}}$, flag as `hourly_rate_deficit`.

- **Sample Request (Standalone JSON):**
```json
{
  "targetShift": {
    "shiftDate": "2026-10-13",
    "hoursWorked": 8.0,
    "grossAmount": 160.00,
    "netAmount": 88.00,
    "deductions": 72.00,
    "tipsAmount": 10.00,
    "tripsCount": 9
  },
  "historicalShifts": [
    {
      "shiftDate": "2026-10-06",
      "hoursWorked": 8.0,
      "grossAmount": 200.00,
      "netAmount": 170.00,
      "deductions": 30.00,
      "tipsAmount": 20.00,
      "tripsCount": 12
    },
    {
      "shiftDate": "2026-10-07",
      "hoursWorked": 7.5,
      "grossAmount": 190.00,
      "netAmount": 161.50,
      "deductions": 28.50,
      "tipsAmount": 18.00,
      "tripsCount": 11
    },
    {
      "shiftDate": "2026-10-08",
      "hoursWorked": 8.5,
      "grossAmount": 220.00,
      "netAmount": 187.00,
      "deductions": 33.00,
      "tipsAmount": 25.00,
      "tripsCount": 13
    }
  ],
  "platform": "uber",
  "cityMinimumHourlyWage": 19.97,
  "thresholds": {
    "maxDeductionRatio": 0.30,
    "deductionZScoreThreshold": 2.0,
    "incomeDropPercentageThreshold": 40.0,
    "minimumBaselineShifts": 3
  }
}
```

- **Sample Response (200 OK):**
```json
{
  "isAnomaly": true,
  "anomalyScore": 0.95,
  "riskLevel": "critical",
  "targetHourlyRate": 11.00,
  "targetDeductionRatio": 0.45,
  "baselineAverageHourlyRate": 21.67,
  "baselineAverageDeductionRatio": 0.15,
  "anomaliesDetected": [
    {
      "type": "deduction_outlier",
      "severity": "critical",
      "name": "Statistical Deduction Outlier",
      "description": "Deduction ratio 45.0% is 6.00 standard deviations above baseline average (15.0%).",
      "observedValue": 0.45,
      "expectedThreshold": 0.25,
      "delta": 0.30,
      "unit": "ratio",
      "explanation": "The platform deducted $72.00 out of $160.00. Historical average deduction is 15.0%.",
      "suggestedAction": "Submit grievance with pay stub screenshot for verifier audit."
    },
    {
      "type": "sudden_income_drop",
      "severity": "warning",
      "name": "Sudden Hourly Rate Collapse",
      "description": "Effective rate of $11.00/hr is a 49.2% drop below historical average of $21.67/hr.",
      "observedValue": 11.00,
      "expectedThreshold": 13.00,
      "delta": -10.67,
      "unit": "USD/hour",
      "explanation": "Sharp drop indicates abnormal unpaid idle periods or uncredited trip incentives.",
      "suggestedAction": "Verify logged shift start/end timestamps and compare trip records."
    },
    {
      "type": "hourly_rate_deficit",
      "severity": "critical",
      "name": "Sub-Minimum Wage Rate",
      "description": "Net rate of $11.00/hr fell below municipal minimum wage of $19.97/hr.",
      "observedValue": 11.00,
      "expectedThreshold": 19.97,
      "delta": -8.97,
      "unit": "USD/hour",
      "explanation": "Worker experienced a net deficit of $8.97/hr against statutory minimum floor.",
      "suggestedAction": "File an underpayment grievance for advocate cluster review."
    }
  ],
  "evaluatedAt": "2026-10-14T12:20:00.000Z",
  "deterministicRulesApplied": [
    "RULE_STATISTICAL_DEDUCTION_OUTLIER",
    "RULE_SUDDEN_INCOME_DROP",
    "RULE_SUB_MINIMUM_WAGE_DEFICIT"
  ]
}
```

---

## 5. Service 4: Analytics Service (`:8004`)

### 5.1 Worker Personal Analytics
- **Endpoint:** `GET /api/v1/analytics/worker?timeframe=last_30_days`
- **Auth:** Required (`worker`)
- **Response (200 OK):**
```json
{
  "workerId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timeframe": "last_30_days",
  "totalGrossEarnings": 3450.00,
  "totalNetEarnings": 2890.00,
  "totalDeductions": 560.00,
  "totalTips": 420.00,
  "totalHoursWorked": 142.5,
  "effectiveHourlyRate": 20.28,
  "shiftsLoggedCount": 22,
  "verifiedShiftsCount": 19,
  "verificationRate": 0.86,
  "platformBreakdown": [
    {
      "platform": "uber",
      "grossAmount": 2100.00,
      "netAmount": 1750.00,
      "hoursWorked": 85.0,
      "hourlyRate": 20.59,
      "shiftsCount": 13
    },
    {
      "platform": "doordash",
      "grossAmount": 1350.00,
      "netAmount": 1140.00,
      "hoursWorked": 57.5,
      "hourlyRate": 19.83,
      "shiftsCount": 9
    }
  ],
  "dailyEarningsTrend": [
    { "date": "2026-10-01", "amount": 145.00, "hours": 6.5 },
    { "date": "2026-10-02", "amount": 160.00, "hours": 7.0 }
  ]
}
```

### 5.2 Advocate Intelligence (Privacy-Preserving K-Anonymity)
- **Endpoint:** `GET /api/v1/analytics/advocate/overview`
- **Auth:** Required (`advocate`, `admin`)
- **Privacy Rule:** Minimum group size = 5. Any platform or zone cohort with fewer than 5 workers returns `isSuppressedForPrivacy: true` with all quantitative metrics suppressed as `null`.
- **Response (200 OK):**
```json
{
  "privacyMinimumThreshold": 5,
  "totalWorkersMonitored": 384,
  "totalShiftsAnalyzed": 4120,
  "totalDiscrepanciesIdentified": 248,
  "totalEstimatedLossClaimed": 34120.50,
  "platformComparison": [
    {
      "platform": "uber",
      "cityName": "Seattle",
      "workerSampleCount": 142,
      "isSuppressedForPrivacy": false,
      "averageHourlyRate": 21.40,
      "averageDeductionPercentage": 22.8,
      "discrepancyRate": 0.08,
      "topDisputeCategories": ["unexplained_deduction", "fare_underpayment"],
      "estimatedWageTheftTotal": 14200.00
    },
    {
      "platform": "deliveroo",
      "cityName": "Seattle",
      "workerSampleCount": 3,
      "isSuppressedForPrivacy": true,
      "averageHourlyRate": null,
      "averageDeductionPercentage": null,
      "discrepancyRate": null,
      "topDisputeCategories": [],
      "estimatedWageTheftTotal": null
    }
  ],
  "topGrievanceClusters": [
    {
      "clusterId": "66666666-7777-8888-9999-000000000000",
      "title": "Unexplained Surge Fee Clawbacks - October 2026",
      "platform": "uber",
      "affectedCount": 47,
      "estimatedLoss": 8940.00
    }
  ],
  "generatedAt": "2026-10-14T12:25:00.000Z"
}
```

---

## 6. Service 5: Grievance & Escalation Service (`:4001`)

### 6.1 Grievance Submission
- **Endpoint:** `POST /api/v1/grievances`
- **Auth:** Required (`worker`)
- **Request:**
```json
{
  "title": "Unexplained $42 commercial insurance deduction on 8hr shift",
  "description": "On October 13 shift, platform deducted $72 total including an unannounced $42 commercial insurance fee. My contracted vehicle fee is capped at $15/day.",
  "category": "unexplained_deduction",
  "platform": "uber",
  "priority": "high",
  "associatedEarningIds": ["7c9e6679-7425-40de-944b-e07fc1f90ae7"],
  "evidenceUrls": ["https://xyz.supabase.co/storage/v1/s3/evidence-private/9b1deb4d/proof_123.png"],
  "claimedLossAmount": 42.00
}
```
- **Response (201 Created):**
```json
{
  "id": "88888888-9999-0000-aaaa-bbbbbbbbbbbb",
  "workerId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "title": "Unexplained $42 commercial insurance deduction on 8hr shift",
  "description": "On October 13 shift, platform deducted $72 total including an unannounced $42 commercial insurance fee.",
  "category": "unexplained_deduction",
  "platform": "uber",
  "priority": "high",
  "status": "submitted",
  "claimedLossAmount": 42.00,
  "clusterId": null,
  "tags": ["unexplained_deduction", "insurance_fee", "uber"],
  "associatedEarningIds": ["7c9e6679-7425-40de-944b-e07fc1f90ae7"],
  "evidenceUrls": ["https://xyz.supabase.co/storage/v1/s3/evidence-private/9b1deb4d/proof_123.png"],
  "createdAt": "2026-10-14T12:30:00.000Z",
  "updatedAt": "2026-10-14T12:30:00.000Z"
}
```

### 6.2 Grievance Clustering & Escalation
- **Endpoint:** `POST /api/v1/grievances/escalate`
- **Auth:** Required (`advocate`, `admin`)
- **Request:**
```json
{
  "grievanceId": "88888888-9999-0000-aaaa-bbbbbbbbbbbb",
  "escalationReason": "Pattern detected: 47 workers affected by erroneous insurance deduction in Seattle zone.",
  "advocateNotes": "Preparing formal petition to Seattle Labor Standards enforcement bureau.",
  "targetRepresentative": "Seattle Office of Labor Standards"
}
```
- **Response (200 OK):**
```json
{
  "id": "88888888-9999-0000-aaaa-bbbbbbbbbbbb",
  "workerId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "title": "Unexplained $42 commercial insurance deduction on 8hr shift",
  "status": "escalated",
  "clusterId": "66666666-7777-8888-9999-000000000000",
  "escalatedAt": "2026-10-14T12:35:00.000Z",
  "escalatedToAdvocateId": "77777777-8888-9999-aaaa-cccccccccccc",
  "resolutionNotes": "Escalated to Seattle Office of Labor Standards under Cluster FG-CLUST-2026-44."
}
```

---

## 7. Service 6: Income Certificate Service (`:4002`)

### 7.1 Generate Printable Income Certificate
- **Endpoint:** `POST /api/v1/certificates/generate`
- **Auth:** Required (`worker`)
- **Request:**
```json
{
  "startDate": "2026-09-01",
  "endDate": "2026-09-30",
  "purpose": "housing_rental",
  "recipientName": "Cascade Ridge Apartments Leasing Office",
  "includePlatforms": ["uber", "doordash"]
}
```
- **Response (201 Created):**
```json
{
  "id": "99999999-aaaa-bbbb-cccc-dddddddddddd",
  "certificateNumber": "FG-2026-X89B",
  "workerId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "workerName": "Maria Santos",
  "purpose": "housing_rental",
  "recipientName": "Cascade Ridge Apartments Leasing Office",
  "periodStartDate": "2026-09-01",
  "periodEndDate": "2026-09-30",
  "totalGrossIncome": 4120.00,
  "totalNetIncome": 3480.00,
  "totalDeductions": 640.00,
  "totalHoursWorked": 164.0,
  "averageMonthlyIncome": 3480.00,
  "verifiedShiftsCount": 24,
  "unverifiedShiftsCount": 2,
  "verificationPercentage": 92.3,
  "cryptographicSignature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "publicVerificationUrl": "http://localhost:3000/verify/FG-2026-X89B?token=pub_tok_7f8a9b",
  "issuedAt": "2026-10-14T12:40:00.000Z",
  "expiresAt": "2027-01-14T12:40:00.000Z"
}
```

### 7.2 Public Tamper-Proof Certificate Verification
- **Endpoint:** `GET /api/v1/certificates/public-verify?certificateNumber=FG-2026-X89B&token=pub_tok_7f8a9b`
- **Auth:** None (Public for Landlords, Banks, Leasing Offices)
- **Response (200 OK):**
```json
{
  "isValid": true,
  "certificate": {
    "certificateNumber": "FG-2026-X89B",
    "workerName": "M***a S****s",
    "purpose": "housing_rental",
    "periodStartDate": "2026-09-01",
    "periodEndDate": "2026-09-30",
    "totalNetIncome": 3480.00,
    "totalHoursWorked": 164.0,
    "verificationPercentage": 92.3,
    "cryptographicSignature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "issuedAt": "2026-10-14T12:40:00.000Z",
    "expiresAt": "2027-01-14T12:40:00.000Z"
  },
  "message": "Certificate signature verified against FairGig PostgreSQL cryptographic ledger.",
  "verifiedAt": "2026-10-14T12:42:00.000Z"
}
```
