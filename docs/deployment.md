# FairGig — Production & Hackathon Deployment Guide

This document details the deployment architecture, configuration parameters, container probes, hosting setup, and developer integration handover for the **FairGig Platform** across all six distributed microservices and the Next.js web application.

---

## 1. System Architecture & Port Allocation

```
                                  +---------------------------------------+
                                  |         apps/web (Next.js 14)         |
                                  |         Port 3000 / $PORT             |
                                  |     Vercel / Render Static Web        |
                                  +-------------------+-------------------+
                                                      |
                                     REST / HTTPS Bearer JWT Protocol
                                                      |
                 +------------------------------------+------------------------------------+
                 |                                                                         |
+----------------v------------------+  +-----------------------------------+  +------------v----------------------+
|       services/auth (:8001)       |  |     services/earnings (:8002)     |  |      services/anomaly (:8003)     |
| Python FastAPI + PyJWT + Argon2   |  | Python FastAPI + Supabase REST    |  | Python FastAPI + Z-Score / MAD    |
| Port: $PORT_AUTH / $PORT          |  | Port: $PORT_EARNINGS / $PORT      |  | Port: $PORT_ANOMALY / $PORT       |
+-----------------------------------+  +-----------------------------------+  +-----------------------------------+
                 |                                       |                                     |
+----------------v------------------+  +-----------------v-----------------+  +----------------v------------------+
|     services/analytics (:8004)    |  |     services/grievance (:4001)    |  |    services/certificate (:4002)   |
| Python FastAPI + K-Anonymity (k>=5)| | Node.js Express + TS Clustering   |  | Node.js Express + TS HTML Printer |
| Port: $PORT_ANALYTICS / $PORT     |  | Port: $PORT_GRIEVANCE / $PORT     |  | Port: $PORT_CERTIFICATE / $PORT   |
+-----------------------------------+  +-----------------------------------+  +-----------------------------------+
                 |                                       |                                     |
                 +---------------------------------------+-------------------------------------+
                                                         |
                                       +-----------------v-----------------+
                                       |       Supabase Cloud (PaaS)       |
                                       | - PostgreSQL 15+ (15 Tables)      |
                                       | - RLS Security Policies           |
                                       | - Private S3: evidence-private    |
                                       | - RPCs: Median Analytics (k>=5)   |
                                       +-----------------------------------+
```

---

## 2. Service Specifications & Startup Commands

All microservices bind to `0.0.0.0` and respect the platform-injected `PORT` environment variable (falling back to designated development ports if `PORT` is unset).

| Service | Directory | Tech Stack | Local Port | Production Start Command |
|---|---|---|---|---|
| **Auth** | `services/auth` | Python FastAPI | 8001 | `uvicorn services.auth.main:app --host 0.0.0.0 --port $PORT` |
| **Earnings** | `services/earnings` | Python FastAPI | 8002 | `uvicorn services.earnings.main:app --host 0.0.0.0 --port $PORT` |
| **Anomaly** | `services/anomaly` | Python FastAPI | 8003 | `uvicorn services.anomaly.main:app --host 0.0.0.0 --port $PORT` |
| **Analytics** | `services/analytics` | Python FastAPI | 8004 | `uvicorn services.analytics.main:app --host 0.0.0.0 --port $PORT` |
| **Grievance** | `services/grievance` | Node.js / Express | 4001 | `node services/grievance/dist/index.js` |
| **Certificate** | `services/certificate` | Node.js / Express | 4002 | `node services/certificate/dist/index.js` |
| **Web Frontend** | `apps/web` | Next.js 14 App Router | 3000 | `npm run start --workspace=apps/web` |

### Python Dependencies Installation
```bash
pip install -r services/auth/requirements.txt
pip install -r services/earnings/requirements.txt
pip install -r services/anomaly/requirements.txt
pip install -r services/analytics/requirements.txt
```

### Node.js Monorepo Build
```bash
npm install
npm run build:contracts
npm run build:grievance
npm run build:certificate
```

---

## 3. Required Hosting Environment Variables

To ensure security, secrets must NEVER be committed to Git. Configure these environment variable names in your hosting dashboard (e.g., Render, Railway, or VPS `.env`):

### Infrastructure & Database
- `SUPABASE_URL`: HTTPS endpoint for Supabase project (e.g., `https://xyz.supabase.co`)
- `SUPABASE_ANON_KEY`: Public client-safe anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Administrative service role key with full bypass RLS access
- `DATABASE_URL`: Direct PostgreSQL connection string (`postgresql://postgres:[PASSWORD]@...:5432/postgres`)
- `SUPABASE_STORAGE_BUCKET_EVIDENCE`: Name of private storage bucket (`evidence-private`)

### Authentication & Cryptographic Ledger
- `JWT_SECRET`: Minimum 32-character high-entropy secret string for signing and verifying tokens & certificate hashes
- `JWT_ALGORITHM`: `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Access token TTL (recommended: `15`)
- `REFRESH_TOKEN_EXPIRE_DAYS`: Refresh token session TTL (recommended: `30`)

### Privacy Safeguards
- `MIN_K_ANONYMITY_GROUP_SIZE`: Minimum distinct worker cohort threshold for aggregate reporting (default: `5`)

### Cross-Origin Resource Sharing (CORS) & Networking
- `FRONTEND_URL`: URL of the deployed web application (e.g., `https://fairgig.vercel.app` or `http://localhost:3000`)
- `PORT`: Automatically set by cloud host (Render / Railway / Heroku)

### Frontend Inter-Service URL Bindings (apps/web)
- `NEXT_PUBLIC_AUTH_SERVICE_URL`: URL of Auth service (e.g., `https://fairgig-auth.onrender.com`)
- `NEXT_PUBLIC_EARNINGS_SERVICE_URL`: URL of Earnings service
- `NEXT_PUBLIC_ANOMALY_SERVICE_URL`: URL of Anomaly service
- `NEXT_PUBLIC_ANALYTICS_SERVICE_URL`: URL of Analytics service
- `NEXT_PUBLIC_GRIEVANCE_SERVICE_URL`: URL of Grievance service
- `NEXT_PUBLIC_CERTIFICATE_SERVICE_URL`: URL of Certificate service

---

## 4. Health & Readiness Probes

Every backend service provides standardized probes for automated container orchestration, load balancing, and zero-downtime health checking:

### Liveness Probe (`GET /health` or `GET /api/v1/health`)
- **Status Code:** `200 OK`
- **Payload:**
```json
{
  "status": "ok",
  "service": "analytics",
  "version": "0.1.0",
  "timestamp": "2026-10-14T12:00:00.000Z"
}
```

### Readiness Probe (`GET /ready` or `GET /api/v1/ready`)
- **Checks:** Active connectivity to Supabase Cloud or database engine.
- **Status Code:** `200 OK` (when ready) or `503 Service Unavailable` (if database unreachable).
- **Payload:**
```json
{
  "status": "ready",
  "service": "analytics",
  "database": "supabase-cloud",
  "timestamp": "2026-10-14T12:00:00.000Z"
}
```

---

## 5. Render Blueprint Configuration (`render.yaml`)

For instant one-click deployment on Render, use the following `render.yaml` specification:

```yaml
services:
  # 1. Auth Service
  - type: web
    name: fairgig-auth
    env: python
    buildCommand: pip install -r services/auth/requirements.txt
    startCommand: uvicorn services.auth.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: JWT_SECRET
        sync: false

  # 2. Earnings Service
  - type: web
    name: fairgig-earnings
    env: python
    buildCommand: pip install -r services/earnings/requirements.txt
    startCommand: uvicorn services.earnings.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: JWT_SECRET
        sync: false

  # 3. Anomaly Service
  - type: web
    name: fairgig-anomaly
    env: python
    buildCommand: pip install -r services/anomaly/requirements.txt
    startCommand: uvicorn services.anomaly.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health

  # 4. Analytics Service
  - type: web
    name: fairgig-analytics
    env: python
    buildCommand: pip install -r services/analytics/requirements.txt
    startCommand: uvicorn services.analytics.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: JWT_SECRET
        sync: false

  # 5. Grievance Service
  - type: web
    name: fairgig-grievance
    env: node
    buildCommand: npm install && npm run build:contracts && npm run build:grievance
    startCommand: node services/grievance/dist/index.js
    healthCheckPath: /health
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: JWT_SECRET
        sync: false

  # 6. Certificate Service
  - type: web
    name: fairgig-certificate
    env: node
    buildCommand: npm install && npm run build:contracts && npm run build:certificate
    startCommand: node services/certificate/dist/index.js
    healthCheckPath: /health
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
```

---

## 6. Frontend Integration Handover (For Developer B — `apps/web`)

### Authentication Token Handling
Send standard Authorization header on all protected endpoints:
```http
Authorization: Bearer <jwt_access_token>
```

### Key Endpoint Catalog

#### A. Worker Analytics (`:8004`)
- **`GET /api/v1/analytics/worker?timeframe=last_30_days`**
  - **Auth:** Worker, Advocate, or Admin
  - **Returns:** Chart-ready `WorkerAnalyticsSummary`:
    ```json
    {
      "workerId": "ce05274e-5727-4a82-a8aa-4f6362ea7df9",
      "timeframe": "last_30_days",
      "totalGrossEarnings": 37600.00,
      "totalNetEarnings": 30080.00,
      "totalDeductions": 7520.00,
      "totalTips": 2100.00,
      "totalHoursWorked": 51.0,
      "effectiveHourlyRate": 589.80,
      "shiftsLoggedCount": 6,
      "verifiedShiftsCount": 6,
      "verificationRate": 1.0,
      "platformBreakdown": [
        {
          "platform": "indrive",
          "grossAmount": 37600.00,
          "netAmount": 30080.00,
          "hoursWorked": 51.0,
          "hourlyRate": 589.80,
          "shiftsCount": 6,
          "commissionPercentage": 20.0
        }
      ],
      "dailyEarningsTrend": [...],
      "weeklyEarningsTrend": [...],
      "monthlyEarningsTrend": [...],
      "cityBenchmark": {
        "cityName": "Lahore",
        "category": "rideshare",
        "cityMedianHourlyRate": 521.38,
        "workerHourlyRate": 589.80,
        "variancePercentage": 13.12,
        "workerCohortSize": 6,
        "isSuppressedForPrivacy": false,
        "status": "above_median"
      }
    }
    ```

#### B. Advocate Intelligence (`:8004`)
- **`GET /api/v1/analytics/advocate/overview`**
  - **Auth:** Advocate or Admin (Workers receive 403 Forbidden)
  - **Returns:** Aggregate intelligence with $k \ge 5$ privacy suppression.
- **`GET /api/v1/analytics/advocate/commissions`**
  - **Returns:** Platform deduction % trends (average, median, sample size).
- **`GET /api/v1/analytics/advocate/vulnerabilities?thresholdPercentage=20.0`**
  - **Returns:** Workers whose monthly income has fallen more than 20% across comparable periods.

#### C. Verifiable Income Certificate (`:4002`)
- **`POST /api/v1/certificates/generate`**
  - **Auth:** Worker
  - **Payload:**
    ```json
    {
      "startDate": "2026-10-01",
      "endDate": "2026-10-14",
      "purpose": "housing_rental",
      "recipientName": "Cascade Ridge Apartments",
      "includePlatforms": ["indrive", "bykea"]
    }
    ```
  - **Returns (201 Created):** `IncomeCertificate` JSON with cryptographic signature.
- **`GET /api/v1/certificates/:id/render-html`**
  - **Returns:** Clean, printable standalone HTML styled for A4 page printing with `@media print`.
- **`GET /api/v1/certificates/public-verify?certificateNumber=...&token=...`**
  - **Auth:** None (Public for Landlords / Lenders)
  - **Returns:** Tamper-proof validation status with masked worker name.
