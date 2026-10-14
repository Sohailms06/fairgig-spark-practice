# FairGig — Technical Architecture Specification

**Version:** 0.1.0  
**Phase:** Phase 0 (Foundation)  
**Primary Architect:** Developer A  
**Frontend Lead:** Developer B  

---

## 1. System Vision & Architecture Paradigm

FairGig is a multi-platform income tracking, verification, rights advocacy, and anomaly detection platform designed for gig economy workers (rideshare drivers, meal delivery couriers, grocery shoppers). 

```
                                +---------------------------+
                                |  Developer B: Next.js 14   |
                                |  App Router Frontend      |
                                |  (:3000)                  |
                                +-------------+-------------+
                                              |
                          Shared REST API & JWT Bearer Auth
                                              |
         +-----------------+------------------+------------------+-----------------+
         |                 |                  |                  |                 |
         v                 v                  v                  v                 v
+-----------------+ +---------------+ +---------------+ +---------------+ +---------------+
| Auth Service    | | Earnings      | | Anomaly       | | Grievance     | | Certificate   |
| FastAPI (:8001) | | FastAPI (:8002| | FastAPI (:8003| | Node.js(:4001)| | Node.js(:4002)|
+--------+--------+ +-------+-------+ +-------+-------+ +-------+-------+ +-------+-------+
         |                  |                 |                 |                 |
         +------------------+--------+--------+-----------------+-----------------+
                                     |
                                     v
                        +----------------------------+
                        |   Supabase Infrastructure   |
                        |   - PostgreSQL 15+ (RLS)   |
                        |   - Private S3 Storage     |
                        |     (Screenshot Evidence)  |
                        +----------------------------+
```

### Key Architectural Principles
1. **Lightweight & Independent Service Scaffolds:** Each service has zero hard cross-dependencies. No Redis, RabbitMQ, Docker orchestration, or microservice mesh overhead is required for local hackathon development.
2. **Deterministic & Explainable Algorithms:** Anomaly detection avoids stochastic LLM hallucinations. All deduction outliers and income drops are calculated using closed-form statistical and threshold rules.
3. **Privacy by Design (K-Anonymity):** Collective advocacy queries require a minimum group size $k \ge 5$ workers to prevent re-identification of vulnerable workers.
4. **Strict Cryptographic Ledger:** Income certificates are signed with SHA-256 hashes and verifiable via unique public tokens without leaking personal identity or requiring external logins.

---

## 2. Service Roster & Port Mapping

| Service Name | Technology Stack | Default Port | Primary Responsibilities |
|---|---|---|---|
| `apps/web` | Next.js 14 App Router, TS, Tailwind CSS | `:3000` | Worker, verifier, and advocate responsive dashboards |
| `services/auth` | Python 3.12+ FastAPI, PyJWT | `:8001` | JWT issuance, refresh-token rotation, password hashing, RBAC |
| `services/earnings` | Python 3.12+ FastAPI | `:8002` | Shift logging, CSV parsing, OCR evidence presigning, verification queue |
| `services/anomaly` | Python 3.12+ FastAPI | `:8003` | Deterministic deduction outlier detection, sudden rate drop alarms |
| `services/analytics` | Python 3.12+ FastAPI | `:8004` | Worker personal insights, advocate aggregated k-anonymity metrics |
| `services/grievance` | Node.js 20+, TypeScript | `:4001` | Dispute ticketing, automated categorization, cluster escalation |
| `services/certificate` | Node.js 20+, TypeScript | `:4002` | Cryptographic certificate generation, PDF rendering data, public token verification |
| `packages/contracts` | TypeScript, Zod | N/A | Shared schemas, data contracts, and type definitions |

---

## 3. Data Infrastructure & Storage Architecture

### 3.1 Supabase PostgreSQL
The database acts as the single source of truth with Row Level Security (RLS) enforcing boundaries:
- `profiles`: Extends `auth.users`, bound to role `worker`, `verifier`, `advocate`, or `admin`.
- `refresh_sessions`: Stores cryptographically hashed refresh tokens with IP and user agent tracking. Supports instant single-session or all-session revocation.
- `earnings_shifts`: Core shift entries with financial breakdown (gross, net, deductions, tips, bonuses) and verification status (`pending`, `verified`, `discrepancy`, `unverifiable`).
- `screenshot_evidence`: Storage metadata, OCR extraction confidence, and raw extracted JSON.
- `verification_reviews`: Audit log of verifier decisions (`approve`, `flag_discrepancy`, `mark_unverifiable`).
- `grievances` & `grievance_clusters`: Worker dispute filings and aggregated collective action clusters.
- `income_certificates`: Tamper-proof certificate records with SHA-256 signatures and public lookup tokens.
- `audit_logs`: Immutable security audit log tracking all privileged actions.

### 3.2 Private Supabase Storage Bucket
- Bucket name: `evidence-private`
- Public access: **Disabled**.
- Objects are accessed exclusively via time-limited pre-signed URLs (maximum validity: 600 seconds).
- Path structure: `evidence-private/{worker_id}/{evidence_uuid}.{ext}`.

---

## 4. Authentication & Security Strategy

### 4.1 Token Architecture
- **Access Tokens:** Short-lived JWTs (15 minutes expiry) signed using `JWT_SECRET` (HS256 or RS256). Claims include:
  ```json
  {
    "sub": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "worker.maria@example.com",
    "role": "worker",
    "exp": 1728912900,
    "iat": 1728912000
  }
  ```
- **Refresh Tokens:** High-entropy random tokens stored hashed in `refresh_sessions`. Token rotation is enforced on every `/refresh` call (old token is revoked, new token is issued).
- **Service Role Isolation:** The Supabase `service_role` key is **STRICTLY FORBIDDEN** from being bundled into `apps/web`. The frontend communicates only with the backend APIs or with Supabase using the public `anon` key.

### 4.2 Role Privilege Escalation Prevention
- Public user registration (`POST /api/v1/auth/register`) enforces `role: "worker"`.
- The database trigger `on_auth_user_created` strictly assigns `role: "worker"`. Verifier, Advocate, and Admin roles must be granted by an administrator directly in the database.

---

## 5. Privacy-Preserving Analytics (K-Anonymity)

To prevent platform retaliation or de-anonymization of workers organizing against unfair platform practices:
- Any aggregate query for advocates or public reports enforces a minimum cohort size ($k \ge 5$).
- If fewer than 5 workers are present in a given slice (e.g., Deliveroo drivers in a specific zip code), `isSuppressedForPrivacy: true` is returned, and all averages, totals, and rates are masked as `null`.

---

## 6. Migration Ordering & Execution
Migrations are named with timestamps: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`.
1. Extensions (`uuid-ossp`, `pgcrypto`)
2. Enums (`user_role`, `verification_status`, `grievance_status`, `grievance_priority`, `verification_decision`)
3. Reference tables (`cities`, `zones`, `platforms`, `worker_categories`)
4. Core entities (`profiles`, `refresh_sessions`, `earnings_shifts`)
5. Evidence & audit tables (`screenshot_evidence`, `verification_reviews`)
6. Grievance tables & cluster links (`grievances`, `grievance_clusters`, `grievance_tags`)
7. Verification & certificate ledger (`income_certificates`, `audit_logs`)
8. Performance indexes
9. K-Anonymity stored functions (`get_advocate_platform_metrics`)
10. RLS policies and auth trigger hooks.
