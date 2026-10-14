# FairGig — Gig Worker Income & Rights Platform

FairGig is a full-stack, multi-service platform that empowers gig economy workers (rideshare drivers, food couriers, delivery agents) to track net earnings, detect unexplained algorithm deductions, organize collective dispute grievances, and generate cryptographically verifiable income certificates.

Built for a 6-hour collaborative hackathon between two developers on Windows environments.

---

## Architecture & System Overview

- **Frontend (`apps/web`):** Next.js 14 App Router, TypeScript, Tailwind CSS (Developer B).
- **Python Services (`services/*`):** FastAPI independent REST microservices for Auth, Earnings, Deterministic Anomaly Detection, and Analytics (Developer A).
- **Node.js Services (`services/*`):** TypeScript services for Grievance Clustering and Cryptographic Income Certificate Generation (Developer A).
- **Shared Contracts (`packages/contracts`):** Unified TypeScript interfaces and Zod schemas shared between frontend and backend.
- **Data & Storage:** Supabase PostgreSQL with Row Level Security (RLS) and Private Supabase Storage.

```
fairgig/
├── apps/
│   └── web/                # Next.js 14 App Router Frontend (:3000)
├── services/
│   ├── auth/               # FastAPI Auth & JWT Sessions (:8001)
│   ├── earnings/           # FastAPI Shifts & CSV Import (:8002)
│   ├── anomaly/            # FastAPI Deterministic Anomaly Engine (:8003)
│   ├── analytics/          # FastAPI Privacy-Preserving Insights (:8004)
│   ├── grievance/          # Node.js Grievance & Escalation (:4001)
│   └── certificate/        # Node.js Cryptographic Certificate (:4002)
├── packages/
│   └── contracts/          # Shared Zod schemas & TypeScript types
├── supabase/
│   ├── migrations/         # PostgreSQL DDL, Enums, Functions & RLS
│   └── seed/               # Initial reference data (cities, zones, platforms)
├── docs/
│   ├── architecture.md     # System design & data models
│   ├── api-contracts.md    # REST endpoints & sample payloads
│   ├── setup.md            # Windows developer setup guide
│   ├── deployment.md       # Production hosting & CI strategy
│   └── team-ownership.md   # Developer roles & Git collaboration rules
└── tests/                  # Testing infrastructure
```

---

## Quick Start (Windows)

### 1. Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher
- Python `3.10+`

### 2. Install & Build
```powershell
# Install Node workspaces
npm install

# Build shared contracts
npm run build:contracts

# Build web application
npm run build:web
```

### 3. Running Services Independently
Each service has a dedicated port and can be run independently:

| Service | Start Command | Default URL |
|---|---|---|
| **Web Frontend** | `npm run dev:web` | `http://localhost:3000` |
| **Auth Service** | `cd services/auth; uvicorn main:app --port 8001 --reload` | `http://localhost:8001/health` |
| **Earnings Service** | `cd services/earnings; uvicorn main:app --port 8002 --reload` | `http://localhost:8002/health` |
| **Anomaly Service** | `cd services/anomaly; uvicorn main:app --port 8003 --reload` | `http://localhost:8003/health` |
| **Analytics Service** | `cd services/analytics; uvicorn main:app --port 8004 --reload` | `http://localhost:8004/health` |
| **Grievance Service**| `npm run dev:grievance` | `http://localhost:4001/health` |
| **Certificate Service**| `npm run dev:certificate` | `http://localhost:4002/health` |

---

## Documentation Links
- [API Contracts](docs/api-contracts.md)
- [Architecture & Data Models](docs/architecture.md)
- [Team Ownership & Git Protocol](docs/team-ownership.md)
- [Local Developer Setup](docs/setup.md)
- [Production Deployment](docs/deployment.md)
