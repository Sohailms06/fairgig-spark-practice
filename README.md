# FairGig — Gig Worker Income & Rights Platform

> **Empowering gig economy workers with verifiable earnings, dispute advocacy, algorithmic anomaly detection, and transparent collective analytics.**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Frontend-black?logo=vercel)](https://vercel.com)
[![Render Microservices](https://img.shields.io/badge/Render-6%20Microservices-46E3B7?logo=render)](https://render.com)
[![Supabase Database](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

---

## 1. Problem & Solution

### The Problem
In Pakistan's rapidly expanding gig economy (ridesharing, food delivery, and courier logistics like inDrive, Careem, Foodpanda, and Bykea), gig workers face severe structural challenges:
1. **Unexplained Platform Deductions:** Opaque commission cuts ranging from 18% to 28%+ without clear transaction breakdowns.
2. **Financial Exclusion:** Gig workers lack formal paystubs or employment contracts, blocking them from securing rental housing, bank credit, microfinance loans, and visa approvals.
3. **Absence of Collective Leverage:** Workers are atomized; systemic wage suppression and missing incentive bonuses go unnoticed without aggregate dispute intelligence.

### The Solution: FairGig
FairGig provides a unified, rights-first platform that:
- **Aggregates multi-platform shift earnings** and verifies take-home net pay against municipal benchmarks.
- **Runs deterministic anomaly detection** to flag unfair surge fee deductions and statutory wage floor violations.
- **Issues cryptographically verifiable income certificates** (SHA-256 signed) that third-party landlords and financial institutions can verify publicly.
- **Powers collective advocate intelligence** using strict $k \ge 5$ differential privacy and k-anonymity safeguards.

---

## 2. Core User Roles & Workspaces

The platform includes a **1-Click Judge Quick-Switch** in the dashboard navigation for instant role evaluation:

| Role | Target User | Key Capabilities |
| :--- | :--- | :--- |
| **Worker Workspace** | Rideshare drivers, couriers | Log shifts, track net income, trigger anomaly scans, file dispute claims, generate cryptographic income certificates. |
| **Advocate Portal** | Labor advocates, union reps | Monitor city-wide platform commission trends, cluster recurring wage theft disputes, track worker vulnerability with $k \ge 5$ privacy suppression. |
| **Verifier Audit Queue** | Platform compliance auditors | Inspect uploaded pay stub OCR evidence in private storage, confirm shift authenticity, log verified audit decisions. |

---

## 3. System & Deployment Architecture

FairGig operates as a coordinated monorepo separating a responsive Next.js frontend from six specialized backend microservices communicating via unified Zod contracts:

```
fairgig/
├── apps/
│   └── web/                  # Next.js 14 App Router Frontend (Vercel)
├── packages/
│   └── contracts/            # Shared TypeScript types & Zod validation schemas
├── services/
│   ├── auth/                 # Python FastAPI — JWT authentication & sessions (:8001)
│   ├── earnings/             # Python FastAPI — Shifts ledger & evidence upload (:8002)
│   ├── anomaly/              # Python FastAPI — Deterministic statistical anomaly engine (:8003)
│   ├── analytics/            # Python FastAPI — K-Anonymity worker & advocate analytics (:8004)
│   ├── grievance/            # Node.js Express — Collective dispute clustering (:4001)
│   └── certificate/          # Node.js Express — Cryptographic certificate generator (:4002)
├── supabase/
│   ├── migrations/           # PostgreSQL DDL, RLS policies, enums, triggers
│   └── seed/                 # Seed data (platforms, municipal wage floors, zones)
├── render.yaml               # Infrastructure-as-code blueprint for all 6 backend services
└── tests/                    # Contract and end-to-end integration test suites
```

### Deployment Topology
- **Web Application:** Deployed on **Vercel** (`apps/web`), leveraging static generation, client caching, and Apple-inspired responsive ergonomics.
- **Backend Services:** Deployed on **Render** as 6 isolated web services with automated health check probes.
- **Ledger Database & Object Storage:** **Supabase Cloud PostgreSQL** with Row-Level Security (RLS) and private evidence storage buckets (`evidence-private`).

---

## 4. Environment Variables Reference

*(Variable names only — secrets and credentials must be configured securely in hosting dashboards)*

### Frontend (Vercel — `apps/web`)
```env
NEXT_PUBLIC_AUTH_SERVICE_URL
NEXT_PUBLIC_EARNINGS_SERVICE_URL
NEXT_PUBLIC_ANOMALY_SERVICE_URL
NEXT_PUBLIC_ANALYTICS_SERVICE_URL
NEXT_PUBLIC_GRIEVANCE_SERVICE_URL
NEXT_PUBLIC_CERTIFICATE_SERVICE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Backend Microservices (Render Shared Secrets)
```env
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
DATABASE_URL
SUPABASE_STORAGE_BUCKET_EVIDENCE
JWT_SECRET
JWT_ALGORITHM
FRONTEND_URL
ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS
MIN_K_ANONYMITY_GROUP_SIZE
PORT
```

---

## 5. 3-Minute Hackathon Judge Demonstration Sequence

To experience the entire end-to-end user journey in under 3 minutes:

### Minute 0:00 – 0:30: Worker Dashboard & Municipal Benchmarking
1. Open the application homepage and click **Launch Dashboard** (logged in as *Tariq Mehmood*).
2. Review the **Take-Home Net**, **Platform Deductions**, and **Effective Hourly Rate** KPI cards.
3. Observe the **Municipal Benchmark Card** comparing Tariq's hourly earnings against the verified Lahore median rate (+15.9% variance).

### Minute 0:30 – 1:00: Shift Logging & Real-Time Anomaly Engine
1. Click **Log Shift** in the top navigation or quick action bar.
2. Enter a shift with a disproportionate deduction (e.g., Gross PKR 6,500, Deductions PKR 1,625 = 25% platform cut).
3. Navigate to **Anomaly Insights** to observe the statistical detection engine flag the shift as a **Critical Outlier** (exceeding the 18% historical baseline).

### Minute 1:00 – 1:30: Grievance Escalation & Anonymous Community Board
1. Click **File Grievance** directly from the flagged anomaly card.
2. Submit a formal inquiry regarding the unexplained surge deduction.
3. Open **Community Feed** to view the public transparency feed where worker identities are automatically scrubbed into anonymous tokens (`ANON-XXXX`).

### Minute 1:30 – 2:00: Advocate Intelligence & K-Anonymity ($k \ge 5$)
1. In the sidebar, click the **Advocate** button under **Judge Quick-Switch**.
2. Review the aggregate intelligence portal: claimed underpayments, platform cut comparisons, and collective grievance clusters.
3. Notice the **Rawalpindi (cheetay)** cohort: because it has only $n = 2$ workers ($< 5$), all metrics are automatically **suppressed** with an active privacy safeguard notice.

### Minute 2:00 – 2:30: Verifier Queue & Paystub Audit
1. In the sidebar, click the **Verifier** button under **Judge Quick-Switch**.
2. Select a pending shift in the review queue (*Tariq Mehmood*, inDrive, PKR 6,200).
3. Review the OCR confidence match (94%) and verify the shift, stamping it into the permanent audit ledger.

### Minute 2:30 – 3:00: Cryptographic Income Certificate & Public Verification
1. Switch back to **Worker** and navigate to **Income Certificate**.
2. Select a date range and purpose (*Housing Rental* for *Cascade Ridge Apartments*), then click **Generate Official Certificate**.
3. View the generated certificate with its unique ID (`FG-2026-8K9P`) and SHA-256 cryptographic hash digest.
4. Click **View Public Verification Portal** to inspect the live `/verify/[id]` verification link that external landlords or banks can access.

---

## 6. Technical Architecture & Calculations

- **Net Earnings Formula:**  
  $$\text{Net Amount} = \text{Gross Amount} - \text{Platform Deductions} + \text{Tips}$$
- **Effective Hourly Rate:**  
  $$\text{Hourly Rate} = \frac{\text{Net Amount}}{\text{Hours Worked}}$$
- **Deduction Outlier Detection:**  
  $$\text{Deduction Ratio} = \frac{\text{Deductions}}{\text{Gross Amount}}$$
  If $\text{Ratio} > 0.22$ or $\text{Variance} > 2.5\sigma$ from the historical baseline, an anomaly incident is raised with an auditor recommendation.
- **K-Anonymity Enforcement:**  
  Cohorts where $\text{Sample Size} < k$ ($k = 5$ minimum) return `null` for averages and display `isSuppressedForPrivacy: true` to prevent re-identification of vulnerable workers.
- **Verifiable Certificate Signature:**  
  Certificates are bound by a SHA-256 hash digest calculated over:
  $$\text{SHA256}(\text{WorkerID} \parallel \text{Period} \parallel \text{NetIncome} \parallel \text{IssuedAt} \parallel \text{Salt})$$

---

## 7. Verification Status & Resilience Architecture

| Feature Component | Implementation Status | Resilience Strategy |
| :--- | :--- | :--- |
| **Worker Dashboard & KPIs** | Verified & Fully Operational | Real-time service query with live Supabase seed fallback |
| **Shared Contracts Validation** | Verified (8/8 Schemas Pass) | Zod schema validation across frontend and backend |
| **Statistical Anomaly Engine** | Verified & Contract Tested | Dedicated microservice with local mathematical fallback |
| **Grievance Clustering & Feed** | Verified & Privacy Tested | Automated PII masking with anonymous cohort tokens |
| **Verifier Review Queue** | Verified | Role-based workflow with simulated private S3 storage |
| **Cryptographic Certificates** | Verified & Publicly Verifiable | SHA-256 signature generator + standalone `/verify/[id]` portal |
| **Vercel Monorepo Build** | Verified (18/18 Routes Generated) | Pre-compiled `@fairgig/contracts` via `--prefix` scripts |

---

## 8. Local Development Setup

### Prerequisites
- Node.js `20.x` or higher
- Python `3.11.x`
- npm `10.x`

### Installation & Build
```powershell
# 1. Clone repository
git clone https://github.com/Sohailms06/fairgig-spark-practice.git
cd fairgig-spark-practice

# 2. Install workspace dependencies
npm install

# 3. Build shared contracts
npm run build:contracts

# 4. Start Next.js frontend development server
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 9. Vercel Deployment Settings

For deployment on Vercel:
- **Framework Preset:** `Next.js`
- **Root Directory:** `apps/web`
- **Include source files outside Root Directory:** `ON` (Enabled)
- **Install Command:** `npm install --prefix ../..` (configured in `apps/web/vercel.json`)
- **Build Command:** `npm run build` (configured in `apps/web/vercel.json`)
